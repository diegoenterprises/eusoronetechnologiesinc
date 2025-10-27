import SwiftUI

// MARK: - Main App Content
struct CatalystOilIdentifierView: View {
    @State private var selectedTab = 1 // Jobs tab selected (where oil identifier would be)
    @State private var apiGravity: Double = 39.6
    @State private var sulfurContent: Double = 0.24
    @State private var bswContent: Double = 0.3
    
    // Wave animation states
    @State private var waveOffset1: CGFloat = 0
    @State private var waveOffset2: CGFloat = 180
    
    // Particle animation states
    @State private var particleFloat: CGFloat = 0
    @State private var particleRotation: Double = 0
    
    // EXACT COLOR DEFINITIONS FROM HTML CSS - DARK MODE
    struct OilColors {
        static let primary = Color(red: 190/255, green: 1/255, blue: 255/255) // #BE01FF
        static let secondary = Color(red: 20/255, green: 115/255, blue: 255/255) // #1473FF
        static let success = Color(red: 0/255, green: 196/255, blue: 140/255) // #00C48C
        static let warning = Color(red: 255/255, green: 167/255, blue: 38/255) // #FFA726
        static let danger = Color(red: 244/255, green: 67/255, blue: 54/255) // #F44336
        static let info = Color(red: 33/255, green: 150/255, blue: 243/255) // #2196F3
        
        // Dark Mode Colors
        static let bgDark = Color(red: 12/255, green: 12/255, blue: 15/255) // Very dark background
        static let bgMedium = Color(red: 18/255, green: 18/255, blue: 22/255) // Medium dark
        static let textLight = Color(red: 240/255, green: 240/255, blue: 245/255) // Light text
        static let textMedium = Color(red: 160/255, green: 160/255, blue: 170/255) // Medium text
        static let textDim = Color(red: 100/255, green: 100/255, blue: 110/255) // Dim text
        static let cardDark = Color(red: 25/255, green: 25/255, blue: 30/255) // Dark cards
        static let borderDark = Color.white.opacity(0.08) // Dark borders
        static let glassDark = Color(red: 30/255, green: 30/255, blue: 38/255) // Glass effect
        
        // Gradient definitions - Enhanced for dark mode
        static let mainGradient = LinearGradient(
            gradient: Gradient(colors: [secondary, primary]),
            startPoint: .leading,
            endPoint: .trailing
        )
        
        // Wave gradient for the liquid - more vibrant in dark mode
        static let waveGradient = LinearGradient(
            gradient: Gradient(colors: [primary.opacity(0.9), secondary.opacity(0.9)]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let oilSampleGradient = LinearGradient(
            gradient: Gradient(colors: [primary.opacity(0.15), secondary.opacity(0.15)]),
            startPoint: .top,
            endPoint: .bottom
        )
        
        static let shineGradient = LinearGradient(
            gradient: Gradient(stops: [
                .init(color: Color.white.opacity(0.15), location: 0.0),
                .init(color: Color.white.opacity(0.08), location: 0.4),
                .init(color: Color.white.opacity(0.0), location: 0.6)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        // Glass morphism effect for dark mode
        static let glassMorphism = LinearGradient(
            gradient: Gradient(colors: [
                Color.white.opacity(0.1),
                Color.white.opacity(0.05)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                OilColors.bgDark.ignoresSafeArea()
                
                ScrollView {
                    LazyVStack(spacing: 0) {
                        headerSection
                        contentSection
                        Spacer(minLength: 100)
                    }
                }
                .ignoresSafeArea(edges: .top)
                
                VStack {
                    Spacer()
                    customTabBar
                }
            }
        }
        #if os(iOS)
        .navigationBarHidden(true)
        #endif
        .onAppear {
            startWaveAnimation()
        }
    }
    
    private func startWaveAnimation() {
        // Wave animations
        withAnimation(Animation.linear(duration: 2.5).repeatForever(autoreverses: false)) {
            waveOffset1 = 360
        }
        withAnimation(Animation.linear(duration: 3.0).repeatForever(autoreverses: false)) {
            waveOffset2 = -360
        }
        
        // Particle floating animation
        withAnimation(Animation.easeInOut(duration: 4.0).repeatForever(autoreverses: true)) {
            particleFloat = 3.0
        }
        
        // Particle rotation animation
        withAnimation(Animation.linear(duration: 8.0).repeatForever(autoreverses: false)) {
            particleRotation = 360
        }
    }
    
    // MARK: - Header Section
    var headerSection: some View {
        ZStack {
            // Header background with gradient and bottom rounded corners
            OilColors.mainGradient
                .frame(height: 140)
                .clipShape(
                    UnevenRoundedRectangle(
                        topLeadingRadius: 0,
                        bottomLeadingRadius: 24,
                        bottomTrailingRadius: 24,
                        topTrailingRadius: 0
                    )
                )
                .overlay(
                    OilColors.shineGradient.opacity(0.3)
                        .clipShape(
                            UnevenRoundedRectangle(
                                topLeadingRadius: 0,
                                bottomLeadingRadius: 24,
                                bottomTrailingRadius: 24,
                                topTrailingRadius: 0
                            )
                        )
                )
            
            VStack {
                HStack {
                    // Back button
                    Button(action: {}) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 20, weight: .medium))
                            Text("Back")
                                .font(.system(size: 14))
                        }
                        .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    // QR Scan button
                    Button(action: {}) {
                        Image(systemName: "qrcode.viewfinder")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 50)
                
                Spacer()
            }
        }
    }
    
    // MARK: - Content Section
    var contentSection: some View {
        VStack(spacing: 0) {
            pageHeader
            oilIdentifierCard
            parametersSection
            similarOilsSection
            actionButtons
        }
        .padding(.top, 16)
    }
    
    // MARK: - Page Header
    var pageHeader: some View {
        VStack(alignment: .center, spacing: 8) {
            Text("SPECTRA-MATCH™")
                .font(.system(size: 24, weight: .light))
                .foregroundColor(OilColors.textLight)
                .frame(maxWidth: .infinity, alignment: .center)
            
            Text("Scan run ticket or adjust parameters manually")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(OilColors.textMedium)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Oil Identifier Card
    var oilIdentifierCard: some View {
        VStack(spacing: 0) {
            // Top gradient line
            Rectangle()
                .fill(OilColors.mainGradient)
                .frame(height: 3)
                .opacity(0.9)
            
            // Oil visualization
            oilVisualization
        }
        .background(OilColors.cardDark)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(OilColors.borderDark, lineWidth: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(OilColors.glassMorphism, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.3), radius: 10, y: 5)
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
    }
    
    // MARK: - Oil Visualization
    var oilVisualization: some View {
        VStack(spacing: 20) {
            // Oil sample container with waves
            ZStack {
                // Background circle with gradient outline
                Circle()
                    .fill(OilColors.oilSampleGradient)
                    .frame(width: 160, height: 160)
                    .overlay(
                        Circle()
                            .stroke(OilColors.mainGradient, lineWidth: 3)
                    )
                    .shadow(color: .black.opacity(0.05), radius: 15)
                
                // Wave liquid container
                waveContainer
                
                // Shine effect
                Circle()
                    .fill(OilColors.shineGradient)
                    .frame(width: 160, height: 160)
                
                // Temperature value with white text and gradient outline
                ZStack {
                    // Gradient outline effect
                    Text("39.6°")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.clear)
                        .overlay(
                            OilColors.mainGradient
                                .mask(
                                    Text("39.6°")
                                        .font(.system(size: 24, weight: .semibold))
                                )
                        )
                        .padding(.bottom, 4)
                    
                    // Main value
                    Text("39.6°")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(OilColors.textLight)
                }
                .offset(y: -10)
                
                Text("API Gravity")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(OilColors.textMedium)
                    .offset(y: 15)
            }
            
            // Result Display
            VStack(spacing: 8) {
                Text("IDENTIFIED CRUDE: West Texas Intermediate (WTI)")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(OilColors.success)
                    .multilineTextAlignment(.center)
                
                Text("Match Confidence: 98.5%")
                    .font(.system(size: 14))
                    .foregroundColor(OilColors.textMedium)
            }
            .padding(.bottom, 20)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Wave Container (Animated Liquid)
    var waveContainer: some View {
        ZStack {
            // Wave 1
            WaveShape(offset: Angle(degrees: waveOffset1), percent: 0.5)
                .fill(OilColors.waveGradient.opacity(0.6))
                .frame(width: 160, height: 160)
                .clipShape(Circle())
            
            // Wave 2 (Slightly offset for depth)
            WaveShape(offset: Angle(degrees: waveOffset2), percent: 0.5)
                .fill(OilColors.waveGradient.opacity(0.8))
                .frame(width: 160, height: 160)
                .clipShape(Circle())
            
            // Particle layer (Visual effect for oil)
            ForEach(0..<10) { i in
                Circle()
                    .fill(OilColors.textLight.opacity(0.5))
                    .frame(width: CGFloat.random(in: 1...3), height: CGFloat.random(in: 1...3))
                    .offset(x: CGFloat.random(in: -50...50), y: CGFloat.random(in: -50...50))
                    .offset(y: particleFloat)
                    .rotationEffect(Angle(degrees: particleRotation))
            }
        }
        .frame(width: 160, height: 160)
    }
    
    // MARK: - Parameters Section
    var parametersSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Adjust Parameters (Manual Override)")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(OilColors.textLight)
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                parameterSlider(label: "API Gravity", value: $apiGravity, range: 10...50, step: 0.1, unit: "°")
                parameterSlider(label: "Sulfur Content", value: $sulfurContent, range: 0...5, step: 0.01, unit: "%")
                parameterSlider(label: "BS&W", value: $bswContent, range: 0...1, step: 0.01, unit: "%")
            }
            .background(OilColors.cardDark)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(OilColors.borderDark, lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    // MARK: - Similar Oils Section
    var similarOilsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Similar Oils & Alternatives")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(OilColors.textLight)
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                oilMatchRow(name: "Brent Crude", confidence: 92, status: "High Match")
                oilMatchRow(name: "Arab Light", confidence: 85, status: "Medium Match")
                oilMatchRow(name: "Mars Blend", confidence: 78, status: "Low Match")
            }
            .background(OilColors.cardDark)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(OilColors.borderDark, lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    // MARK: - Action Buttons
    var actionButtons: some View {
        VStack(spacing: 16) {
            Button(action: {}) {
                Text("Confirm Match & Generate Run Ticket")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.vertical, 14)
                    .frame(maxWidth: .infinity)
                    .background(OilColors.success)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            Button(action: {}) {
                Text("Request Manual Lab Analysis")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(OilColors.textMedium)
                    .padding(.vertical, 14)
                    .frame(maxWidth: .infinity)
                    .background(OilColors.cardDark)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(OilColors.borderDark, lineWidth: 1)
                    )
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
    }
    
    // MARK: - Helper Views
    
    func parameterSlider(label: String, value: Binding<Double>, range: ClosedRange<Double>, step: Double, unit: String) -> some View {
        VStack(spacing: 8) {
            HStack {
                Text(label)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(OilColors.textLight)
                
                Spacer()
                
                Text("\(value.wrappedValue, specifier: "%.2f")\(unit)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(OilColors.primary)
            }
            
            Slider(value: value, in: range, step: step)
                .tint(OilColors.mainGradient)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
    
    func oilMatchRow(name: String, confidence: Int, status: String) -> some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(OilColors.secondary)
                    .frame(width: 20)
                
                Text(name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(OilColors.textLight)
                
                Spacer()
                
                Text("\(confidence)%")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(OilColors.textLight)
                
                Text(status)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(confidence > 90 ? OilColors.success : confidence > 80 ? OilColors.warning : OilColors.danger)
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            
            Divider()
                .background(OilColors.borderDark)
                .padding(.leading, 16)
        }
    }
    
    // MARK: - Custom Tab Bar
    var customTabBar: some View {
        HStack {
            tabBarItem(icon: "house.fill", title: "Home", tag: 0)
            tabBarItem(icon: "map.fill", title: "Map", tag: 1)
            tabBarItem(icon: "briefcase.fill", title: "Jobs", tag: 2)
            tabBarItem(icon: "list.bullet.rectangle.fill", title: "Loads", tag: 3)
            tabBarItem(icon: "person.crop.circle.fill", title: "Account", tag: 4)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(
            ZStack {
                // Glassmorphism effect
                OilColors.glassDark
                
                // Top border line
                Rectangle()
                    .fill(OilColors.borderDark)
                    .frame(height: 1)
                    .offset(y: -20)
            }
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 20,
                    topTrailingRadius: 20
                )
            )
            .shadow(color: .black.opacity(0.3), radius: 10, y: -5)
            .ignoresSafeArea(edges: .bottom)
        )
    }
    
    func tabBarItem(icon: String, title: String, tag: Int) -> some View {
        Button(action: {
            selectedTab = tag
        }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                Text(title)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundColor(selectedTab == tag ? OilColors.primary : OilColors.textDim)
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Wave Shape for Visualization
struct WaveShape: Shape {
    var offset: Angle
    var percent: Double
    
    var animatableData: Double {
        get { offset.degrees }
        set { offset = Angle(degrees: newValue) }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        // Start from bottom left
        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        
        // Move to the calculated water level
        let waterLevel = (1 - percent) * rect.maxY
        path.addLine(to: CGPoint(x: rect.minX, y: waterLevel))
        
        // Draw the sine wave
        let waveHeight = rect.maxY / 20
        let yOffset = waterLevel
        
        for x in stride(from: rect.minX, through: rect.maxX, by: 1) {
            let relativeX = x / rect.width
            let sine = sin(relativeX * 2 * .pi + offset.radians)
            let y = yOffset + sine * waveHeight
            path.addLine(to: CGPoint(x: x, y: y))
        }
        
        // Close the path
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        
        return path
    }
}

// Preview
struct CatalystOilIdentifierView_Previews: PreviewProvider {
    static var previews: some View {
        CatalystOilIdentifierView()
    }
}
