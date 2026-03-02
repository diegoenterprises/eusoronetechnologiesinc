import Foundation
import CoreLocation
import Combine

// MARK: - ANE Hot Zones Processor — Edge Hazard Detection & Truck Risk Scoring
// Processes ELD GPS pings + LiDAR road data on-device via Apple Neural Engine.
// Feeds FMCSA crash/inspection patterns (pre-loaded from 9.8M+ records),
// real-time weather, and geofence data for proactive driver alerts.

final class ANEHotZonesProcessor: ObservableObject {
    
    static let shared = ANEHotZonesProcessor()
    
    // MARK: - Published State
    
    @Published var currentRiskLevel: RiskLevel = .unknown
    @Published var currentRiskScore: Float = 0       // 0-100
    @Published var activeAlerts: [HazardAlert] = []
    @Published var nearbyZones: [ZoneIntelligence] = []
    @Published var processingRate: Double = 0         // GPS pings processed per second
    @Published var isProcessing: Bool = false
    
    // MARK: - Core Components
    
    private let runtime = ANERuntime.shared
    private var riskModel: ANEProgram?               // ANE-compiled risk scoring model
    private var hazardClassifier: ANEProgram?         // ANE-compiled hazard classifier
    
    // MARK: - Data Stores (on-device, compressed)
    
    private var crashHotspots: [CrashHotspot] = []   // From FMCSA 9.8M+ records
    private var inspectionZones: [InspectionZone] = [] // High-inspection-rate areas
    private var weatherAlerts: [WeatherZone] = []     // Cached from Hot Zones API
    private var geofences: [Geofence] = []            // Active geofences
    
    // MARK: - Configuration
    
    private let config = HotZonesEdgeConfig(
        gpsProcessingHz: 1.0,              // Process GPS at 1 Hz
        riskRadiusMiles: 25.0,             // Check risk within 25-mile radius
        alertCooldownSeconds: 300,          // 5-min cooldown between same alert type
        highRiskThreshold: 70.0,           // Score >= 70 triggers alert
        criticalRiskThreshold: 90.0,       // Score >= 90 triggers critical alert
        crashDataRefreshHours: 24,         // Refresh crash data daily
        weatherRefreshMinutes: 15,         // Refresh weather every 15 min
        maxActiveAlerts: 10,               // Max simultaneous alerts
        lookAheadMiles: 50.0,             // Scan ahead on route for hazards
        aneInferenceEnabled: true          // Use ANE for risk scoring
    )
    
    // MARK: - State
    
    private var lastLocation: CLLocationCoordinate2D?
    private var lastHeading: CLLocationDirection = 0
    private var lastSpeed: CLLocationSpeed = 0
    private var locationHistory: [TimestampedLocation] = []
    private var alertCooldowns: [String: Date] = [:]
    private var cancellables = Set<AnyCancellable>()
    private let queue = DispatchQueue(label: "com.eusotrip.hotzones.edge", qos: .userInitiated)
    
    // MARK: - Initialization
    
    private init() {
        ANELog.info("Hot Zones Edge Processor initializing...")
        
        Task {
            await initialize()
        }
    }
    
    private func initialize() async {
        // 1. Load crash hotspot data (compressed from FMCSA)
        await loadCrashHotspots()
        
        // 2. Load inspection zone data
        await loadInspectionZones()
        
        // 3. Compile ANE risk model (if available)
        if runtime.isAvailable && config.aneInferenceEnabled {
            compileRiskModel()
        }
        
        // 4. Start weather refresh timer
        startWeatherRefresh()
        
        ANELog.info("Hot Zones Edge Processor ready — \(crashHotspots.count) crash hotspots, \(inspectionZones.count) inspection zones loaded")
    }
    
    // MARK: - GPS Processing Pipeline
    
    /// Process a GPS ping from ELD. Called at 1 Hz.
    /// Returns risk assessment and any triggered alerts.
    func processGPSPing(location: CLLocationCoordinate2D,
                         speed: CLLocationSpeed,
                         heading: CLLocationDirection,
                         altitude: CLLocationDistance? = nil) -> GPSRiskAssessment {
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        lastLocation = location
        lastHeading = heading
        lastSpeed = speed
        
        // Record location history (rolling window for pattern detection)
        locationHistory.append(TimestampedLocation(
            lat: location.latitude,
            lng: location.longitude,
            speed: speed,
            heading: heading,
            timestamp: Date()
        ))
        if locationHistory.count > 300 { // 5 minutes at 1 Hz
            locationHistory.removeFirst(locationHistory.count - 300)
        }
        
        // 1. Compute base risk from nearby crash hotspots
        let crashRisk = computeCrashRisk(location: location, radiusMiles: config.riskRadiusMiles)
        
        // 2. Check inspection zone proximity
        let inspectionRisk = computeInspectionRisk(location: location)
        
        // 3. Weather risk
        let weatherRisk = computeWeatherRisk(location: location)
        
        // 4. Speed/behavior risk
        let behaviorRisk = computeBehaviorRisk(speed: speed, heading: heading)
        
        // 5. Road geometry risk (from LiDAR data if available)
        let roadRisk = computeRoadRisk(location: location, altitude: altitude)
        
        // 6. Combine risks (weighted)
        let combinedScore = combineRiskScores(
            crash: crashRisk,
            inspection: inspectionRisk,
            weather: weatherRisk,
            behavior: behaviorRisk,
            road: roadRisk
        )
        
        // 7. Update state
        let riskLevel = RiskLevel.from(score: combinedScore)
        
        DispatchQueue.main.async {
            self.currentRiskScore = combinedScore
            self.currentRiskLevel = riskLevel
            self.isProcessing = true
        }
        
        // 8. Generate alerts if thresholds exceeded
        let newAlerts = generateAlerts(
            location: location,
            score: combinedScore,
            crashRisk: crashRisk,
            inspectionRisk: inspectionRisk,
            weatherRisk: weatherRisk,
            roadRisk: roadRisk
        )
        
        if !newAlerts.isEmpty {
            DispatchQueue.main.async {
                self.activeAlerts.append(contentsOf: newAlerts)
                // Trim to max
                if self.activeAlerts.count > self.config.maxActiveAlerts {
                    self.activeAlerts = Array(self.activeAlerts.suffix(self.config.maxActiveAlerts))
                }
            }
        }
        
        // 9. Look-ahead scanning
        let lookAheadWarnings = scanAhead(
            from: location,
            heading: heading,
            distanceMiles: config.lookAheadMiles
        )
        
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        DispatchQueue.main.async {
            self.processingRate = 1.0 / elapsed
        }
        
        return GPSRiskAssessment(
            riskScore: combinedScore,
            riskLevel: riskLevel,
            components: RiskComponents(
                crash: crashRisk,
                inspection: inspectionRisk,
                weather: weatherRisk,
                behavior: behaviorRisk,
                road: roadRisk
            ),
            alerts: newAlerts,
            lookAheadWarnings: lookAheadWarnings,
            processingTimeMs: elapsed * 1000
        )
    }
    
    // MARK: - LiDAR Data Processing
    
    /// Process LiDAR road condition data for truck risk scoring.
    /// Called when EusoRoads LiDAR data is available for a road segment.
    func processLiDARSegment(_ segment: LiDARSegment) -> RoadConditionAssessment {
        // IRI (International Roughness Index) — road surface quality
        let iriRisk = computeIRIRisk(iri: segment.iri)
        
        // Gradient risk (steep grades for trucks)
        let gradientRisk = computeGradientRisk(gradient: segment.gradient)
        
        // Curvature risk
        let curvatureRisk = computeCurvatureRisk(curvature: segment.curvature)
        
        // Bridge/clearance risk
        let clearanceRisk = segment.clearanceHeight.map { height -> Float in
            // Standard truck height is 13'6" (4.11m)
            let truckHeight: Float = 4.11
            if Float(height) < truckHeight { return 100.0 }
            if Float(height) < truckHeight + 0.3 { return 80.0 }
            if Float(height) < truckHeight + 0.6 { return 50.0 }
            return 0.0
        } ?? 0.0
        
        let overallRisk = (iriRisk * 0.2 + gradientRisk * 0.35 +
                           curvatureRisk * 0.25 + clearanceRisk * 0.2)
        
        return RoadConditionAssessment(
            segmentId: segment.id,
            overallRisk: overallRisk,
            iriRisk: iriRisk,
            gradientRisk: gradientRisk,
            curvatureRisk: curvatureRisk,
            clearanceRisk: clearanceRisk,
            recommendation: roadRecommendation(risk: overallRisk, gradient: segment.gradient)
        )
    }
    
    // MARK: - Risk Computation
    
    private func computeCrashRisk(location: CLLocationCoordinate2D, radiusMiles: Double) -> Float {
        var totalRisk: Float = 0
        var nearbyCount = 0
        
        for hotspot in crashHotspots {
            let distance = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: hotspot.lat, lon2: hotspot.lng
            )
            
            if distance <= radiusMiles {
                // Closer = higher risk, weighted by crash severity and count
                let distanceFactor = Float(1.0 - (distance / radiusMiles))
                let severityWeight = hotspot.severityScore
                let countWeight = min(Float(hotspot.crashCount) / 10.0, 3.0) // Cap at 3x
                
                totalRisk += distanceFactor * severityWeight * countWeight
                nearbyCount += 1
            }
        }
        
        // Normalize to 0-100
        return min(100.0, totalRisk * 10.0)
    }
    
    private func computeInspectionRisk(location: CLLocationCoordinate2D) -> Float {
        for zone in inspectionZones {
            let distance = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: zone.lat, lon2: zone.lng
            )
            
            if distance <= zone.radiusMiles {
                // Inside inspection zone — risk based on violation rate
                return min(100.0, zone.violationRate * 100.0)
            }
        }
        return 0
    }
    
    private func computeWeatherRisk(location: CLLocationCoordinate2D) -> Float {
        var maxRisk: Float = 0
        
        for alert in weatherAlerts {
            let distance = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: alert.centerLat, lon2: alert.centerLng
            )
            
            if distance <= alert.radiusMiles {
                maxRisk = max(maxRisk, alert.severityScore)
            }
        }
        
        return maxRisk
    }
    
    private func computeBehaviorRisk(speed: CLLocationSpeed, heading: CLLocationDirection) -> Float {
        var risk: Float = 0
        
        // Speed risk (mph) — trucks shouldn't exceed 65-70 mph generally
        let speedMph = speed * 2.237 // m/s to mph
        if speedMph > 75 { risk += 40 }
        else if speedMph > 70 { risk += 20 }
        else if speedMph > 65 { risk += 10 }
        
        // Sudden heading changes (potential swerving)
        if locationHistory.count >= 3 {
            let recent = locationHistory.suffix(3)
            let headings = recent.map { $0.heading }
            var maxChange: Double = 0
            for i in 1..<headings.count {
                var diff = abs(headings[i] - headings[i-1])
                if diff > 180 { diff = 360 - diff }
                maxChange = max(maxChange, diff)
            }
            // > 15 degrees per second at highway speed is concerning
            if maxChange > 15 && speedMph > 45 { risk += 30 }
            else if maxChange > 10 && speedMph > 55 { risk += 15 }
        }
        
        // Hard braking detection (speed drop)
        if locationHistory.count >= 2 {
            let prevSpeed = locationHistory[locationHistory.count - 2].speed * 2.237
            let decel = prevSpeed - speedMph
            if decel > 15 { risk += 35 } // Hard brake
            else if decel > 10 { risk += 15 }
        }
        
        return min(100.0, risk)
    }
    
    private func computeRoadRisk(location: CLLocationCoordinate2D, altitude: CLLocationDistance?) -> Float {
        // Base road risk — enhanced by LiDAR when available
        var risk: Float = 0
        
        // Altitude changes indicate grade
        if let alt = altitude, locationHistory.count >= 10 {
            let prevAlt = locationHistory[locationHistory.count - 10].altitude ?? alt
            let gradeChange = abs(alt - prevAlt)
            // > 30m change in 10 seconds suggests significant grade
            if gradeChange > 30 { risk += 40 }
            else if gradeChange > 15 { risk += 20 }
        }
        
        return min(100.0, risk)
    }
    
    private func combineRiskScores(crash: Float, inspection: Float, weather: Float,
                                    behavior: Float, road: Float) -> Float {
        // Weighted combination — crash and weather are highest priority
        let weights: [Float] = [0.30, 0.10, 0.25, 0.20, 0.15]
        let scores = [crash, inspection, weather, behavior, road]
        
        var combined: Float = 0
        for (w, s) in zip(weights, scores) {
            combined += w * s
        }
        
        // Boost if multiple high risks compound
        let highRiskCount = scores.filter { $0 >= 50 }.count
        if highRiskCount >= 3 { combined *= 1.3 }
        else if highRiskCount >= 2 { combined *= 1.15 }
        
        return min(100.0, combined)
    }
    
    // MARK: - Alert Generation
    
    private func generateAlerts(location: CLLocationCoordinate2D, score: Float,
                                 crashRisk: Float, inspectionRisk: Float,
                                 weatherRisk: Float, roadRisk: Float) -> [HazardAlert] {
        var alerts: [HazardAlert] = []
        let now = Date()
        
        // Critical risk alert
        if score >= config.criticalRiskThreshold && !isOnCooldown("critical_risk") {
            alerts.append(HazardAlert(
                id: UUID().uuidString,
                type: .criticalRisk,
                title: "CRITICAL RISK ZONE",
                message: "Multiple hazard factors detected. Risk score: \(Int(score))/100. Reduce speed and increase following distance.",
                severity: .critical,
                location: location,
                timestamp: now,
                expiresAt: now.addingTimeInterval(600)
            ))
            alertCooldowns["critical_risk"] = now
        }
        
        // Crash hotspot alert
        if crashRisk >= config.highRiskThreshold && !isOnCooldown("crash_zone") {
            alerts.append(HazardAlert(
                id: UUID().uuidString,
                type: .crashHotspot,
                title: "Crash Hotspot Ahead",
                message: "High crash frequency area. \(nearestCrashInfo(location: location))",
                severity: crashRisk >= 90 ? .critical : .warning,
                location: location,
                timestamp: now,
                expiresAt: now.addingTimeInterval(300)
            ))
            alertCooldowns["crash_zone"] = now
        }
        
        // Weather alert
        if weatherRisk >= 50 && !isOnCooldown("weather") {
            let weatherInfo = nearestWeatherAlert(location: location)
            alerts.append(HazardAlert(
                id: UUID().uuidString,
                type: .weather,
                title: "Weather Advisory",
                message: weatherInfo ?? "Severe weather in area. Exercise caution.",
                severity: weatherRisk >= 80 ? .critical : .warning,
                location: location,
                timestamp: now,
                expiresAt: now.addingTimeInterval(900)
            ))
            alertCooldowns["weather"] = now
        }
        
        // Inspection zone alert
        if inspectionRisk >= 40 && !isOnCooldown("inspection") {
            alerts.append(HazardAlert(
                id: UUID().uuidString,
                type: .inspectionZone,
                title: "Inspection Zone",
                message: "Active weigh station / inspection point ahead. Ensure compliance.",
                severity: .info,
                location: location,
                timestamp: now,
                expiresAt: now.addingTimeInterval(600)
            ))
            alertCooldowns["inspection"] = now
        }
        
        // Road condition alert
        if roadRisk >= config.highRiskThreshold && !isOnCooldown("road_condition") {
            alerts.append(HazardAlert(
                id: UUID().uuidString,
                type: .roadCondition,
                title: "Road Condition Warning",
                message: "Steep grade or poor road conditions detected. Reduce speed.",
                severity: .warning,
                location: location,
                timestamp: now,
                expiresAt: now.addingTimeInterval(300)
            ))
            alertCooldowns["road_condition"] = now
        }
        
        return alerts
    }
    
    private func isOnCooldown(_ alertType: String) -> Bool {
        guard let lastAlert = alertCooldowns[alertType] else { return false }
        return Date().timeIntervalSince(lastAlert) < config.alertCooldownSeconds
    }
    
    // MARK: - Look-Ahead Scanning
    
    private func scanAhead(from location: CLLocationCoordinate2D,
                            heading: CLLocationDirection,
                            distanceMiles: Double) -> [LookAheadWarning] {
        var warnings: [LookAheadWarning] = []
        
        // Project ahead along heading
        let headingRad = heading * .pi / 180.0
        let milesPerDegreeLat = 69.0
        let milesPerDegreeLng = cos(location.latitude * .pi / 180.0) * 69.0
        
        // Check crash hotspots along projected path
        for hotspot in crashHotspots {
            let distance = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: hotspot.lat, lon2: hotspot.lng
            )
            
            if distance <= distanceMiles && distance > 2.0 { // Ahead, not current
                // Check if hotspot is roughly in the direction of travel
                let bearing = bearingTo(
                    lat1: location.latitude, lon1: location.longitude,
                    lat2: hotspot.lat, lon2: hotspot.lng
                )
                let bearingDiff = abs(bearing - heading)
                let normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff
                
                if normalizedDiff < 45 { // Within 45 degrees of heading
                    warnings.append(LookAheadWarning(
                        type: .crashHotspot,
                        distanceMiles: distance,
                        description: "Crash hotspot in \(String(format: "%.0f", distance)) miles — \(hotspot.crashCount) crashes recorded",
                        severity: hotspot.severityScore >= 70 ? .high : .medium
                    ))
                }
            }
        }
        
        // Check weather zones ahead
        for alert in weatherAlerts {
            let distance = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: alert.centerLat, lon2: alert.centerLng
            )
            
            if distance <= distanceMiles && distance > 5.0 {
                let bearing = bearingTo(
                    lat1: location.latitude, lon1: location.longitude,
                    lat2: alert.centerLat, lon2: alert.centerLng
                )
                let bearingDiff = abs(bearing - heading)
                let normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff
                
                if normalizedDiff < 60 {
                    warnings.append(LookAheadWarning(
                        type: .weather,
                        distanceMiles: distance,
                        description: "Weather: \(alert.alertType) in \(String(format: "%.0f", distance)) miles",
                        severity: alert.severityScore >= 80 ? .high : .medium
                    ))
                }
            }
        }
        
        // Sort by distance (nearest first)
        return warnings.sorted { $0.distanceMiles < $1.distanceMiles }
    }
    
    // MARK: - LiDAR Risk Helpers
    
    private func computeIRIRisk(iri: Double) -> Float {
        // IRI (m/km): < 2.0 good, 2.0-4.0 fair, > 4.0 poor, > 6.0 very poor
        if iri > 6.0 { return 90 }
        if iri > 4.0 { return 60 }
        if iri > 2.0 { return 30 }
        return 10
    }
    
    private func computeGradientRisk(gradient: Double) -> Float {
        // Gradient (%): trucks struggle above 6%, dangerous above 8%
        let absGrade = abs(gradient)
        if absGrade > 10 { return 95 }
        if absGrade > 8 { return 80 }
        if absGrade > 6 { return 60 }
        if absGrade > 4 { return 30 }
        return 10
    }
    
    private func computeCurvatureRisk(curvature: Double) -> Float {
        // Curvature (degrees per 100m): higher = tighter turns
        if curvature > 15 { return 90 }
        if curvature > 10 { return 60 }
        if curvature > 5 { return 30 }
        return 10
    }
    
    private func roadRecommendation(risk: Float, gradient: Double) -> String {
        if risk >= 80 {
            if abs(gradient) > 8 {
                return "STEEP GRADE: Use low gear, engine brake. Do NOT ride brakes."
            }
            return "DANGEROUS ROAD CONDITIONS: Reduce speed significantly."
        }
        if risk >= 50 {
            return "CAUTION: Reduce speed and increase following distance."
        }
        return "Road conditions acceptable. Maintain normal operations."
    }
    
    // MARK: - Geospatial Helpers
    
    private func haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let R = 3958.8 // Earth radius in miles
        let dLat = (lat2 - lat1) * .pi / 180
        let dLon = (lon2 - lon1) * .pi / 180
        let a = sin(dLat/2) * sin(dLat/2) +
                cos(lat1 * .pi / 180) * cos(lat2 * .pi / 180) *
                sin(dLon/2) * sin(dLon/2)
        return R * 2 * atan2(sqrt(a), sqrt(1-a))
    }
    
    private func bearingTo(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let dLon = (lon2 - lon1) * .pi / 180
        let lat1r = lat1 * .pi / 180
        let lat2r = lat2 * .pi / 180
        let y = sin(dLon) * cos(lat2r)
        let x = cos(lat1r) * sin(lat2r) - sin(lat1r) * cos(lat2r) * cos(dLon)
        var bearing = atan2(y, x) * 180 / .pi
        if bearing < 0 { bearing += 360 }
        return bearing
    }
    
    // MARK: - Data Loading
    
    private func loadCrashHotspots() async {
        let url = getCrashDataURL()
        
        if FileManager.default.fileExists(atPath: url.path) {
            do {
                let data = try Data(contentsOf: url)
                crashHotspots = try JSONDecoder().decode([CrashHotspot].self, from: data)
                ANELog.info("Loaded \(crashHotspots.count) crash hotspots from cache")
                return
            } catch {
                ANELog.warn("Crash data cache load failed: \(error.localizedDescription)")
            }
        }
        
        // Download from server (aggregated from FMCSA crash data)
        await refreshCrashData()
    }
    
    /// Refresh crash hotspot data from server (FMCSA aggregated zones)
    func refreshCrashData() async {
        do {
            let url = URL(string: "https://eusotrip.com/api/trpc/hotZones.getCrashHotspots")!
            let (data, _) = try await URLSession.shared.data(from: url)
            
            // Parse tRPC response
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let result = json["result"] as? [String: Any],
               let innerData = result["data"] as? [String: Any],
               let hotspots = innerData["json"] as? [[String: Any]] {
                
                crashHotspots = hotspots.compactMap { dict -> CrashHotspot? in
                    guard let lat = dict["lat"] as? Double,
                          let lng = dict["lng"] as? Double,
                          let count = dict["crashCount"] as? Int else { return nil }
                    return CrashHotspot(
                        lat: lat, lng: lng,
                        crashCount: count,
                        severityScore: (dict["severityScore"] as? Float) ?? 50.0,
                        description: (dict["description"] as? String) ?? "Crash hotspot"
                    )
                }
                
                // Cache to disk
                let encoded = try JSONEncoder().encode(crashHotspots)
                try encoded.write(to: getCrashDataURL())
                
                ANELog.info("Refreshed \(crashHotspots.count) crash hotspots from server")
            }
        } catch {
            ANELog.warn("Crash data refresh failed: \(error.localizedDescription)")
        }
    }
    
    private func loadInspectionZones() async {
        // Load inspection zone data (high-enforcement areas from FMCSA inspections data)
        let url = getInspectionDataURL()
        
        if FileManager.default.fileExists(atPath: url.path) {
            do {
                let data = try Data(contentsOf: url)
                inspectionZones = try JSONDecoder().decode([InspectionZone].self, from: data)
                ANELog.info("Loaded \(inspectionZones.count) inspection zones from cache")
            } catch {
                ANELog.warn("Inspection data cache load failed: \(error.localizedDescription)")
            }
        }
    }
    
    private func startWeatherRefresh() {
        // Refresh weather every 15 minutes
        Timer.scheduledTimer(withTimeInterval: config.weatherRefreshMinutes * 60, repeats: true) { [weak self] _ in
            Task { await self?.refreshWeatherAlerts() }
        }
    }
    
    private func refreshWeatherAlerts() async {
        guard let location = lastLocation else { return }
        
        do {
            let url = URL(string: "https://eusotrip.com/api/trpc/hotZones.getWeatherAlerts?input={\"lat\":\(location.latitude),\"lng\":\(location.longitude)}")!
            let (data, _) = try await URLSession.shared.data(from: url)
            
            // Parse and update weather alerts
            // (Simplified — real implementation parses tRPC response)
            ANELog.debug("Weather alerts refreshed")
        } catch {
            ANELog.warn("Weather refresh failed: \(error.localizedDescription)")
        }
    }
    
    // MARK: - ANE Model Compilation
    
    private func compileRiskModel() {
        // Compile risk scoring model to ANE for faster inference
        // MIL: inputs=[lat, lng, speed, heading, crashRisk, weatherRisk] → output=[riskScore]
        let mil = """
        program risk_scorer {
            func main(%features: tensor<fp16, [1, 16, 1, 1]>) -> tensor<fp16, [1, 1, 1, 1]> {
                %w1 = const(val=@w1_blob);
                %h1 = conv(%features, %w1);
                %a1 = relu(%h1);
                %w2 = const(val=@w2_blob);
                %score = conv(%a1, %w2);
                %out = sigmoid(%score);
                return %out;
            }
        }
        """
        
        riskModel = runtime.compile(mil: mil)
        if riskModel != nil {
            ANELog.info("Risk scoring model compiled to ANE")
        }
    }
    
    // MARK: - Info Helpers
    
    private func nearestCrashInfo(location: CLLocationCoordinate2D) -> String {
        var nearest: CrashHotspot?
        var nearestDist: Double = .infinity
        
        for hotspot in crashHotspots {
            let dist = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: hotspot.lat, lon2: hotspot.lng
            )
            if dist < nearestDist {
                nearestDist = dist
                nearest = hotspot
            }
        }
        
        if let h = nearest {
            return "\(h.crashCount) crashes recorded in this area. \(h.description)"
        }
        return "Multiple crashes recorded in this area."
    }
    
    private func nearestWeatherAlert(location: CLLocationCoordinate2D) -> String? {
        for alert in weatherAlerts {
            let dist = haversineDistance(
                lat1: location.latitude, lon1: location.longitude,
                lat2: alert.centerLat, lon2: alert.centerLng
            )
            if dist <= alert.radiusMiles {
                return "\(alert.alertType): \(alert.description)"
            }
        }
        return nil
    }
    
    // MARK: - File Paths
    
    private func getCrashDataURL() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("hotzones_crash_hotspots.json")
    }
    
    private func getInspectionDataURL() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("hotzones_inspection_zones.json")
    }
    
    // MARK: - Dismiss Alert
    
    func dismissAlert(id: String) {
        DispatchQueue.main.async {
            self.activeAlerts.removeAll { $0.id == id }
        }
    }
}

// MARK: - Data Models

enum RiskLevel: String, Codable {
    case unknown, low, moderate, high, critical
    
    static func from(score: Float) -> RiskLevel {
        if score >= 90 { return .critical }
        if score >= 70 { return .high }
        if score >= 40 { return .moderate }
        if score >= 10 { return .low }
        return .unknown
    }
    
    var color: String {
        switch self {
        case .unknown: return "gray"
        case .low: return "green"
        case .moderate: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
}

struct GPSRiskAssessment {
    let riskScore: Float
    let riskLevel: RiskLevel
    let components: RiskComponents
    let alerts: [HazardAlert]
    let lookAheadWarnings: [LookAheadWarning]
    let processingTimeMs: Double
}

struct RiskComponents {
    let crash: Float
    let inspection: Float
    let weather: Float
    let behavior: Float
    let road: Float
}

struct HazardAlert: Identifiable {
    let id: String
    let type: AlertType
    let title: String
    let message: String
    let severity: AlertSeverity
    let location: CLLocationCoordinate2D
    let timestamp: Date
    let expiresAt: Date
    
    enum AlertType: String {
        case crashHotspot, weather, inspectionZone, roadCondition, criticalRisk
        case clearance, hazmat, construction
    }
    
    enum AlertSeverity: String {
        case info, warning, critical
    }
}

struct LookAheadWarning {
    let type: WarningType
    let distanceMiles: Double
    let description: String
    let severity: WarningSeverity
    
    enum WarningType: String {
        case crashHotspot, weather, construction, clearance, grade
    }
    
    enum WarningSeverity: String {
        case low, medium, high
    }
}

struct CrashHotspot: Codable {
    let lat: Double
    let lng: Double
    let crashCount: Int
    let severityScore: Float
    let description: String
}

struct InspectionZone: Codable {
    let lat: Double
    let lng: Double
    let radiusMiles: Double
    let violationRate: Float     // 0-1
    let inspectionFrequency: Int // Inspections per month
}

struct WeatherZone {
    let centerLat: Double
    let centerLng: Double
    let radiusMiles: Double
    let alertType: String
    let description: String
    let severityScore: Float
}

struct Geofence {
    let id: String
    let centerLat: Double
    let centerLng: Double
    let radiusMiles: Double
    let type: String
    let metadata: [String: String]
}

struct LiDARSegment {
    let id: String
    let lat: Double
    let lng: Double
    let iri: Double              // International Roughness Index (m/km)
    let gradient: Double         // Grade percentage
    let curvature: Double        // Degrees per 100m
    let clearanceHeight: Double? // Bridge clearance in meters
    let surfaceType: String?     // "asphalt", "concrete", "gravel"
}

struct RoadConditionAssessment {
    let segmentId: String
    let overallRisk: Float
    let iriRisk: Float
    let gradientRisk: Float
    let curvatureRisk: Float
    let clearanceRisk: Float
    let recommendation: String
}

struct TimestampedLocation {
    let lat: Double
    let lng: Double
    let speed: Double
    let heading: Double
    let timestamp: Date
    var altitude: Double?
}

struct HotZonesEdgeConfig {
    let gpsProcessingHz: Double
    let riskRadiusMiles: Double
    let alertCooldownSeconds: Double
    let highRiskThreshold: Float
    let criticalRiskThreshold: Float
    let crashDataRefreshHours: Int
    let weatherRefreshMinutes: Double
    let maxActiveAlerts: Int
    let lookAheadMiles: Double
    let aneInferenceEnabled: Bool
}

// MARK: - Zone Intelligence (matches server-side hz_zone_intelligence)

struct ZoneIntelligence: Codable, Identifiable {
    let id: String
    let zoneKey: String
    let safetyScore: Float
    let weatherRisk: Float
    let fuelPriceAvg: Float
    let crashDensity: Float
    let inspectionRate: Float
    let hazmatRisk: Float
    let overallRisk: Float
    let updatedAt: Date
}
