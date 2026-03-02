import Foundation
import IOSurface
import Accelerate

// MARK: - ANE Tensor — IOSurface-Backed Tensor for Apple Neural Engine
// ANE requires all input/output tensors in IOSurface shared memory
// Format: [1, Channels, 1, Spatial] in fp16 (channel-first layout)

final class ANETensor {
    
    // MARK: - Properties
    
    let channels: Int      // C dimension
    let spatial: Int       // S dimension (sequence length for transformers)
    let ioSurface: IOSurfaceRef
    let byteCount: Int
    
    /// Shape in ANE format: [1, C, 1, S]
    var shape: [Int] { [1, channels, 1, spatial] }
    
    /// Total number of fp16 elements
    var elementCount: Int { channels * spatial }
    
    // MARK: - Initialization
    
    /// Create a new ANE tensor backed by an IOSurface.
    /// - Parameters:
    ///   - channels: Channel dimension (embedding dim, hidden dim, etc.)
    ///   - spatial: Spatial dimension (sequence length)
    init(channels: Int, spatial: Int) {
        self.channels = channels
        self.spatial = spatial
        self.byteCount = channels * spatial * MemoryLayout<Float16>.size
        
        // Create IOSurface properties
        let properties: [IOSurfacePropertyKey: Any] = [
            .width: spatial,
            .height: 1,
            .bytesPerRow: spatial * MemoryLayout<Float16>.size,
            .bytesPerElement: MemoryLayout<Float16>.size,
            .pixelFormat: 0x66683136, // 'fh16' — fp16 pixel format
            .allocSize: byteCount,
            .planeCount: channels,
        ]
        
        guard let surface = IOSurfaceCreate(properties as CFDictionary) else {
            fatalError("[ANETensor] Failed to create IOSurface (\(channels)x\(spatial))")
        }
        
        self.ioSurface = surface
        
        // Lock and zero-initialize
        IOSurfaceLock(surface, [], nil)
        if let base = IOSurfaceGetBaseAddress(surface) {
            memset(base, 0, byteCount)
        }
        IOSurfaceUnlock(surface, [], nil)
    }
    
    /// Wrap an existing IOSurface (from ANE output)
    init?(fromIOSurface surface: AnyObject) {
        guard let surfaceRef = surface as? IOSurfaceRef else {
            ANELog.error("Cannot cast AnyObject to IOSurfaceRef")
            return nil
        }
        
        self.ioSurface = surfaceRef
        
        // Infer dimensions from surface properties
        let width = IOSurfaceGetWidth(surfaceRef)
        let planeCount = IOSurfaceGetPlaneCount(surfaceRef)
        
        self.spatial = width
        self.channels = max(planeCount, 1)
        self.byteCount = channels * spatial * MemoryLayout<Float16>.size
    }
    
    // MARK: - Data Access
    
    /// Write fp16 data into the tensor
    func write(data: UnsafePointer<Float16>, count: Int) {
        precondition(count <= elementCount, "Data count (\(count)) exceeds tensor capacity (\(elementCount))")
        
        IOSurfaceLock(ioSurface, [], nil)
        if let base = IOSurfaceGetBaseAddress(ioSurface) {
            memcpy(base, data, count * MemoryLayout<Float16>.size)
        }
        IOSurfaceUnlock(ioSurface, [], nil)
    }
    
    /// Write fp32 data (auto-converts to fp16)
    func write(float32 data: UnsafePointer<Float>, count: Int) {
        precondition(count <= elementCount, "Data count (\(count)) exceeds tensor capacity (\(elementCount))")
        
        // Convert fp32 → fp16 using Accelerate
        var fp16Buffer = [Float16](repeating: 0, count: count)
        var src = vImage_Buffer(data: UnsafeMutableRawPointer(mutating: data),
                                height: 1, width: vImagePixelCount(count),
                                rowBytes: count * MemoryLayout<Float>.size)
        var dst = vImage_Buffer(data: &fp16Buffer,
                                height: 1, width: vImagePixelCount(count),
                                rowBytes: count * MemoryLayout<Float16>.size)
        vImageConvert_PlanarFtoPlanar16F(&src, &dst, 0)
        
        fp16Buffer.withUnsafeBufferPointer { ptr in
            write(data: ptr.baseAddress!, count: count)
        }
    }
    
    /// Read fp16 data from the tensor
    func read() -> [Float16] {
        var result = [Float16](repeating: 0, count: elementCount)
        
        IOSurfaceLock(ioSurface, .readOnly, nil)
        if let base = IOSurfaceGetBaseAddress(ioSurface) {
            memcpy(&result, base, byteCount)
        }
        IOSurfaceUnlock(ioSurface, .readOnly, nil)
        
        return result
    }
    
    /// Read as fp32 (auto-converts from fp16)
    func readFloat32() -> [Float] {
        let fp16Data = read()
        var fp32Result = [Float](repeating: 0, count: elementCount)
        
        fp16Data.withUnsafeBufferPointer { srcPtr in
            var src = vImage_Buffer(data: UnsafeMutableRawPointer(mutating: srcPtr.baseAddress!),
                                    height: 1, width: vImagePixelCount(elementCount),
                                    rowBytes: elementCount * MemoryLayout<Float16>.size)
            fp32Result.withUnsafeMutableBufferPointer { dstPtr in
                var dst = vImage_Buffer(data: dstPtr.baseAddress!,
                                        height: 1, width: vImagePixelCount(elementCount),
                                        rowBytes: elementCount * MemoryLayout<Float>.size)
                vImageConvert_Planar16FtoPlanarF(&src, &dst, 0)
            }
        }
        
        return fp32Result
    }
    
    // MARK: - Convenience Initializers
    
    /// Create a tensor filled with random values (for weight initialization)
    static func random(channels: Int, spatial: Int, scale: Float = 0.02) -> ANETensor {
        let tensor = ANETensor(channels: channels, spatial: spatial)
        let count = channels * spatial
        
        // Xavier/He initialization
        var randomData = [Float](repeating: 0, count: count)
        for i in 0..<count {
            // Box-Muller transform for normal distribution
            let u1 = Float.random(in: 0.001...1.0)
            let u2 = Float.random(in: 0.001...1.0)
            randomData[i] = scale * sqrt(-2.0 * log(u1)) * cos(2.0 * .pi * u2)
        }
        
        randomData.withUnsafeBufferPointer { ptr in
            tensor.write(float32: ptr.baseAddress!, count: count)
        }
        
        return tensor
    }
    
    /// Create a tensor filled with zeros
    static func zeros(channels: Int, spatial: Int) -> ANETensor {
        return ANETensor(channels: channels, spatial: spatial)
    }
    
    /// Create a tensor from a flat fp32 array
    static func from(float32 data: [Float], channels: Int, spatial: Int) -> ANETensor {
        precondition(data.count == channels * spatial,
                     "Data count (\(data.count)) != channels*spatial (\(channels * spatial))")
        let tensor = ANETensor(channels: channels, spatial: spatial)
        data.withUnsafeBufferPointer { ptr in
            tensor.write(float32: ptr.baseAddress!, count: data.count)
        }
        return tensor
    }
    
    // MARK: - Serialization
    
    /// Serialize tensor data for checkpoint saving
    func serialize() -> Data {
        let fp16Data = read()
        return fp16Data.withUnsafeBufferPointer { ptr in
            Data(bytes: ptr.baseAddress!, count: byteCount)
        }
    }
    
    /// Deserialize tensor data from checkpoint
    func deserialize(from data: Data) {
        precondition(data.count == byteCount,
                     "Data size (\(data.count)) != expected (\(byteCount))")
        data.withUnsafeBytes { rawPtr in
            let fp16Ptr = rawPtr.bindMemory(to: Float16.self)
            write(data: fp16Ptr.baseAddress!, count: elementCount)
        }
    }
    
    // MARK: - Debug
    
    var debugDescription: String {
        let fp32 = readFloat32()
        let min = fp32.min() ?? 0
        let max = fp32.max() ?? 0
        let sum = fp32.reduce(0, +)
        let mean = fp32.isEmpty ? 0 : sum / Float(fp32.count)
        return "ANETensor[\(channels)x\(spatial)] min=\(String(format: "%.4f", min)) max=\(String(format: "%.4f", max)) mean=\(String(format: "%.4f", mean))"
    }
}

// MARK: - Tensor Operations (CPU-side, using Accelerate)

extension ANETensor {
    
    /// Element-wise add: self += other * scale
    func addScaled(_ other: ANETensor, scale: Float = 1.0) {
        precondition(elementCount == other.elementCount, "Shape mismatch")
        
        var selfData = readFloat32()
        let otherData = other.readFloat32()
        
        // vDSP: selfData += otherData * scale
        var s = scale
        vDSP_vsma(otherData, 1, &s, selfData, 1, &selfData, 1, vDSP_Length(elementCount))
        
        selfData.withUnsafeBufferPointer { ptr in
            write(float32: ptr.baseAddress!, count: elementCount)
        }
    }
    
    /// RMSNorm on CPU (vectorized via vDSP)
    /// Returns normalized tensor + saves RMS for backward pass
    func rmsNorm(epsilon: Float = 1e-6) -> (normalized: ANETensor, rms: Float) {
        let data = readFloat32()
        
        // Compute RMS: sqrt(mean(x^2) + eps)
        var sumSq: Float = 0
        vDSP_svesq(data, 1, &sumSq, vDSP_Length(elementCount))
        let rms = sqrt(sumSq / Float(elementCount) + epsilon)
        
        // Normalize: x / rms
        var normalized = [Float](repeating: 0, count: elementCount)
        var rmsVal = rms
        vDSP_vsdiv(data, 1, &rmsVal, &normalized, 1, vDSP_Length(elementCount))
        
        let result = ANETensor.from(float32: normalized, channels: channels, spatial: spatial)
        return (result, rms)
    }
    
    /// Softmax along the spatial dimension (per channel)
    func softmax() -> ANETensor {
        var data = readFloat32()
        
        for c in 0..<channels {
            let offset = c * spatial
            
            // Find max for numerical stability
            var maxVal: Float = -Float.infinity
            vDSP_maxv(Array(data[offset..<offset + spatial]), 1, &maxVal, vDSP_Length(spatial))
            
            // Subtract max and exponentiate
            var negMax = -maxVal
            vDSP_vsadd(Array(data[offset..<offset + spatial]), 1, &negMax,
                        &data[offset], 1, vDSP_Length(spatial))
            
            var count = Int32(spatial)
            vvexpf(&data[offset], data[offset..<offset + spatial].map { $0 }, &count)
            
            // Normalize by sum
            var sum: Float = 0
            vDSP_sve(Array(data[offset..<offset + spatial]), 1, &sum, vDSP_Length(spatial))
            vDSP_vsdiv(Array(data[offset..<offset + spatial]), 1, &sum,
                        &data[offset], 1, vDSP_Length(spatial))
        }
        
        return ANETensor.from(float32: data, channels: channels, spatial: spatial)
    }
}
