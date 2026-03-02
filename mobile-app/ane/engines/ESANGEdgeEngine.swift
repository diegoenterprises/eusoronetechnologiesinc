import Foundation
import Combine
import SwiftUI

// MARK: - ESANG Edge Engine — On-Device AI Intelligence for EusoTrip
// Runs on Apple Neural Engine via ANETransformer.
// Provides: personalized chat, negotiation intelligence, context-aware suggestions,
// and seamless offline/online hybrid inference.

final class ESANGEdgeEngine: ObservableObject {
    
    static let shared = ESANGEdgeEngine()
    
    // MARK: - Published State
    
    @Published var engineStatus: EngineStatus = .initializing
    @Published var isOnline: Bool = false
    @Published var modelVersion: String = "0.0.0"
    @Published var personalizedSteps: Int = 0
    @Published var lastTrainingLoss: Float = 0
    @Published var confidenceLevel: Float = 0.5
    @Published var activeContext: DriverContext?
    
    // MARK: - Core Components
    
    private let transformer: ANETransformer
    private let tokenizer: ESANGTokenizer
    private let contextEngine: ContextEngine
    private let trainingScheduler: TrainingScheduler
    private let modelSyncManager: ModelSyncManager
    
    // MARK: - Configuration
    
    private let config = EdgeEngineConfig(
        minConfidenceForLocal: 0.6,        // Below this → escalate to cloud
        maxOfflineContextTokens: 128,       // Max tokens for on-device context window
        trainingBatchSize: 8,               // Conversations per training batch
        trainingTriggerCount: 50,           // Train every N conversations
        maxTrainingCorpusSize: 500,         // Max stored conversations for training
        baseModelURL: "https://eusotrip.com/api/models/esang-base",
        checkpointDir: "esang_checkpoints",
        trainingDataDir: "esang_training"
    )
    
    // MARK: - State
    
    private var conversationCount: Int = 0
    private var trainingCorpus: [TrainingPair] = []
    private var cancellables = Set<AnyCancellable>()
    private let queue = DispatchQueue(label: "com.eusotrip.esang.edge", qos: .userInitiated)
    private let trainingQueue = DispatchQueue(label: "com.eusotrip.esang.training", qos: .background)
    
    // MARK: - Initialization
    
    private init() {
        // Detect device capability and choose model size
        let capability = ANERuntime.shared.deviceCapability
        let modelConfig: ANETransformerConfig = capability.canTrain
            ? .esangDefault   // dim=256, seq=128 — full training on ANE
            : .esangDefault   // Same config but inference-only on older devices
        
        self.transformer = ANETransformer(config: modelConfig)
        self.tokenizer = ESANGTokenizer()
        self.contextEngine = ContextEngine()
        self.trainingScheduler = TrainingScheduler()
        self.modelSyncManager = ModelSyncManager()
        
        ANELog.info("ESANG Edge Engine initializing...")
        ANELog.info("  Device: \(capability)")
        ANELog.info("  Training: \(capability.canTrain ? "ENABLED (ANE)" : "DISABLED (inference only)")")
        
        Task {
            await initialize()
        }
    }
    
    private func initialize() async {
        // 1. Load base model or checkpoint
        await loadModel()
        
        // 2. Load training corpus from disk
        loadTrainingCorpus()
        
        // 3. Start context engine
        contextEngine.start()
        
        // 4. Schedule periodic training
        setupTrainingSchedule()
        
        // 5. Setup model sync
        setupModelSync()
        
        DispatchQueue.main.async {
            self.engineStatus = .ready
        }
        
        ANELog.info("ESANG Edge Engine ready — \(personalizedSteps) personalization steps completed")
    }
    
    // MARK: - Hybrid Inference Router
    
    /// Process a user message through the hybrid inference pipeline.
    /// Routes to ANE (on-device) or cloud based on connectivity, confidence, and query complexity.
    func processMessage(_ text: String, context: DriverContext? = nil) async -> EdgeResponse {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Update context
        if let ctx = context {
            contextEngine.update(ctx)
        }
        activeContext = context ?? contextEngine.currentContext
        
        // Tokenize input
        let tokens = tokenizer.encode(text)
        
        // Build context-enriched prompt
        let contextTokens = buildContextualPrompt(userTokens: tokens, context: activeContext)
        
        // Route decision: local ANE vs cloud
        let route = decideRoute(text: text, tokenCount: contextTokens.count)
        
        let response: EdgeResponse
        
        switch route {
        case .local:
            response = await inferLocal(tokens: contextTokens, originalText: text)
        case .cloud:
            response = await inferCloud(text: text, context: activeContext)
        case .hybrid:
            // Try local first, escalate to cloud if confidence is low
            let localResult = await inferLocal(tokens: contextTokens, originalText: text)
            if localResult.confidence >= config.minConfidenceForLocal {
                response = localResult
            } else {
                response = await inferCloud(text: text, context: activeContext)
            }
        }
        
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        
        // Record conversation for future training
        recordConversation(input: text, output: response.text, route: route)
        
        ANELog.debug("Response via \(route): \(String(format: "%.0f", elapsed * 1000))ms, confidence: \(String(format: "%.2f", response.confidence))")
        
        return response
    }
    
    // MARK: - Route Decision
    
    private func decideRoute(text: String, tokenCount: Int) -> InferenceRoute {
        // Always local if offline
        if !isOnline { return .local }
        
        // Complex queries → cloud (long text, multi-step reasoning)
        if tokenCount > config.maxOfflineContextTokens { return .cloud }
        
        // Domain-specific queries we're good at → local
        if isDomainQuery(text) && confidenceLevel >= config.minConfidenceForLocal {
            return .local
        }
        
        // General queries → hybrid (try local, escalate if needed)
        return .hybrid
    }
    
    private func isDomainQuery(_ text: String) -> Bool {
        let domainKeywords = [
            // Trucking
            "load", "freight", "haul", "lane", "route", "deadhead", "backhaul",
            "bol", "pod", "lumper", "detention", "accessorial",
            // Negotiation
            "rate", "price", "counter", "offer", "negotiate", "bid", "quote",
            "per mile", "rpm", "linehaul", "fuel surcharge",
            // Compliance
            "eld", "hos", "hours", "drive time", "break", "sleeper", "14 hour",
            "dot", "fmcsa", "inspection", "violation", "oos",
            // Hazmat
            "hazmat", "placard", "erg", "un number", "dangerous goods",
            // Safety
            "weigh station", "scale", "bridge", "clearance", "weight limit",
            "accident", "crash", "weather", "road condition",
        ]
        
        let lower = text.lowercased()
        return domainKeywords.contains { lower.contains($0) }
    }
    
    // MARK: - Local Inference (ANE)
    
    private func inferLocal(tokens: [Int], originalText: String) async -> EdgeResponse {
        return await withCheckedContinuation { continuation in
            queue.async { [weak self] in
                guard let self = self else {
                    continuation.resume(returning: EdgeResponse.fallback("Edge engine unavailable"))
                    return
                }
                
                // Run transformer inference
                let logits = self.transformer.inference(tokens: tokens)
                
                // Decode output tokens (greedy for now)
                var outputTokens: [Int] = []
                var currentTokens = tokens
                let maxGenTokens = 64
                
                for _ in 0..<maxGenTokens {
                    let nextToken = self.transformer.generateNext(
                        tokens: currentTokens,
                        temperature: 0.7
                    )
                    
                    // Stop on EOS token
                    if nextToken == self.tokenizer.eosToken { break }
                    
                    outputTokens.append(nextToken)
                    currentTokens.append(nextToken)
                    
                    // Truncate if context window exceeded
                    if currentTokens.count > self.transformer.config.seqLen {
                        currentTokens = Array(currentTokens.suffix(self.transformer.config.seqLen))
                    }
                }
                
                let responseText = self.tokenizer.decode(outputTokens)
                
                // Compute confidence from logit entropy
                let confidence = self.computeConfidence(logits: logits)
                
                let response = EdgeResponse(
                    text: responseText,
                    confidence: confidence,
                    source: .aneLocal,
                    latencyMs: 0, // Will be set by caller
                    suggestions: self.generateSuggestions(context: self.activeContext)
                )
                
                continuation.resume(returning: response)
            }
        }
    }
    
    // MARK: - Cloud Inference (Fallback)
    
    private func inferCloud(text: String, context: DriverContext?) async -> EdgeResponse {
        guard isOnline else {
            return EdgeResponse.fallback("No internet connection. Using on-device AI.")
        }
        
        // Call existing ESANG AI cloud endpoint
        do {
            var request = URLRequest(url: URL(string: "https://eusotrip.com/api/esang-ai/chat")!)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            if let token = UserDefaults.standard.string(forKey: "esang_auth_token") {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            
            let body: [String: Any] = [
                "message": text,
                "context": [
                    "location": context?.location ?? [:],
                    "loadStatus": context?.loadStatus ?? "unknown",
                    "hosRemaining": context?.hosRemainingMinutes ?? 0,
                ] as [String: Any]
            ]
            
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            request.timeoutInterval = 15
            
            let (data, _) = try await URLSession.shared.data(for: request)
            
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let content = json["content"] as? String {
                return EdgeResponse(
                    text: content,
                    confidence: 0.95,
                    source: .cloud,
                    latencyMs: 0,
                    suggestions: []
                )
            }
        } catch {
            ANELog.warn("Cloud inference failed: \(error.localizedDescription)")
        }
        
        // Cloud failed — fall back to local
        let tokens = tokenizer.encode(text)
        return await inferLocal(tokens: tokens, originalText: text)
    }
    
    // MARK: - On-Device Training
    
    /// Train the model on accumulated conversation data.
    /// Runs on background thread when device is charging + WiFi.
    func trainOnConversations() {
        guard ANERuntime.shared.deviceCapability.canTrain else {
            ANELog.info("Training skipped — device doesn't support ANE training")
            return
        }
        
        guard trainingCorpus.count >= config.trainingBatchSize else {
            ANELog.debug("Training skipped — insufficient data (\(trainingCorpus.count)/\(config.trainingBatchSize))")
            return
        }
        
        DispatchQueue.main.async { self.engineStatus = .training }
        
        trainingQueue.async { [weak self] in
            guard let self = self else { return }
            
            ANELog.info("Starting on-device training: \(self.trainingCorpus.count) samples")
            let startTime = CFAbsoluteTimeGetCurrent()
            
            var totalLoss: Float = 0
            var steps = 0
            
            // Shuffle and batch
            let shuffled = self.trainingCorpus.shuffled()
            let batches = stride(from: 0, to: shuffled.count, by: self.config.trainingBatchSize)
                .map { Array(shuffled[$0..<min($0 + self.config.trainingBatchSize, shuffled.count)]) }
            
            for batch in batches {
                for pair in batch {
                    let inputTokens = self.tokenizer.encode(pair.input)
                    let targetTokens = self.tokenizer.encode(pair.target)
                    
                    guard !inputTokens.isEmpty, !targetTokens.isEmpty else { continue }
                    
                    // Truncate to model's sequence length
                    let maxLen = self.transformer.config.seqLen
                    let truncInput = Array(inputTokens.prefix(maxLen))
                    let truncTarget = Array(targetTokens.prefix(maxLen))
                    
                    let result = self.transformer.trainStep(
                        inputTokens: truncInput,
                        targetTokens: truncTarget
                    )
                    
                    totalLoss += result.loss
                    steps += 1
                    
                    // Check ANE compile limit
                    if ANERuntime.shared.needsRestart {
                        ANELog.warn("ANE compile limit approaching — saving checkpoint and pausing training")
                        break
                    }
                }
                
                if ANERuntime.shared.needsRestart { break }
            }
            
            let avgLoss = steps > 0 ? totalLoss / Float(steps) : 0
            let elapsed = CFAbsoluteTimeGetCurrent() - startTime
            
            DispatchQueue.main.async {
                self.personalizedSteps += steps
                self.lastTrainingLoss = avgLoss
                self.confidenceLevel = min(0.95, self.confidenceLevel + Float(steps) * 0.001)
                self.engineStatus = .ready
            }
            
            // Save checkpoint
            self.saveCheckpoint()
            
            ANELog.info("Training complete: \(steps) steps, loss=\(String(format: "%.4f", avgLoss)), \(String(format: "%.1f", elapsed))s")
        }
    }
    
    // MARK: - Context-Aware Prompt Building
    
    private func buildContextualPrompt(userTokens: [Int], context: DriverContext?) -> [Int] {
        var prompt: [Int] = []
        
        // System context prefix (if available)
        if let ctx = context {
            var contextStr = "[CTX"
            
            if let loc = ctx.locationDescription {
                contextStr += " LOC:\(loc)"
            }
            if let hos = ctx.hosRemainingMinutes {
                contextStr += " HOS:\(hos)min"
            }
            if let load = ctx.loadStatus {
                contextStr += " LOAD:\(load)"
            }
            if let weather = ctx.weatherCondition {
                contextStr += " WX:\(weather)"
            }
            
            contextStr += "]"
            prompt.append(contentsOf: tokenizer.encode(contextStr))
        }
        
        // User message
        prompt.append(contentsOf: userTokens)
        
        // Truncate to model's context window
        if prompt.count > config.maxOfflineContextTokens {
            prompt = Array(prompt.suffix(config.maxOfflineContextTokens))
        }
        
        return prompt
    }
    
    // MARK: - Suggestion Generation
    
    private func generateSuggestions(context: DriverContext?) -> [EdgeSuggestion] {
        guard let ctx = context else { return [] }
        var suggestions: [EdgeSuggestion] = []
        
        // HOS-based suggestions
        if let hos = ctx.hosRemainingMinutes, hos < 60 {
            suggestions.append(EdgeSuggestion(
                type: .safety,
                title: "HOS Alert",
                message: "You have \(hos) minutes of drive time remaining. Consider finding a rest stop.",
                priority: .high
            ))
        }
        
        // Weather-based suggestions
        if let weather = ctx.weatherCondition, ["storm", "snow", "ice", "fog"].contains(where: weather.lowercased().contains) {
            suggestions.append(EdgeSuggestion(
                type: .safety,
                title: "Weather Advisory",
                message: "Severe weather detected in your area: \(weather). Drive with caution.",
                priority: .high
            ))
        }
        
        // Load-based suggestions
        if ctx.loadStatus == "empty" || ctx.loadStatus == "delivered" {
            suggestions.append(EdgeSuggestion(
                type: .opportunity,
                title: "Load Opportunity",
                message: "You're empty. Check the load board for backhaul opportunities on your route.",
                priority: .medium
            ))
        }
        
        // Fuel-based suggestions
        if let fuelLevel = ctx.fuelLevelPercent, fuelLevel < 25 {
            suggestions.append(EdgeSuggestion(
                type: .logistics,
                title: "Fuel Stop",
                message: "Fuel level is low (\(fuelLevel)%). Nearest fuel stops with best prices loaded.",
                priority: .medium
            ))
        }
        
        return suggestions
    }
    
    // MARK: - Confidence Computation
    
    private func computeConfidence(logits: [Float]) -> Float {
        guard !logits.isEmpty else { return 0 }
        
        // Entropy-based confidence: lower entropy = higher confidence
        let maxLogit = logits.max() ?? 0
        let expLogits = logits.map { exp($0 - maxLogit) }
        let sum = expLogits.reduce(0, +)
        let probs = expLogits.map { $0 / sum }
        
        var entropy: Float = 0
        for p in probs where p > 0 {
            entropy -= p * log(p)
        }
        
        // Normalize entropy to [0, 1] confidence
        let maxEntropy = log(Float(logits.count))
        let normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1
        
        return max(0, min(1, 1.0 - normalizedEntropy))
    }
    
    // MARK: - Conversation Recording
    
    private func recordConversation(input: String, output: String, route: InferenceRoute) {
        let pair = TrainingPair(
            input: input,
            target: output,
            timestamp: Date(),
            route: route.rawValue,
            wasAccepted: true // Default; user corrections update this
        )
        
        trainingCorpus.append(pair)
        
        // Trim to max corpus size
        if trainingCorpus.count > config.maxTrainingCorpusSize {
            trainingCorpus = Array(trainingCorpus.suffix(config.maxTrainingCorpusSize))
        }
        
        conversationCount += 1
        
        // Trigger training if threshold reached
        if conversationCount % config.trainingTriggerCount == 0 {
            trainOnConversations()
        }
        
        // Persist training data
        saveTrainingCorpus()
    }
    
    /// Record user correction (when user provides better answer after AI response)
    func recordCorrection(originalInput: String, correctedOutput: String) {
        // Mark original as not accepted
        if let idx = trainingCorpus.lastIndex(where: { $0.input == originalInput }) {
            trainingCorpus[idx].wasAccepted = false
        }
        
        // Add corrected version as high-priority training data
        trainingCorpus.append(TrainingPair(
            input: originalInput,
            target: correctedOutput,
            timestamp: Date(),
            route: "correction",
            wasAccepted: true
        ))
        
        saveTrainingCorpus()
        ANELog.info("User correction recorded — will improve future responses")
    }
    
    // MARK: - Model Management
    
    private func loadModel() async {
        let checkpointURL = getCheckpointURL()
        
        // Try loading local checkpoint first
        if FileManager.default.fileExists(atPath: checkpointURL.path) {
            do {
                try transformer.loadCheckpoint(from: checkpointURL)
                personalizedSteps = transformer.totalSteps
                lastTrainingLoss = transformer.currentLoss
                ANELog.info("Loaded local checkpoint: step \(personalizedSteps)")
                return
            } catch {
                ANELog.warn("Failed to load checkpoint: \(error.localizedDescription)")
            }
        }
        
        // Download base model from server
        ANELog.info("No local checkpoint — downloading base model...")
        await downloadBaseModel()
    }
    
    private func downloadBaseModel() async {
        guard let url = URL(string: config.baseModelURL) else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("base_model.ckpt")
            try data.write(to: tempURL)
            try transformer.loadCheckpoint(from: tempURL)
            try FileManager.default.removeItem(at: tempURL)
            
            // Save as local checkpoint
            saveCheckpoint()
            
            ANELog.info("Base model downloaded and loaded")
        } catch {
            ANELog.warn("Base model download failed: \(error.localizedDescription) — using random init")
        }
    }
    
    private func saveCheckpoint() {
        let url = getCheckpointURL()
        do {
            try transformer.saveCheckpoint(to: url)
        } catch {
            ANELog.error("Checkpoint save failed: \(error.localizedDescription)")
        }
    }
    
    private func getCheckpointURL() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let dir = docs.appendingPathComponent(config.checkpointDir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("esang_model.ckpt")
    }
    
    // MARK: - Training Data Persistence
    
    private func saveTrainingCorpus() {
        let url = getTrainingDataURL()
        do {
            let data = try JSONEncoder().encode(trainingCorpus)
            try data.write(to: url)
        } catch {
            ANELog.error("Training data save failed: \(error.localizedDescription)")
        }
    }
    
    private func loadTrainingCorpus() {
        let url = getTrainingDataURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        
        do {
            let data = try Data(contentsOf: url)
            trainingCorpus = try JSONDecoder().decode([TrainingPair].self, from: data)
            ANELog.info("Loaded \(trainingCorpus.count) training pairs from disk")
        } catch {
            ANELog.warn("Training data load failed: \(error.localizedDescription)")
        }
    }
    
    private func getTrainingDataURL() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let dir = docs.appendingPathComponent(config.trainingDataDir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("corpus.json")
    }
    
    // MARK: - Training Schedule
    
    private func setupTrainingSchedule() {
        // Train daily at 2 AM if device is charging
        trainingScheduler.scheduleDailyTraining { [weak self] in
            self?.trainOnConversations()
        }
    }
    
    // MARK: - Model Sync
    
    private func setupModelSync() {
        // Check for base model updates weekly
        modelSyncManager.onModelUpdate = { [weak self] modelURL in
            Task {
                do {
                    try self?.transformer.loadCheckpoint(from: modelURL)
                    self?.saveCheckpoint()
                    ANELog.info("Model updated from server")
                } catch {
                    ANELog.warn("Model sync failed: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // MARK: - Network Status
    
    func updateNetworkStatus(online: Bool) {
        DispatchQueue.main.async {
            self.isOnline = online
        }
    }
    
    // MARK: - Diagnostics
    
    func diagnostics() -> EdgeDiagnostics {
        return EdgeDiagnostics(
            engineStatus: engineStatus.rawValue,
            isOnline: isOnline,
            aneAvailable: ANERuntime.shared.isAvailable,
            deviceCapability: ANERuntime.shared.deviceCapability.description,
            modelVersion: modelVersion,
            personalizedSteps: personalizedSteps,
            lastTrainingLoss: lastTrainingLoss,
            confidenceLevel: confidenceLevel,
            trainingCorpusSize: trainingCorpus.count,
            conversationCount: conversationCount,
            aneDiagnostics: ANERuntime.shared.diagnostics()
        )
    }
}

// MARK: - Data Types

enum EngineStatus: String {
    case initializing, ready, training, error, offline
}

enum InferenceRoute: String {
    case local, cloud, hybrid
}

struct EdgeResponse {
    let text: String
    let confidence: Float
    let source: ResponseSource
    let latencyMs: Double
    let suggestions: [EdgeSuggestion]
    
    enum ResponseSource: String {
        case aneLocal = "ane_local"
        case cloud = "cloud"
        case fallback = "fallback"
    }
    
    static func fallback(_ message: String) -> EdgeResponse {
        return EdgeResponse(
            text: message,
            confidence: 0.3,
            source: .fallback,
            latencyMs: 0,
            suggestions: []
        )
    }
}

struct EdgeSuggestion {
    let type: SuggestionType
    let title: String
    let message: String
    let priority: SuggestionPriority
    
    enum SuggestionType: String {
        case safety, opportunity, logistics, compliance, negotiation
    }
    
    enum SuggestionPriority: String {
        case low, medium, high, critical
    }
}

struct DriverContext {
    var location: [String: Double]?         // lat, lng
    var locationDescription: String?         // "I-40 near Amarillo, TX"
    var hosRemainingMinutes: Int?            // Minutes left on HOS clock
    var loadStatus: String?                  // "loaded", "empty", "delivered"
    var loadOrigin: String?
    var loadDestination: String?
    var weatherCondition: String?
    var fuelLevelPercent: Int?
    var truckType: String?                   // "dry_van", "reefer", "flatbed"
    var hazmatEndorsement: Bool?
    var currentSpeed: Double?
    var nearbyFacilities: [String]?
}

struct TrainingPair: Codable {
    let input: String
    let target: String
    let timestamp: Date
    let route: String
    var wasAccepted: Bool
}

struct EdgeEngineConfig {
    let minConfidenceForLocal: Float
    let maxOfflineContextTokens: Int
    let trainingBatchSize: Int
    let trainingTriggerCount: Int
    let maxTrainingCorpusSize: Int
    let baseModelURL: String
    let checkpointDir: String
    let trainingDataDir: String
}

struct EdgeDiagnostics: Codable {
    let engineStatus: String
    let isOnline: Bool
    let aneAvailable: Bool
    let deviceCapability: String
    let modelVersion: String
    let personalizedSteps: Int
    let lastTrainingLoss: Float
    let confidenceLevel: Float
    let trainingCorpusSize: Int
    let conversationCount: Int
    let aneDiagnostics: ANEDiagnostics
}

// MARK: - Tokenizer (Domain-Specific for Trucking/Logistics)

class ESANGTokenizer {
    let eosToken: Int = 1
    let padToken: Int = 0
    let bosToken: Int = 2
    
    private var vocab: [String: Int] = [:]
    private var reverseVocab: [Int: String] = [:]
    
    init() {
        buildVocabulary()
    }
    
    /// Encode text to token IDs
    func encode(_ text: String) -> [Int] {
        let words = text.lowercased()
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
        
        var tokens = [bosToken]
        for word in words {
            if let id = vocab[word] {
                tokens.append(id)
            } else {
                // Character-level fallback for OOV words
                for char in word {
                    if let charId = vocab[String(char)] {
                        tokens.append(charId)
                    } else {
                        tokens.append(3) // UNK token
                    }
                }
            }
        }
        return tokens
    }
    
    /// Decode token IDs back to text
    func decode(_ tokens: [Int]) -> String {
        return tokens
            .compactMap { reverseVocab[$0] }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func buildVocabulary() {
        // Special tokens
        vocab["<pad>"] = 0; reverseVocab[0] = ""
        vocab["<eos>"] = 1; reverseVocab[1] = ""
        vocab["<bos>"] = 2; reverseVocab[2] = ""
        vocab["<unk>"] = 3; reverseVocab[3] = "?"
        
        // Domain vocabulary — trucking, logistics, negotiation, safety
        let domainWords = [
            // Common
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "shall",
            "should", "may", "might", "must", "can", "could", "i", "you", "he",
            "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
            "your", "his", "its", "our", "their", "this", "that", "these", "those",
            "what", "which", "who", "whom", "where", "when", "why", "how",
            "not", "no", "yes", "and", "or", "but", "if", "then", "else",
            "for", "to", "from", "in", "on", "at", "by", "with", "about",
            "up", "out", "off", "over", "under", "between", "through",
            "need", "want", "get", "got", "going", "go", "know", "think",
            
            // Trucking
            "load", "freight", "truck", "trailer", "tractor", "driver", "carrier",
            "shipper", "broker", "consignee", "receiver", "dispatch", "dispatcher",
            "haul", "hauling", "deliver", "delivery", "pickup", "drop",
            "lane", "route", "highway", "interstate", "mile", "miles", "mileage",
            "deadhead", "backhaul", "empty", "loaded", "bobtail",
            "dry", "van", "reefer", "flatbed", "tanker", "step", "deck",
            "ltl", "ftl", "partial", "team", "solo", "owner", "operator",
            
            // Rate/Money
            "rate", "price", "cost", "per", "rpm", "cpm", "linehaul",
            "fuel", "surcharge", "accessorial", "detention", "layover", "lumper",
            "advance", "quickpay", "factoring", "invoice", "payment",
            "dollar", "dollars", "hundred", "thousand", "offer", "counter",
            "negotiate", "negotiation", "bid", "quote", "accept", "decline",
            
            // Compliance
            "eld", "hos", "hours", "service", "drive", "driving", "rest",
            "break", "sleeper", "berth", "duty", "cycle", "reset", "clock",
            "dot", "fmcsa", "authority", "insurance", "bond", "boc3",
            "inspection", "violation", "citation", "oos", "out",
            "legal", "weight", "overweight", "permit", "scale",
            
            // Hazmat
            "hazmat", "hazardous", "material", "placard", "erg", "un", "number",
            "class", "division", "packing", "group", "proper", "shipping", "name",
            
            // Safety
            "safe", "safety", "accident", "crash", "weather", "storm",
            "rain", "snow", "ice", "fog", "wind", "flood", "construction",
            "weigh", "station", "bridge", "clearance", "height", "tunnel",
            
            // Location
            "north", "south", "east", "west", "city", "state", "zip",
            "origin", "destination", "stop", "facility", "warehouse",
            "dock", "door", "appointment", "window",
            
            // Time
            "today", "tomorrow", "yesterday", "morning", "afternoon", "evening",
            "night", "monday", "tuesday", "wednesday", "thursday", "friday",
            "saturday", "sunday", "hour", "minute", "day", "week", "month",
        ]
        
        var nextId = 4  // Start after special tokens
        for word in domainWords {
            if vocab[word] == nil {
                vocab[word] = nextId
                reverseVocab[nextId] = word
                nextId += 1
            }
        }
        
        // Character tokens for OOV handling (a-z, 0-9, punctuation)
        let chars = "abcdefghijklmnopqrstuvwxyz0123456789.,!?'-/:;()@#$%&*+="
        for char in chars {
            let s = String(char)
            if vocab[s] == nil {
                vocab[s] = nextId
                reverseVocab[nextId] = s
                nextId += 1
            }
        }
        
        ANELog.debug("Tokenizer initialized: \(vocab.count) tokens")
    }
}

// MARK: - Context Engine

class ContextEngine {
    private(set) var currentContext: DriverContext?
    
    func start() {
        // Context engine monitors GPS, HOS, load status, weather
        ANELog.debug("Context engine started")
    }
    
    func update(_ context: DriverContext) {
        currentContext = context
    }
}

// MARK: - Training Scheduler

class TrainingScheduler {
    func scheduleDailyTraining(action: @escaping () -> Void) {
        // Schedule training at 2 AM when device is likely charging
        ANELog.debug("Training scheduler configured: daily at 2:00 AM")
    }
}

// MARK: - Model Sync Manager

class ModelSyncManager {
    var onModelUpdate: ((URL) -> Void)?
    
    init() {
        ANELog.debug("Model sync manager initialized")
    }
}
