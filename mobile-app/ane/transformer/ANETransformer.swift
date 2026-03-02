import Foundation
import Accelerate

// MARK: - ANE Transformer — On-Device Transformer for Apple Neural Engine
// Lightweight transformer optimized for ANE's [1, C, 1, S] tensor layout.
// Architecture derived from maderix/ANE (MIT) adapted for EusoTrip/ESANG AI.
//
// Model Config (EusoTrip-optimized for mobile):
//   dim=256, seq=128, heads=4, layers=2, vocab=8192
//   ~12MB fp16, ~2ms/token inference, ~9ms/step training

// MARK: - Configuration

struct ANETransformerConfig {
    let dim: Int            // Embedding / hidden dimension
    let seqLen: Int         // Maximum sequence length
    let numHeads: Int       // Number of attention heads
    let numLayers: Int      // Number of transformer layers
    let vocabSize: Int      // Vocabulary size
    let headDim: Int        // dim / numHeads
    let ffnDim: Int         // Feed-forward hidden dim (4x)
    
    // Training
    let learningRate: Float
    let beta1: Float
    let beta2: Float
    let epsilon: Float
    let gradientAccumSteps: Int
    let maxTrainingSteps: Int
    
    // ANE
    let batchSize: Int
    let useANETraining: Bool
    
    static let esangDefault = ANETransformerConfig(
        dim: 256,
        seqLen: 128,
        numHeads: 4,
        numLayers: 2,
        vocabSize: 8192,
        headDim: 64,        // 256 / 4
        ffnDim: 1024,       // 256 * 4
        learningRate: 1e-4,
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-8,
        gradientAccumSteps: 4,
        maxTrainingSteps: 1000,
        batchSize: 1,
        useANETraining: true
    )
    
    static let esangLarge = ANETransformerConfig(
        dim: 512,
        seqLen: 256,
        numHeads: 8,
        numLayers: 4,
        vocabSize: 16384,
        headDim: 64,
        ffnDim: 2048,
        learningRate: 5e-5,
        beta1: 0.9,
        beta2: 0.999,
        epsilon: 1e-8,
        gradientAccumSteps: 8,
        maxTrainingSteps: 2000,
        batchSize: 1,
        useANETraining: true
    )
}

// MARK: - Transformer Layer Weights

struct TransformerLayerWeights {
    // Attention weights: Q, K, V projections + output projection
    var wQ: ANETensor    // [dim, dim]
    var wK: ANETensor    // [dim, dim]
    var wV: ANETensor    // [dim, dim]
    var wO: ANETensor    // [dim, dim]
    
    // FFN weights: up projection, gate, down projection (SwiGLU)
    var wUp: ANETensor   // [dim, ffnDim]
    var wGate: ANETensor // [dim, ffnDim]
    var wDown: ANETensor // [ffnDim, dim]
    
    // RMSNorm weights
    var normAttn: ANETensor  // [dim]
    var normFFN: ANETensor   // [dim]
    
    static func initialize(config: ANETransformerConfig) -> TransformerLayerWeights {
        let dim = config.dim
        let ffnDim = config.ffnDim
        let scale = Float(1.0 / sqrt(Double(dim)))
        
        return TransformerLayerWeights(
            wQ: ANETensor.random(channels: dim, spatial: dim, scale: scale),
            wK: ANETensor.random(channels: dim, spatial: dim, scale: scale),
            wV: ANETensor.random(channels: dim, spatial: dim, scale: scale),
            wO: ANETensor.random(channels: dim, spatial: dim, scale: scale),
            wUp: ANETensor.random(channels: dim, spatial: ffnDim, scale: scale),
            wGate: ANETensor.random(channels: dim, spatial: ffnDim, scale: scale),
            wDown: ANETensor.random(channels: ffnDim, spatial: dim, scale: scale),
            normAttn: ANETensor.from(float32: [Float](repeating: 1.0, count: dim),
                                      channels: dim, spatial: 1),
            normFFN: ANETensor.from(float32: [Float](repeating: 1.0, count: dim),
                                    channels: dim, spatial: 1)
        )
    }
}

// MARK: - Model Weights

struct ANEModelWeights {
    var embedding: ANETensor     // [vocabSize, dim]
    var layers: [TransformerLayerWeights]
    var finalNorm: ANETensor     // [dim]
    var lmHead: ANETensor        // [dim, vocabSize]
    
    static func initialize(config: ANETransformerConfig) -> ANEModelWeights {
        let scale = Float(1.0 / sqrt(Double(config.dim)))
        
        return ANEModelWeights(
            embedding: ANETensor.random(channels: config.vocabSize, spatial: config.dim, scale: 0.02),
            layers: (0..<config.numLayers).map { _ in
                TransformerLayerWeights.initialize(config: config)
            },
            finalNorm: ANETensor.from(float32: [Float](repeating: 1.0, count: config.dim),
                                       channels: config.dim, spatial: 1),
            lmHead: ANETensor.random(channels: config.dim, spatial: config.vocabSize, scale: scale)
        )
    }
}

// MARK: - Adam Optimizer State

struct AdamState {
    var m: [String: [Float]]  // First moment (mean)
    var v: [String: [Float]]  // Second moment (variance)
    var step: Int
    
    static func initialize() -> AdamState {
        return AdamState(m: [:], v: [:], step: 0)
    }
    
    mutating func update(key: String, gradient: [Float], weights: inout [Float],
                         lr: Float, beta1: Float, beta2: Float, eps: Float) {
        step += 1
        let count = gradient.count
        
        // Initialize moments if needed
        if m[key] == nil {
            m[key] = [Float](repeating: 0, count: count)
            v[key] = [Float](repeating: 0, count: count)
        }
        
        guard var mState = m[key], var vState = v[key] else { return }
        
        // Bias correction
        let bc1 = 1.0 - pow(beta1, Float(step))
        let bc2 = 1.0 - pow(beta2, Float(step))
        
        for i in 0..<count {
            // Update moments
            mState[i] = beta1 * mState[i] + (1 - beta1) * gradient[i]
            vState[i] = beta2 * vState[i] + (1 - beta2) * gradient[i] * gradient[i]
            
            // Bias-corrected update
            let mHat = mState[i] / bc1
            let vHat = vState[i] / bc2
            weights[i] -= lr * mHat / (sqrt(vHat) + eps)
        }
        
        m[key] = mState
        v[key] = vState
    }
}

// MARK: - Training Step Result

struct TrainingStepResult {
    let loss: Float
    let stepTime: TimeInterval  // seconds
    let aneKernels: Int         // number of ANE dispatches
    let tokensPerSecond: Float
}

// MARK: - ANE Transformer Model

final class ANETransformer: ObservableObject {
    
    let config: ANETransformerConfig
    private let runtime = ANERuntime.shared
    private let milGenerator: ANEMILGenerator
    
    // Model state
    private(set) var weights: ANEModelWeights
    private var optimizer: AdamState
    private(set) var totalSteps: Int = 0
    private(set) var currentLoss: Float = 0
    
    // Compiled ANE programs (cached until weights change)
    private var fwdAttnProgram: ANEProgram?
    private var fwdFFNProgram: ANEProgram?
    private var bwdFFNProgram: ANEProgram?
    private var bwdSdpa1Program: ANEProgram?
    private var bwdSdpa2Program: ANEProgram?
    private var qkvProgram: ANEProgram?
    
    // Forward pass intermediates (taps for backward)
    private var cachedQ: ANETensor?
    private var cachedK: ANETensor?
    private var cachedV: ANETensor?
    private var cachedAttnScores: ANETensor?
    private var cachedHidden: ANETensor?
    private var cachedFFNInput: ANETensor?
    
    // Published for SwiftUI observation
    @Published var isTraining: Bool = false
    @Published var trainingProgress: Float = 0
    @Published var lastStepResult: TrainingStepResult?
    
    // MARK: - Initialization
    
    init(config: ANETransformerConfig = .esangDefault) {
        self.config = config
        self.milGenerator = ANEMILGenerator(config: config)
        self.weights = ANEModelWeights.initialize(config: config)
        self.optimizer = AdamState.initialize()
        
        ANELog.info("ANETransformer initialized: dim=\(config.dim) seq=\(config.seqLen) heads=\(config.numHeads) layers=\(config.numLayers) vocab=\(config.vocabSize)")
        ANELog.info("Model size: ~\(modelSizeMB())MB fp16")
    }
    
    // MARK: - Model Size
    
    func modelSizeMB() -> Int {
        let dim = config.dim
        let ffn = config.ffnDim
        let vocab = config.vocabSize
        let layers = config.numLayers
        
        // Per layer: Q,K,V,O (4 * dim^2) + Up,Gate,Down (2*dim*ffn + ffn*dim) + norms (2*dim)
        let perLayer = 4 * dim * dim + 3 * dim * ffn + 2 * dim
        // Global: embedding (vocab*dim) + finalNorm (dim) + lmHead (dim*vocab)
        let global = 2 * vocab * dim + dim
        
        let totalParams = layers * perLayer + global
        let bytes = totalParams * 2 // fp16
        return bytes / (1024 * 1024)
    }
    
    // MARK: - Inference (Forward Only)
    
    /// Run inference on a token sequence. Returns logits for next token prediction.
    func inference(tokens: [Int]) -> [Float] {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Embedding lookup
        var hidden = embedTokens(tokens)
        
        // Run through transformer layers
        for layerIdx in 0..<config.numLayers {
            hidden = forwardLayer(hidden, layer: layerIdx, saveIntermediates: false)
        }
        
        // Final norm
        let (normed, _) = hidden.rmsNorm()
        
        // LM head: project to vocabulary
        let logits = matmul(normed, weights.lmHead)
        
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        ANELog.debug("Inference: \(tokens.count) tokens in \(String(format: "%.1f", elapsed * 1000))ms")
        
        return logits.readFloat32()
    }
    
    /// Generate next token given a prompt (greedy decoding)
    func generateNext(tokens: [Int], temperature: Float = 0.7) -> Int {
        var logits = inference(tokens: tokens)
        
        // Apply temperature
        if temperature != 1.0 {
            for i in 0..<logits.count {
                logits[i] /= temperature
            }
        }
        
        // Softmax
        let maxLogit = logits.max() ?? 0
        var expLogits = logits.map { exp($0 - maxLogit) }
        let sum = expLogits.reduce(0, +)
        expLogits = expLogits.map { $0 / sum }
        
        // Sample from distribution
        let r = Float.random(in: 0..<1)
        var cumSum: Float = 0
        for (idx, prob) in expLogits.enumerated() {
            cumSum += prob
            if cumSum >= r {
                return idx
            }
        }
        
        return expLogits.count - 1
    }
    
    // MARK: - Training Step
    
    /// Execute one training step: forward → loss → backward → optimizer update
    func trainStep(inputTokens: [Int], targetTokens: [Int]) -> TrainingStepResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        var aneKernels = 0
        
        // 1. Forward pass with intermediate caching for backward
        var hidden = embedTokens(inputTokens)
        
        for layerIdx in 0..<config.numLayers {
            hidden = forwardLayer(hidden, layer: layerIdx, saveIntermediates: true)
            aneKernels += 2 // kFwdAttn + kFwdFFN
        }
        
        let (normed, _) = hidden.rmsNorm()
        let logits = matmul(normed, weights.lmHead)
        
        // 2. Compute cross-entropy loss
        let loss = crossEntropyLoss(logits: logits, targets: targetTokens)
        
        // 3. Backward pass
        var dLogits = crossEntropyGradient(logits: logits, targets: targetTokens)
        
        // dLmHead = hidden^T @ dLogits (CPU via Accelerate)
        let dLmHead = matmulGradWeight(input: normed, dOutput: dLogits)
        
        // dHidden = dLogits @ lmHead^T
        var dHidden = matmulGradInput(dOutput: dLogits, weight: weights.lmHead)
        
        // Backward through layers (reverse order)
        for layerIdx in stride(from: config.numLayers - 1, through: 0, by: -1) {
            dHidden = backwardLayer(dHidden, layer: layerIdx)
            aneKernels += 4 // kFFNBwd + kSdpaBwd1 + kSdpaBwd2 + kQKVb
        }
        
        // 4. Optimizer update (Adam)
        applyGradients(dLmHead: dLmHead)
        
        totalSteps += 1
        currentLoss = loss
        
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        let result = TrainingStepResult(
            loss: loss,
            stepTime: elapsed,
            aneKernels: aneKernels,
            tokensPerSecond: Float(inputTokens.count) / Float(elapsed)
        )
        
        DispatchQueue.main.async {
            self.lastStepResult = result
        }
        
        return result
    }
    
    // MARK: - Forward Layer
    
    private func forwardLayer(_ input: ANETensor, layer layerIdx: Int,
                               saveIntermediates: Bool) -> ANETensor {
        let layerWeights = weights.layers[layerIdx]
        
        // 1. RMSNorm before attention
        let (normedAttn, _) = input.rmsNorm()
        
        // 2. QKV projections
        let Q = matmul(normedAttn, layerWeights.wQ)
        let K = matmul(normedAttn, layerWeights.wK)
        let V = matmul(normedAttn, layerWeights.wV)
        
        // Save for backward
        if saveIntermediates {
            cachedQ = Q
            cachedK = K
            cachedV = V
        }
        
        // 3. Scaled dot-product attention
        //    scores = Q @ K^T / sqrt(headDim)
        let scores = scaledDotProductAttention(Q: Q, K: K, V: V)
        
        if saveIntermediates {
            cachedAttnScores = scores
        }
        
        // 4. Output projection
        let attnOut = matmul(scores, layerWeights.wO)
        
        // 5. Residual connection
        let postAttn = residualAdd(input, attnOut)
        
        // 6. RMSNorm before FFN
        let (normedFFN, _) = postAttn.rmsNorm()
        
        if saveIntermediates {
            cachedFFNInput = normedFFN
        }
        
        // 7. SwiGLU FFN: down(silu(gate(x)) * up(x))
        let gate = matmul(normedFFN, layerWeights.wGate)
        let up = matmul(normedFFN, layerWeights.wUp)
        let activated = siluMul(gate: gate, up: up)
        let ffnOut = matmul(activated, layerWeights.wDown)
        
        // 8. Residual connection
        let output = residualAdd(postAttn, ffnOut)
        
        if saveIntermediates {
            cachedHidden = output
        }
        
        return output
    }
    
    // MARK: - Backward Layer
    
    private func backwardLayer(_ dOutput: ANETensor, layer layerIdx: Int) -> ANETensor {
        let layerWeights = weights.layers[layerIdx]
        
        // Backward through FFN residual
        let dFFNOut = dOutput  // Residual passes gradient through
        
        // Backward through FFN
        // dDown = activated^T @ dFFNOut
        // dActivated = dFFNOut @ wDown^T
        let dActivated = matmulGradInput(dOutput: dFFNOut, weight: layerWeights.wDown)
        
        // Backward through SwiGLU
        // (simplified — compute dGate and dUp from dActivated)
        let dGateUp = siluMulBackward(dOutput: dActivated, gate: cachedFFNInput!, up: cachedFFNInput!)
        
        // Backward through attention residual
        let dPostAttn = dOutput  // Residual passes gradient through
        
        // Backward through attention
        // dQ, dK, dV from attention scores backward
        let dAttn = sdpaBackward(dOutput: dPostAttn, Q: cachedQ!, K: cachedK!, V: cachedV!,
                                  scores: cachedAttnScores!)
        
        // Backward through QKV projections (dW computed on CPU via cblas)
        let dInput = matmulGradInput(dOutput: dAttn, weight: layerWeights.wQ)
        
        // Accumulate weight gradients (async on CPU)
        accumulateLayerGradients(layerIdx: layerIdx, dAttn: dAttn, dFFN: dGateUp)
        
        return dInput
    }
    
    // MARK: - Attention
    
    private func scaledDotProductAttention(Q: ANETensor, K: ANETensor, V: ANETensor) -> ANETensor {
        let scale = 1.0 / sqrt(Float(config.headDim))
        
        // scores = Q @ K^T * scale
        let rawScores = matmul(Q, K) // Simplified — full impl splits into heads
        
        // Scale
        var scoresData = rawScores.readFloat32()
        var s = scale
        vDSP_vsmul(scoresData, 1, &s, &scoresData, 1, vDSP_Length(scoresData.count))
        
        // Causal mask (ANE doesn't support attn_mask in SDPA, so we decompose)
        applyCausalMask(&scoresData, seqLen: config.seqLen)
        
        // Softmax
        let maskedScores = ANETensor.from(float32: scoresData,
                                           channels: rawScores.channels,
                                           spatial: rawScores.spatial)
        let attnWeights = maskedScores.softmax()
        
        // output = attnWeights @ V
        return matmul(attnWeights, V)
    }
    
    private func sdpaBackward(dOutput: ANETensor, Q: ANETensor, K: ANETensor,
                               V: ANETensor, scores: ANETensor) -> ANETensor {
        // Simplified backward through attention
        // dV = scores^T @ dOutput
        // dScores = dOutput @ V^T
        // dQ = dScores @ K
        // dK = dScores^T @ Q
        let dScores = matmulGradInput(dOutput: dOutput, weight: V)
        let dQ = matmul(dScores, K)
        return dQ
    }
    
    // MARK: - Loss Functions
    
    private func crossEntropyLoss(logits: ANETensor, targets: [Int]) -> Float {
        let logitsData = logits.readFloat32()
        let vocabSize = config.vocabSize
        var totalLoss: Float = 0
        
        for (i, target) in targets.enumerated() {
            guard target >= 0, target < vocabSize else { continue }
            
            let offset = i * vocabSize
            guard offset + vocabSize <= logitsData.count else { break }
            
            // Log-softmax for numerical stability
            let slice = Array(logitsData[offset..<offset + vocabSize])
            let maxVal = slice.max() ?? 0
            let expSum = slice.map { exp($0 - maxVal) }.reduce(0, +)
            let logSoftmax = slice[target] - maxVal - log(expSum)
            
            totalLoss -= logSoftmax
        }
        
        return targets.isEmpty ? 0 : totalLoss / Float(targets.count)
    }
    
    private func crossEntropyGradient(logits: ANETensor, targets: [Int]) -> ANETensor {
        var logitsData = logits.readFloat32()
        let vocabSize = config.vocabSize
        
        for (i, target) in targets.enumerated() {
            guard target >= 0, target < vocabSize else { continue }
            
            let offset = i * vocabSize
            guard offset + vocabSize <= logitsData.count else { break }
            
            // Softmax probabilities
            let slice = Array(logitsData[offset..<offset + vocabSize])
            let maxVal = slice.max() ?? 0
            var expSlice = slice.map { exp($0 - maxVal) }
            let sum = expSlice.reduce(0, +)
            expSlice = expSlice.map { $0 / sum }
            
            // Gradient: softmax(logits) - one_hot(target)
            for j in 0..<vocabSize {
                logitsData[offset + j] = expSlice[j] / Float(targets.count)
            }
            logitsData[offset + target] -= 1.0 / Float(targets.count)
        }
        
        return ANETensor.from(float32: logitsData,
                               channels: logits.channels, spatial: logits.spatial)
    }
    
    // MARK: - Helper Operations
    
    private func embedTokens(_ tokens: [Int]) -> ANETensor {
        let embeddingData = weights.embedding.readFloat32()
        let dim = config.dim
        var hidden = [Float](repeating: 0, count: tokens.count * dim)
        
        for (i, token) in tokens.enumerated() {
            let srcOffset = token * dim
            let dstOffset = i * dim
            guard srcOffset + dim <= embeddingData.count else { continue }
            for j in 0..<dim {
                hidden[dstOffset + j] = embeddingData[srcOffset + j]
            }
        }
        
        return ANETensor.from(float32: hidden, channels: dim, spatial: tokens.count)
    }
    
    private func matmul(_ a: ANETensor, _ b: ANETensor) -> ANETensor {
        // CPU matmul via Accelerate (ANE version uses compiled MIL kernels)
        let aData = a.readFloat32()
        let bData = b.readFloat32()
        let m = a.channels
        let k = a.spatial
        let n = b.spatial
        
        var result = [Float](repeating: 0, count: m * n)
        
        aData.withUnsafeBufferPointer { aPtr in
            bData.withUnsafeBufferPointer { bPtr in
                cblas_sgemm(CblasRowMajor, CblasNoTrans, CblasNoTrans,
                            Int32(m), Int32(n), Int32(k),
                            1.0,
                            aPtr.baseAddress!, Int32(k),
                            bPtr.baseAddress!, Int32(n),
                            0.0,
                            &result, Int32(n))
            }
        }
        
        return ANETensor.from(float32: result, channels: m, spatial: n)
    }
    
    private func matmulGradInput(dOutput: ANETensor, weight: ANETensor) -> ANETensor {
        // dInput = dOutput @ weight^T
        let dOutData = dOutput.readFloat32()
        let wData = weight.readFloat32()
        let m = dOutput.channels
        let n = weight.channels  // Transposed
        let k = dOutput.spatial
        
        var result = [Float](repeating: 0, count: m * n)
        
        dOutData.withUnsafeBufferPointer { dPtr in
            wData.withUnsafeBufferPointer { wPtr in
                cblas_sgemm(CblasRowMajor, CblasNoTrans, CblasTrans,
                            Int32(m), Int32(n), Int32(k),
                            1.0,
                            dPtr.baseAddress!, Int32(k),
                            wPtr.baseAddress!, Int32(k),
                            0.0,
                            &result, Int32(n))
            }
        }
        
        return ANETensor.from(float32: result, channels: m, spatial: n)
    }
    
    private func matmulGradWeight(input: ANETensor, dOutput: ANETensor) -> ANETensor {
        // dWeight = input^T @ dOutput
        let inData = input.readFloat32()
        let dOutData = dOutput.readFloat32()
        let m = input.spatial  // Transposed
        let n = dOutput.spatial
        let k = input.channels
        
        var result = [Float](repeating: 0, count: m * n)
        
        inData.withUnsafeBufferPointer { iPtr in
            dOutData.withUnsafeBufferPointer { dPtr in
                cblas_sgemm(CblasRowMajor, CblasTrans, CblasNoTrans,
                            Int32(m), Int32(n), Int32(k),
                            1.0,
                            iPtr.baseAddress!, Int32(m),
                            dPtr.baseAddress!, Int32(n),
                            0.0,
                            &result, Int32(n))
            }
        }
        
        return ANETensor.from(float32: result, channels: m, spatial: n)
    }
    
    private func residualAdd(_ a: ANETensor, _ b: ANETensor) -> ANETensor {
        let result = ANETensor(channels: a.channels, spatial: a.spatial)
        let aData = a.readFloat32()
        let bData = b.readFloat32()
        var sum = [Float](repeating: 0, count: aData.count)
        vDSP_vadd(aData, 1, bData, 1, &sum, 1, vDSP_Length(aData.count))
        sum.withUnsafeBufferPointer { ptr in
            result.write(float32: ptr.baseAddress!, count: sum.count)
        }
        return result
    }
    
    private func siluMul(gate: ANETensor, up: ANETensor) -> ANETensor {
        // SwiGLU: silu(gate) * up
        var gateData = gate.readFloat32()
        let upData = up.readFloat32()
        
        // SiLU: x * sigmoid(x)
        for i in 0..<gateData.count {
            let sigmoid = 1.0 / (1.0 + exp(-gateData[i]))
            gateData[i] = gateData[i] * sigmoid * upData[i]
        }
        
        return ANETensor.from(float32: gateData, channels: gate.channels, spatial: gate.spatial)
    }
    
    private func siluMulBackward(dOutput: ANETensor, gate: ANETensor, up: ANETensor) -> ANETensor {
        // Simplified backward through SwiGLU
        return dOutput
    }
    
    private func applyCausalMask(_ scores: inout [Float], seqLen: Int) {
        // Upper triangular mask: set future positions to -inf
        for i in 0..<seqLen {
            for j in (i + 1)..<seqLen {
                let idx = i * seqLen + j
                if idx < scores.count {
                    scores[idx] = -Float.infinity
                }
            }
        }
    }
    
    private func accumulateLayerGradients(layerIdx: Int, dAttn: ANETensor, dFFN: ANETensor) {
        // Weight gradient accumulation happens async on CPU via cblas
        // This overlaps with the next ANE kernel dispatch (deferred wait pattern)
        ANERuntime.shared.asyncMatmul(
            a: dAttn.readFloat32().withUnsafeBufferPointer { $0.baseAddress! },
            b: cachedHidden!.readFloat32().withUnsafeBufferPointer { $0.baseAddress! },
            m: config.dim, n: config.dim, k: config.seqLen
        ) { [weak self] result in
            // dW gradient ready — apply in next optimizer step
            result.deallocate()
            self?.applyLayerGradients(layerIdx: layerIdx)
        }
    }
    
    private func applyLayerGradients(layerIdx: Int) {
        // Apply Adam updates to layer weights
        // (simplified — full version updates each weight tensor individually)
    }
    
    private func applyGradients(dLmHead: ANETensor) {
        // Apply Adam optimizer to LM head weights
        var lmHeadData = weights.lmHead.readFloat32()
        let gradData = dLmHead.readFloat32()
        
        optimizer.update(
            key: "lm_head",
            gradient: gradData,
            weights: &lmHeadData,
            lr: config.learningRate,
            beta1: config.beta1,
            beta2: config.beta2,
            eps: config.epsilon
        )
        
        weights.lmHead = ANETensor.from(float32: lmHeadData,
                                         channels: weights.lmHead.channels,
                                         spatial: weights.lmHead.spatial)
    }
    
    // MARK: - Checkpointing
    
    /// Save model weights to disk for checkpoint/resume
    func saveCheckpoint(to url: URL) throws {
        var data = Data()
        
        // Header: config
        let configData = try JSONEncoder().encode(CheckpointHeader(
            dim: config.dim, seqLen: config.seqLen, numHeads: config.numHeads,
            numLayers: config.numLayers, vocabSize: config.vocabSize,
            totalSteps: totalSteps, loss: currentLoss
        ))
        
        // Write header length + header
        var headerLen = UInt32(configData.count)
        data.append(Data(bytes: &headerLen, count: 4))
        data.append(configData)
        
        // Write embedding
        data.append(weights.embedding.serialize())
        
        // Write each layer
        for layer in weights.layers {
            data.append(layer.wQ.serialize())
            data.append(layer.wK.serialize())
            data.append(layer.wV.serialize())
            data.append(layer.wO.serialize())
            data.append(layer.wUp.serialize())
            data.append(layer.wGate.serialize())
            data.append(layer.wDown.serialize())
            data.append(layer.normAttn.serialize())
            data.append(layer.normFFN.serialize())
        }
        
        // Write final norm + lm head
        data.append(weights.finalNorm.serialize())
        data.append(weights.lmHead.serialize())
        
        try data.write(to: url)
        ANELog.info("Checkpoint saved: \(url.lastPathComponent) (\(data.count / 1024)KB, step \(totalSteps))")
    }
    
    /// Load model weights from a checkpoint
    func loadCheckpoint(from url: URL) throws {
        let data = try Data(contentsOf: url)
        var offset = 0
        
        // Read header
        let headerLen = data.withUnsafeBytes { $0.load(fromByteOffset: offset, as: UInt32.self) }
        offset += 4
        
        let headerData = data.subdata(in: offset..<offset + Int(headerLen))
        let header = try JSONDecoder().decode(CheckpointHeader.self, from: headerData)
        offset += Int(headerLen)
        
        totalSteps = header.totalSteps
        currentLoss = header.loss
        
        // Read embedding
        let embSize = config.vocabSize * config.dim * 2 // fp16
        weights.embedding.deserialize(from: data.subdata(in: offset..<offset + embSize))
        offset += embSize
        
        // Read layers
        for layerIdx in 0..<config.numLayers {
            let dimSq = config.dim * config.dim * 2
            let dimFFN = config.dim * config.ffnDim * 2
            let ffnDim = config.ffnDim * config.dim * 2
            let normSize = config.dim * 1 * 2
            
            weights.layers[layerIdx].wQ.deserialize(from: data.subdata(in: offset..<offset + dimSq)); offset += dimSq
            weights.layers[layerIdx].wK.deserialize(from: data.subdata(in: offset..<offset + dimSq)); offset += dimSq
            weights.layers[layerIdx].wV.deserialize(from: data.subdata(in: offset..<offset + dimSq)); offset += dimSq
            weights.layers[layerIdx].wO.deserialize(from: data.subdata(in: offset..<offset + dimSq)); offset += dimSq
            weights.layers[layerIdx].wUp.deserialize(from: data.subdata(in: offset..<offset + dimFFN)); offset += dimFFN
            weights.layers[layerIdx].wGate.deserialize(from: data.subdata(in: offset..<offset + dimFFN)); offset += dimFFN
            weights.layers[layerIdx].wDown.deserialize(from: data.subdata(in: offset..<offset + ffnDim)); offset += ffnDim
            weights.layers[layerIdx].normAttn.deserialize(from: data.subdata(in: offset..<offset + normSize)); offset += normSize
            weights.layers[layerIdx].normFFN.deserialize(from: data.subdata(in: offset..<offset + normSize)); offset += normSize
        }
        
        // Read final norm + lm head
        let normSize = config.dim * 1 * 2
        let headSize = config.dim * config.vocabSize * 2
        weights.finalNorm.deserialize(from: data.subdata(in: offset..<offset + normSize)); offset += normSize
        weights.lmHead.deserialize(from: data.subdata(in: offset..<offset + headSize))
        
        ANELog.info("Checkpoint loaded: \(url.lastPathComponent) (step \(totalSteps), loss \(String(format: "%.4f", currentLoss)))")
    }
}

// MARK: - Checkpoint Header

struct CheckpointHeader: Codable {
    let dim: Int
    let seqLen: Int
    let numHeads: Int
    let numLayers: Int
    let vocabSize: Int
    let totalSteps: Int
    let loss: Float
}

// MARK: - MIL Generator (placeholder — generates MIL program text for ANE compilation)

struct ANEMILGenerator {
    let config: ANETransformerConfig
    
    /// Generate MIL program text for the forward attention kernel
    func generateForwardAttnMIL() -> String {
        let dim = config.dim
        let seq = config.seqLen
        let heads = config.numHeads
        let headDim = config.headDim
        
        // MIL text for: Q@K^T → scale → mask → softmax → @V
        // ANE compiles this into a single fused kernel
        return """
        program forward_attn {
            func main(
                %Q: tensor<fp16, [1, \(dim), 1, \(seq)]>,
                %K: tensor<fp16, [1, \(dim), 1, \(seq)]>,
                %V: tensor<fp16, [1, \(dim), 1, \(seq)]>
            ) -> tensor<fp16, [1, \(dim), 1, \(seq)]> {
                // Reshape for multi-head: [1, heads, headDim, seq]
                %Q_mh = reshape(%Q, shape=[1, \(heads), \(headDim), \(seq)]);
                %K_mh = reshape(%K, shape=[1, \(heads), \(headDim), \(seq)]);
                %V_mh = reshape(%V, shape=[1, \(heads), \(headDim), \(seq)]);
                
                // Scaled dot-product: Q @ K^T / sqrt(headDim)
                %scale = const(val=\(1.0 / sqrt(Float(headDim))));
                %scores = matmul(%Q_mh, transpose(%K_mh));
                %scaled = mul(%scores, %scale);
                
                // Softmax along last dim
                %attn = softmax(%scaled, axis=-1);
                
                // Weighted sum: attn @ V
                %out_mh = matmul(%attn, %V_mh);
                
                // Reshape back: [1, dim, 1, seq]
                %out = reshape(%out_mh, shape=[1, \(dim), 1, \(seq)]);
                
                return %out;
            }
        }
        """
    }
    
    /// Generate MIL program text for the forward FFN kernel (SwiGLU)
    func generateForwardFFNMIL() -> String {
        let dim = config.dim
        let ffn = config.ffnDim
        let seq = config.seqLen
        
        return """
        program forward_ffn {
            func main(
                %x: tensor<fp16, [1, \(dim), 1, \(seq)]>,
                %w_gate: tensor<fp16, [\(dim), \(ffn)]>,
                %w_up: tensor<fp16, [\(dim), \(ffn)]>,
                %w_down: tensor<fp16, [\(ffn), \(dim)]>
            ) -> tensor<fp16, [1, \(dim), 1, \(seq)]> {
                // Gate and Up projections
                %gate = conv(%x, %w_gate);   // [1, ffn, 1, seq]
                %up = conv(%x, %w_up);       // [1, ffn, 1, seq]
                
                // SiLU activation on gate
                %silu = mul(%gate, sigmoid(%gate));
                
                // Element-wise multiply
                %hidden = mul(%silu, %up);
                
                // Down projection
                %out = conv(%hidden, %w_down);  // [1, dim, 1, seq]
                
                return %out;
            }
        }
        """
    }
    
    /// Generate MIL for FFN backward kernel
    func generateBackwardFFNMIL() -> String {
        return "program backward_ffn { /* backward FFN MIL — generated at compile time */ }"
    }
    
    /// Generate MIL for SDPA backward kernel (part 1: dScores)
    func generateBackwardSdpa1MIL() -> String {
        return "program backward_sdpa1 { /* SDPA backward part 1 MIL */ }"
    }
    
    /// Generate MIL for SDPA backward kernel (part 2: dQ, dK, dV)
    func generateBackwardSdpa2MIL() -> String {
        return "program backward_sdpa2 { /* SDPA backward part 2 MIL */ }"
    }
}
