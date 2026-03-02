import Foundation
import ObjectiveC

// MARK: - ANE Runtime — Private API Bridge to Apple Neural Engine
// Based on maderix/ANE reverse-engineered APIs (MIT License)
// Distribution: Enterprise/MDM only (private APIs rejected from App Store)

/// ANERuntime provides a Swift interface to Apple's private Neural Engine APIs.
/// It handles dynamic resolution of _ANEClient/_ANECompiler, IOSurface tensor
/// management, MIL program compilation, and kernel dispatch.
final class ANERuntime {
    
    static let shared = ANERuntime()
    
    // MARK: - State
    
    private(set) var isAvailable: Bool = false
    private(set) var deviceCapability: ANEDeviceCapability = .unknown
    private(set) var compileCount: Int = 0
    
    private var aneClientClass: AnyClass?
    private var aneCompilerClass: AnyClass?
    private var aneModelDescClass: AnyClass?
    private var aneClient: AnyObject?
    
    private let compileLimit = 115 // Safety margin below ~119 hard limit
    private let queue = DispatchQueue(label: "com.eusotrip.ane.runtime", qos: .userInitiated)
    private let cblasQueue = DispatchQueue(label: "com.eusotrip.ane.cblas", qos: .userInitiated)
    
    // MARK: - Initialization
    
    private init() {
        detectDeviceCapability()
        resolvePrivateAPIs()
    }
    
    // MARK: - Device Capability Detection
    
    private func detectDeviceCapability() {
        var size = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        let machineString = String(cString: machine)
        
        // Also get chip name for Apple Silicon detection
        var chipSize = 0
        sysctlbyname("machdep.cpu.brand_string", nil, &chipSize, nil, 0)
        var chipName = [CChar](repeating: 0, count: chipSize)
        sysctlbyname("machdep.cpu.brand_string", &chipName, &chipSize, nil, 0)
        let chipString = String(cString: chipName)
        
        deviceCapability = ANEDeviceCapability.detect(machine: machineString, chip: chipString)
        
        ANELog.info("Device: \(machineString) | Chip: \(chipString) | ANE: \(deviceCapability)")
    }
    
    // MARK: - Private API Resolution
    
    /// Dynamically resolve Apple's private ANE framework classes at runtime.
    /// These are NOT public APIs — they exist in the AppleNeuralEngine.framework private framework.
    private func resolvePrivateAPIs() {
        // Load the private framework
        let frameworkPaths = [
            "/System/Library/PrivateFrameworks/AppleNeuralEngine.framework/AppleNeuralEngine",
            "/System/Library/Frameworks/AppleNeuralEngine.framework/AppleNeuralEngine",
        ]
        
        var handle: UnsafeMutableRawPointer?
        for path in frameworkPaths {
            handle = dlopen(path, RTLD_LAZY)
            if handle != nil {
                ANELog.info("Loaded ANE framework from: \(path)")
                break
            }
        }
        
        guard handle != nil else {
            ANELog.error("Failed to load AppleNeuralEngine.framework — ANE unavailable")
            isAvailable = false
            return
        }
        
        // Resolve classes via Objective-C runtime
        aneClientClass = NSClassFromString("_ANEClient")
        aneCompilerClass = NSClassFromString("_ANECompiler")
        aneModelDescClass = NSClassFromString("_ANEInMemoryModelDescriptor")
        
        guard aneClientClass != nil else {
            ANELog.error("_ANEClient class not found — ANE unavailable")
            isAvailable = false
            return
        }
        
        guard aneModelDescClass != nil else {
            ANELog.error("_ANEInMemoryModelDescriptor not found — ANE unavailable")
            isAvailable = false
            return
        }
        
        // Create ANE client instance
        if let clientClass = aneClientClass {
            let sel = NSSelectorFromString("sharedClient")
            if clientClass.responds(to: sel) {
                aneClient = (clientClass as AnyObject).perform(sel)?.takeUnretainedValue()
            }
        }
        
        if aneClient != nil {
            isAvailable = true
            ANELog.info("ANE Runtime initialized — \(deviceCapability.tflopsString) available")
        } else {
            ANELog.warn("ANE client creation failed — falling back to CoreML inference")
            isAvailable = false
        }
    }
    
    // MARK: - Compile Limit Management
    
    /// Check if we're approaching the ~119 compile limit per process.
    /// Returns true if a restart is needed before the next compilation.
    var needsRestart: Bool {
        return compileCount >= compileLimit
    }
    
    /// Reset compile count (called after process restart via exec())
    func resetCompileCount() {
        compileCount = 0
    }
    
    // MARK: - MIL Compilation
    
    /// Compile a MIL (Model Intermediate Language) program into an ANE-executable program.
    ///
    /// - Parameters:
    ///   - milText: The MIL program text describing the compute graph
    ///   - weightBlobs: Dictionary of weight name → fp16 data blobs
    /// - Returns: An opaque ANE program handle, or nil on failure
    func compile(mil milText: String, weights weightBlobs: [String: Data] = [:]) -> ANEProgram? {
        guard isAvailable else {
            ANELog.error("Cannot compile — ANE not available")
            return nil
        }
        
        guard !needsRestart else {
            ANELog.warn("Compile limit approaching (\(compileCount)/\(compileLimit)) — restart recommended")
            return nil
        }
        
        return queue.sync {
            guard let descClass = aneModelDescClass else { return nil }
            
            // Create in-memory model descriptor
            let allocSel = NSSelectorFromString("alloc")
            let initSel = NSSelectorFromString("initWithMILText:weightBlobs:")
            
            guard let allocated = (descClass as AnyObject).perform(allocSel)?.takeUnretainedValue() else {
                ANELog.error("Failed to allocate _ANEInMemoryModelDescriptor")
                return nil
            }
            
            let milData = milText.data(using: .utf8)!
            
            // Build weight blob dictionary (NSData keyed by weight name)
            let blobDict = NSMutableDictionary()
            for (name, data) in weightBlobs {
                blobDict[name] = data as NSData
            }
            
            // Compile the MIL program
            guard let descriptor = allocated.perform(initSel,
                                                      with: milData as NSData,
                                                      with: blobDict)?.takeUnretainedValue() else {
                ANELog.error("MIL compilation failed")
                return nil
            }
            
            // Compile to ANE program
            let compileSel = NSSelectorFromString("compileWithDescriptor:error:")
            var compileError: NSError?
            
            guard let client = aneClient else { return nil }
            
            let program = withUnsafeMutablePointer(to: &compileError) { errorPtr -> AnyObject? in
                return (client as AnyObject).perform(compileSel,
                                                      with: descriptor,
                                                      with: errorPtr)?.takeUnretainedValue()
            }
            
            if let error = compileError {
                ANELog.error("ANE compilation error: \(error.localizedDescription)")
                return nil
            }
            
            guard let compiledProgram = program else {
                ANELog.error("ANE compilation returned nil program")
                return nil
            }
            
            compileCount += 1
            ANELog.debug("Compiled MIL program (\(compileCount)/\(compileLimit))")
            
            return ANEProgram(handle: compiledProgram, runtime: self)
        }
    }
    
    // MARK: - Kernel Dispatch
    
    /// Execute a compiled ANE program with the given input tensors.
    ///
    /// - Parameters:
    ///   - program: The compiled ANE program
    ///   - inputs: Input tensors (IOSurface-backed)
    /// - Returns: Output tensors, or nil on failure
    func execute(program: ANEProgram, inputs: [ANETensor]) -> [ANETensor]? {
        guard isAvailable else { return nil }
        
        return queue.sync {
            guard let client = aneClient else { return nil }
            
            let evalSel = NSSelectorFromString("evaluateWithProgram:inputs:error:")
            var evalError: NSError?
            
            // Convert ANETensors to IOSurface array for ANE dispatch
            let inputSurfaces = inputs.map { $0.ioSurface as AnyObject }
            let inputArray = NSArray(array: inputSurfaces)
            
            let result = withUnsafeMutablePointer(to: &evalError) { errorPtr -> AnyObject? in
                return (client as AnyObject).perform(evalSel,
                                                      with: program.handle,
                                                      with: inputArray,
                                                      with: errorPtr)?.takeUnretainedValue()
            }
            
            if let error = evalError {
                ANELog.error("ANE execution error: \(error.localizedDescription)")
                return nil
            }
            
            guard let outputSurfaces = result as? [AnyObject] else {
                ANELog.error("ANE execution returned unexpected output type")
                return nil
            }
            
            // Wrap output IOSurfaces as ANETensors
            return outputSurfaces.compactMap { surface in
                ANETensor(fromIOSurface: surface)
            }
        }
    }
    
    // MARK: - CPU Compute (Accelerate cblas)
    
    /// Run matrix multiplication on CPU via Accelerate framework (cblas_sgemm).
    /// Used for dW gradient computation, overlapped with ANE execution.
    ///
    /// - Parameters:
    ///   - a: Matrix A (row-major, fp32)
    ///   - b: Matrix B (row-major, fp32)
    ///   - m: Rows of A
    ///   - n: Cols of B
    ///   - k: Cols of A / Rows of B
    ///   - completion: Callback with result matrix C = A @ B^T
    func asyncMatmul(a: UnsafePointer<Float>, b: UnsafePointer<Float>,
                     m: Int, n: Int, k: Int,
                     completion: @escaping (UnsafeMutablePointer<Float>) -> Void) {
        cblasQueue.async {
            let c = UnsafeMutablePointer<Float>.allocate(capacity: m * n)
            c.initialize(repeating: 0, count: m * n)
            
            // cblas_sgemm: C = alpha * A * B^T + beta * C
            cblas_sgemm(
                CblasRowMajor, CblasNoTrans, CblasTrans,
                Int32(m), Int32(n), Int32(k),
                1.0,            // alpha
                a, Int32(k),    // A, lda
                b, Int32(k),    // B, ldb (transposed, so ldb = k)
                0.0,            // beta
                c, Int32(n)     // C, ldc
            )
            
            completion(c)
        }
    }
    
    // MARK: - Diagnostics
    
    /// Get ANE runtime diagnostics for monitoring
    func diagnostics() -> ANEDiagnostics {
        return ANEDiagnostics(
            isAvailable: isAvailable,
            deviceCapability: deviceCapability,
            compileCount: compileCount,
            compileLimit: compileLimit,
            needsRestart: needsRestart,
            clientActive: aneClient != nil,
            frameworkLoaded: aneClientClass != nil
        )
    }
}

// MARK: - ANE Program Handle

/// Opaque wrapper around a compiled ANE program
final class ANEProgram {
    let handle: AnyObject
    private weak var runtime: ANERuntime?
    
    init(handle: AnyObject, runtime: ANERuntime) {
        self.handle = handle
        self.runtime = runtime
    }
    
    deinit {
        // Release ANE program resources
        let releaseSel = NSSelectorFromString("releaseProgram:")
        if let runtime = runtime, let client = (runtime as AnyObject).value(forKey: "aneClient") as? AnyObject {
            _ = (client as AnyObject).perform(releaseSel, with: handle)
        }
    }
}

// MARK: - ANE Device Capability

enum ANEDeviceCapability: CustomStringConvertible {
    case unknown
    case noANE                           // Pre-A11 devices
    case inferenceOnly(tflops: Double)   // A11-A14 (CoreML inference only)
    case fullTraining(tflops: Double)    // A15+ / M1+ (ANE training capable)
    
    var canTrain: Bool {
        switch self {
        case .fullTraining: return true
        default: return false
        }
    }
    
    var canInfer: Bool {
        switch self {
        case .inferenceOnly, .fullTraining: return true
        default: return false
        }
    }
    
    var tflops: Double {
        switch self {
        case .inferenceOnly(let t), .fullTraining(let t): return t
        default: return 0
        }
    }
    
    var tflopsString: String {
        return String(format: "%.1f TFLOPS", tflops)
    }
    
    var description: String {
        switch self {
        case .unknown: return "Unknown"
        case .noANE: return "No ANE"
        case .inferenceOnly(let t): return "Inference Only (\(String(format: "%.1f", t)) TFLOPS)"
        case .fullTraining(let t): return "Full Training (\(String(format: "%.1f", t)) TFLOPS)"
        }
    }
    
    static func detect(machine: String, chip: String) -> ANEDeviceCapability {
        let chipLower = chip.lowercased()
        
        // Apple Silicon Macs (M-series)
        if chipLower.contains("m4")       { return .fullTraining(tflops: 38.0) }
        if chipLower.contains("m3")       { return .fullTraining(tflops: 18.0) }
        if chipLower.contains("m2")       { return .fullTraining(tflops: 15.8) }
        if chipLower.contains("m1")       { return .fullTraining(tflops: 11.0) }
        
        // iPhone/iPad (A-series) — detect from machine identifier
        // iPhone 16 Pro (A18 Pro)
        if machine.hasPrefix("iPhone17")  { return .fullTraining(tflops: 35.0) }
        // iPhone 15 Pro (A17 Pro)
        if machine.hasPrefix("iPhone16")  { return .fullTraining(tflops: 35.0) }
        // iPhone 14 / 15 (A15/A16)
        if machine.hasPrefix("iPhone15")  { return .fullTraining(tflops: 17.0) }
        if machine.hasPrefix("iPhone14")  { return .fullTraining(tflops: 15.8) }
        // iPhone 13 (A15)
        if machine.hasPrefix("iPhone13")  { return .fullTraining(tflops: 15.8) }
        // iPhone 12 (A14) — inference only
        if machine.hasPrefix("iPhone12")  { return .inferenceOnly(tflops: 11.0) }
        // iPhone 11 (A13) — inference only
        if machine.hasPrefix("iPhone11")  { return .inferenceOnly(tflops: 8.0) }
        
        // iPad Pro M-series
        if machine.hasPrefix("iPad14") || machine.hasPrefix("iPad16") {
            return .fullTraining(tflops: 15.8)
        }
        if machine.hasPrefix("iPad13") { return .fullTraining(tflops: 11.0) }
        
        // Simulator
        if machine == "x86_64" || machine == "arm64" {
            return .fullTraining(tflops: 11.0) // Assume Apple Silicon Mac
        }
        
        return .unknown
    }
}

// MARK: - ANE Diagnostics

struct ANEDiagnostics: Codable {
    let isAvailable: Bool
    let deviceCapability: String
    let compileCount: Int
    let compileLimit: Int
    let needsRestart: Bool
    let clientActive: Bool
    let frameworkLoaded: Bool
    
    init(isAvailable: Bool, deviceCapability: ANEDeviceCapability,
         compileCount: Int, compileLimit: Int, needsRestart: Bool,
         clientActive: Bool, frameworkLoaded: Bool) {
        self.isAvailable = isAvailable
        self.deviceCapability = deviceCapability.description
        self.compileCount = compileCount
        self.compileLimit = compileLimit
        self.needsRestart = needsRestart
        self.clientActive = clientActive
        self.frameworkLoaded = frameworkLoaded
    }
}

// MARK: - ANE Logger

struct ANELog {
    static func info(_ msg: String)  { print("[ANE] ℹ️ \(msg)") }
    static func warn(_ msg: String)  { print("[ANE] ⚠️ \(msg)") }
    static func error(_ msg: String) { print("[ANE] ❌ \(msg)") }
    static func debug(_ msg: String) {
        #if DEBUG
        print("[ANE] 🔍 \(msg)")
        #endif
    }
}
