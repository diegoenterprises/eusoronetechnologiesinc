import Foundation
import Combine
import SwiftUI

// MARK: - ESANG AI Chat Integration for EusoTrip
class ESANGAIChatIntegration: NSObject, ObservableObject {
    static let shared = ESANGAIChatIntegration()
    
    // MARK: - Published Properties
    @Published var chatMessages: [ChatMessage] = []
    @Published var isConnected: Bool = false
    @Published var isProcessing: Bool = false
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var aiAssistantState: AIAssistantState = .idle
    @Published var negotiationContext: NegotiationContext?
    @Published var marketInsights: [MarketInsight] = []
    @Published var driverRecommendations: [DriverRecommendation] = []
    @Published var loadOptimizations: [LoadOptimization] = []
    
    // MARK: - Private Properties
    private var cancellables = Set<AnyCancellable>()
    private let chatBackendURL = "https://api.eusotrip.com/esang-ai/chat"
    private let webSocketURL = "wss://api.eusotrip.com/esang-ai/ws"
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession
    private var messageQueue: [ChatMessage] = []
    private var reconnectAttempts: Int = 0
    private let maxReconnectAttempts = 5
    
    // MARK: - Configuration
    private let config = ESANGChatConfig(
        maxMessageLength: 5000,
        maxHistorySize: 100,
        autoReconnect: true,
        connectionTimeout: 30.0,
        messageTimeout: 60.0,
        enableContextTracking: true,
        enableMarketInsights: true,
        enableDriverOptimization: true
    )
    
    override init() {
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.urlSession = URLSession(configuration: config)
        super.init()
        initializeChat()
    }
    
    // MARK: - Initialization
    private func initializeChat() {
        setupWebSocketConnection()
        loadChatHistory()
        setupAutoReconnect()
    }
    
    // MARK: - WebSocket Connection Management
    private func setupWebSocketConnection() {
        guard let url = URL(string: webSocketURL) else {
            print("Invalid WebSocket URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = config.connectionTimeout
        
        // Add authentication headers
        if let token = UserDefaults.standard.string(forKey: "esang_auth_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        webSocketTask = urlSession.webSocketTask(with: request)
        webSocketTask?.resume()
        
        DispatchQueue.main.async {
            self.connectionStatus = .connecting
        }
        
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleWebSocketMessage(message)
                self?.receiveMessage() // Continue receiving
                
            case .failure(let error):
                print("WebSocket error: \(error)")
                self?.handleConnectionError(error)
            }
        }
    }
    
    private func handleWebSocketMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            if let data = text.data(using: .utf8) {
                handleIncomingData(data)
            }
        case .data(let data):
            handleIncomingData(data)
        @unknown default:
            break
        }
    }
    
    private func handleIncomingData(_ data: Data) {
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            if let response = try? decoder.decode(ChatResponse.self, from: data) {
                DispatchQueue.main.async {
                    self.processChatResponse(response)
                }
            } else if let insight = try? decoder.decode(MarketInsight.self, from: data) {
                DispatchQueue.main.async {
                    self.marketInsights.append(insight)
                }
            } else if let optimization = try? decoder.decode(LoadOptimization.self, from: data) {
                DispatchQueue.main.async {
                    self.loadOptimizations.append(optimization)
                }
            }
        } catch {
            print("Error decoding WebSocket message: \(error)")
        }
    }
    
    private func handleConnectionError(_ error: Error) {
        DispatchQueue.main.async {
            self.connectionStatus = .disconnected
            self.isConnected = false
        }
        
        if config.autoReconnect && reconnectAttempts < maxReconnectAttempts {
            reconnectAttempts += 1
            let delay = Double(reconnectAttempts * reconnectAttempts) // Exponential backoff
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.setupWebSocketConnection()
            }
        }
    }
    
    private func setupAutoReconnect() {
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            if self?.isConnected == false && self?.config.autoReconnect == true {
                self?.setupWebSocketConnection()
            }
        }
    }
    
    // MARK: - Chat Message Sending
    func sendChatMessage(_ text: String, context: ChatContext? = nil) async throws {
        guard !text.isEmpty else { return }
        guard text.count <= config.maxMessageLength else {
            throw ChatError.messageTooLong
        }
        
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            content: text,
            role: .user,
            timestamp: Date(),
            context: context
        )
        
        DispatchQueue.main.async {
            self.chatMessages.append(userMessage)
            self.isProcessing = true
        }
        
        // Send via WebSocket if connected, otherwise use REST API
        if isConnected {
            try sendViaWebSocket(userMessage)
        } else {
            try await sendViaREST(userMessage)
        }
    }
    
    private func sendViaWebSocket(_ message: ChatMessage) throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(message)
        
        webSocketTask?.send(.data(data)) { error in
            if let error = error {
                print("Error sending message via WebSocket: \(error)")
                Task {
                    try await self.sendViaREST(message)
                }
            }
        }
    }
    
    private func sendViaREST(_ message: ChatMessage) async throws {
        guard let url = URL(string: chatBackendURL) else {
            throw ChatError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication
        if let token = UserDefaults.standard.string(forKey: "esang_auth_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(message)
        
        let (data, response) = try await urlSession.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw ChatError.serverError
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let chatResponse = try decoder.decode(ChatResponse.self, from: data)
        
        DispatchQueue.main.async {
            self.processChatResponse(chatResponse)
        }
    }
    
    // MARK: - Response Processing
    private func processChatResponse(_ response: ChatResponse) {
        // Add AI response to chat
        let aiMessage = ChatMessage(
            id: response.id,
            content: response.content,
            role: .assistant,
            timestamp: Date(),
            context: response.context,
            metadata: response.metadata
        )
        
        chatMessages.append(aiMessage)
        isProcessing = false
        
        // Update connection status
        if connectionStatus != .connected {
            connectionStatus = .connected
            isConnected = true
            reconnectAttempts = 0
        }
        
        // Process recommendations
        if let recommendations = response.recommendations {
            processRecommendations(recommendations)
        }
        
        // Process optimizations
        if let optimizations = response.optimizations {
            processOptimizations(optimizations)
        }
        
        // Update negotiation context
        if let context = response.negotiationContext {
            negotiationContext = context
        }
    }
    
    private func processRecommendations(_ recommendations: [DriverRecommendation]) {
        driverRecommendations = recommendations
        
        // Log recommendations for analytics
        for recommendation in recommendations {
            logAnalytics(event: "recommendation_received", data: [
                "type": recommendation.type.rawValue,
                "confidence": String(recommendation.confidence),
                "driver_id": recommendation.driverId
            ])
        }
    }
    
    private func processOptimizations(_ optimizations: [LoadOptimization]) {
        loadOptimizations = optimizations
        
        // Log optimizations for analytics
        for optimization in optimizations {
            logAnalytics(event: "optimization_suggested", data: [
                "type": optimization.type.rawValue,
                "potential_savings": String(optimization.potentialSavings),
                "load_id": optimization.loadId
            ])
        }
    }
    
    // MARK: - Chat History Management
    private func loadChatHistory() {
        if let savedHistory = UserDefaults.standard.data(forKey: "esang_chat_history") {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            if let history = try? decoder.decode([ChatMessage].self, from: savedHistory) {
                DispatchQueue.main.async {
                    self.chatMessages = Array(history.suffix(self.config.maxHistorySize))
                }
            }
        }
    }
    
    private func saveChatHistory() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let encoded = try? encoder.encode(chatMessages) {
            UserDefaults.standard.set(encoded, forKey: "esang_chat_history")
        }
    }
    
    // MARK: - Analytics and Logging
    private func logAnalytics(event: String, data: [String: String]) {
        // Send analytics to backend
        var analyticsData = data
        analyticsData["event"] = event
        analyticsData["timestamp"] = ISO8601DateFormatter().string(from: Date())
        
        Task {
            do {
                guard let url = URL(string: "https://api.eusotrip.com/analytics") else { return }
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                let encoder = JSONEncoder()
                request.httpBody = try encoder.encode(analyticsData)
                
                _ = try await urlSession.data(for: request)
            } catch {
                print("Error logging analytics: \(error)")
            }
        }
    }
    
    // MARK: - Cleanup
    deinit {
        saveChatHistory()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
    }
}

// MARK: - Data Models

struct ChatMessage: Identifiable, Codable {
    let id: String
    let content: String
    let role: MessageRole
    let timestamp: Date
    var context: ChatContext?
    var metadata: [String: String]?
    
    enum MessageRole: String, Codable {
        case user, assistant, system
    }
}

struct ChatContext: Codable {
    let loadId: String?
    let driverId: String?
    let carrierId: String?
    let negotiationPhase: String?
    let marketConditions: [String: Double]?
}

struct ChatResponse: Codable {
    let id: String
    let content: String
    let context: ChatContext?
    let recommendations: [DriverRecommendation]?
    let optimizations: [LoadOptimization]?
    let negotiationContext: NegotiationContext?
    let metadata: [String: String]?
}

struct DriverRecommendation: Identifiable, Codable {
    let id: String
    let driverId: String
    let type: RecommendationType
    let description: String
    let confidence: Double
    let action: String?
    
    enum RecommendationType: String, Codable {
        case driverMatch, priceOptimization, routeOptimization, safetyAlert
    }
}

struct LoadOptimization: Identifiable, Codable {
    let id: String
    let loadId: String
    let type: OptimizationType
    let description: String
    let potentialSavings: Double
    let implementation: String?
    
    enum OptimizationType: String, Codable {
        case consolidation, routing, timing, pricing
    }
}

struct NegotiationContext: Codable {
    let phase: String
    let suggestedPrice: Double?
    let priceFlexibility: Double?
    let timelineFlexibility: Double?
    let riskAssessment: String?
}

struct MarketInsight: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let impact: Double
    let relevance: Double
    let category: String
    let timestamp: Date
}

struct ESANGChatConfig {
    let maxMessageLength: Int
    let maxHistorySize: Int
    let autoReconnect: Bool
    let connectionTimeout: TimeInterval
    let messageTimeout: TimeInterval
    let enableContextTracking: Bool
    let enableMarketInsights: Bool
    let enableDriverOptimization: Bool
}

enum ConnectionStatus: String {
    case connected, connecting, disconnected, error
}

enum AIAssistantState: String {
    case idle, processing, waitingForInput, error
}

enum ChatError: Error {
    case messageTooLong
    case invalidURL
    case serverError
    case connectionFailed
    case decodingError
}
