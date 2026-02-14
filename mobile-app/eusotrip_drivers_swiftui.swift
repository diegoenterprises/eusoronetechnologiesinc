import SwiftUI

struct MyDriversView: View {
    @State private var selectedTab = 3 // My Loads tab selected
    @State private var selectedStatusTab = 0 // All Drivers selected
    
    // EXACT COLOR DEFINITIONS FROM HTML CSS
    struct DriverColors {
        static let primary = Color(red: 190/255, green: 1/255, blue: 255/255) // #BE01FF
        static let secondary = Color(red: 20/255, green: 115/255, blue: 255/255) // #1473FF
        static let textDark = Color(red: 51/255, green: 51/255, blue: 51/255) // #333333
        static let textLight = Color(red: 153/255, green: 153/255, blue: 153/255) // #999999
        static let cardBg = Color.white // white
        static let bgColor = Color(red: 247/255, green: 247/255, blue: 247/255) // #f7f7f7
        static let success = Color(red: 0/255, green: 196/255, blue: 140/255) // #00C48C
        static let warning = Color(red: 255/255, green: 167/255, blue: 38/255) // #FFA726
        static let error = Color(red: 244/255, green: 67/255, blue: 54/255) // #F44336
        static let info = Color(red: 33/255, green: 150/255, blue: 243/255) // #2196F3
        static let borderLight = Color.black.opacity(0.05) // rgba(0, 0, 0, 0.05)
        static let secondaryLight = Color(red: 20/255, green: 115/255, blue: 255/255).opacity(0.1) // rgba(20, 115, 255, 0.1)
        static let primaryLight = Color(red: 190/255, green: 1/255, blue: 255/255).opacity(0.1) // rgba(190, 1, 255, 0.1)
        static let navGray = Color(red: 136/255, green: 146/255, blue: 160/255) // #8892a0
        static let navBg = Color(red: 20/255, green: 25/255, blue: 40/255).opacity(0.75) // rgba(20, 25, 40, 0.75)
        static let homeIndicator = Color.white.opacity(0.2) // rgba(255, 255, 255, 0.2)
        static let starColor = Color(red: 255/255, green: 177/255, blue: 0/255) // #FFB100
        
        // Gradient definitions - EXACT from CSS
        static let mainGradient = LinearGradient(
            gradient: Gradient(colors: [secondary, primary]),
            startPoint: .leading,
            endPoint: .trailing
        )
        
        static let revenueGradient = LinearGradient(
            gradient: Gradient(colors: [success, secondary]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let expenseGradient = LinearGradient(
            gradient: Gradient(colors: [error, warning]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    let statusTabs = ["All Drivers", "Active", "Offline"]
    
    var body: some View {
        NavigationView {
            ZStack {
                // EXACT background color from CSS: #f7f7f7
                DriverColors.bgColor
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // Header Section
                        headerSection
                        
                        // Overview Stats Card
                        overviewStatsCard
                        
                        // Status Tabs
                        statusTabsSection
                        
                        // Driver Cards
                        driverCardsSection
                        
                        // Compensation Section
                        compensationSection
                        
                        // EUSOWALLET Section
                        walletSection
                        
                        // Action Button
                        actionButton
                        
                        Spacer(minLength: 100) // Space for tab bar
                    }
                }
                .ignoresSafeArea(edges: .top)
                
                // Add Driver Floating Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        addDriverButton
                            .padding(.trailing, 20)
                            .padding(.bottom, 100) // Above tab bar
                    }
                }
                
                // Custom Tab Bar
                VStack {
                    Spacer()
                    customTabBar
                }
            }
        }
        #if os(iOS)
        .navigationBarHidden(true)
        #endif
    }
    
    // MARK: - Header Section
    var headerSection: some View {
        ZStack {
            // EXACT gradient from CSS: linear-gradient(to right, #1473FF, #BE01FF)
            DriverColors.mainGradient
                .frame(height: 140) // EXACT height calculation from CSS padding
            
            VStack {
                HStack {
                    // Back button - EXACT from CSS
                    Button(action: {}) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                            .font(.system(size: 20, weight: .medium)) // Matching SVG size
                            .frame(width: 32, height: 32) // EXACT from CSS
                            .background(Color.white.opacity(0.1)) // EXACT from CSS
                            .clipShape(Circle())
                    }
                    
                    Spacer()
                    
                    // Header content - EXACT styling from CSS
                    VStack(spacing: 8) { // EXACT margin-bottom from CSS
                        Text("My Drivers")
                            .font(.system(size: 20, weight: .light)) // EXACT from CSS
                            .foregroundColor(.white)
                            .tracking(0.5) // EXACT letter-spacing from CSS
                        
                        Text("42 Active • 3 Offline • 95% Compliance")
                            .font(.system(size: 14)) // EXACT from CSS
                            .foregroundColor(.white.opacity(0.9)) // CSS: opacity: 0.9
                    }
                    
                    Spacer()
                    
                    Color.clear.frame(width: 32, height: 32)
                }
                .padding(.horizontal, 20) // EXACT from CSS
                .padding(.top, 50) // EXACT from CSS
                
                Spacer()
            }
        }
    }
    
    // MARK: - Overview Stats Card
    var overviewStatsCard: some View {
        HStack(spacing: 20) { // EXACT gap from CSS
            // Active stat
            VStack {
                Text("42")
                    .font(.system(size: 24, weight: .medium)) // EXACT from CSS
                    .foregroundColor(.clear)
                    .overlay(
                        DriverColors.mainGradient
                            .mask(
                                Text("42")
                                    .font(.system(size: 24, weight: .medium))
                            )
                    )
                    .padding(.bottom, 4) // EXACT margin-bottom from CSS
                
                Text("Active")
                    .font(.system(size: 12)) // EXACT from CSS
                    .foregroundColor(DriverColors.textLight)
            }
            
            // Safety Score stat
            VStack {
                Text("98%")
                    .font(.system(size: 24, weight: .medium)) // EXACT from CSS
                    .foregroundColor(.clear)
                    .overlay(
                        DriverColors.mainGradient
                            .mask(
                                Text("98%")
                                    .font(.system(size: 24, weight: .medium))
                            )
                    )
                    .padding(.bottom, 4) // EXACT margin-bottom from CSS
                
                Text("Safety Score")
                    .font(.system(size: 12)) // EXACT from CSS
                    .foregroundColor(DriverColors.textLight)
            }
            
            // Avg Rating stat
            VStack {
                Text("4.8")
                    .font(.system(size: 24, weight: .medium)) // EXACT from CSS
                    .foregroundColor(.clear)
                    .overlay(
                        DriverColors.mainGradient
                            .mask(
                                Text("4.8")
                                    .font(.system(size: 24, weight: .medium))
                            )
                    )
                    .padding(.bottom, 4) // EXACT margin-bottom from CSS
                
                Text("Avg Rating")
                    .font(.system(size: 12)) // EXACT from CSS
                    .foregroundColor(DriverColors.textLight)
            }
        }
        .padding(24) // EXACT from CSS
        .background(DriverColors.cardBg)
        .clipShape(RoundedRectangle(cornerRadius: 16)) // EXACT from CSS
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2) // CSS: 0 2px 10px rgba(0, 0, 0, 0.05)
        .padding(.horizontal, 20) // EXACT margin from CSS
        .padding(.top, -20) // EXACT negative margin from CSS
        .padding(.bottom, 20) // EXACT margin from CSS
    }
    
    // MARK: - Status Tabs Section
    var statusTabsSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                ForEach(0..<statusTabs.count, id: \.self) { index in
                    Button(action: {
                        selectedStatusTab = index
                    }) {
                        VStack(spacing: 0) {
                            Text(statusTabs[index])
                                .font(.system(size: 14)) // EXACT from CSS
                                .foregroundColor(selectedStatusTab == index ? DriverColors.primary : DriverColors.textLight)
                                .padding(.vertical, 12) // EXACT from CSS
                            
                            Rectangle()
                                .fill(selectedStatusTab == index ? DriverColors.mainGradient : Color.clear)
                                .frame(height: 2) // EXACT from CSS
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .background(
                Rectangle()
                    .fill(DriverColors.borderLight)
                    .frame(height: 1), // CSS: border-bottom: 1px solid
                alignment: .bottom
            )
        }
        .background(DriverColors.cardBg)
    }
    
    // MARK: - Driver Cards Section (Placeholder)
    var driverCardsSection: some View {
        VStack(spacing: 16) {
            DriverCard(name: "John 'Tanker' Doe", status: "Active", rating: 4.9, compliance: 98, loadStatus: "En Route to Pick-up", truck: "Kenworth T680", isOnline: true)
            DriverCard(name: "Jane 'Hazmat' Smith", status: "Active", rating: 4.7, compliance: 92, loadStatus: "Loading at Terminal B", truck: "Peterbilt 389", isOnline: true)
            DriverCard(name: "Mike 'Diesel' Johnson", status: "Offline", rating: 4.5, compliance: 85, loadStatus: "Off Duty - Home", truck: "Freightliner Cascadia", isOnline: false)
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    // MARK: - Driver Card Component
    struct DriverCard: View {
        let name: String
        let status: String
        let rating: Double
        let compliance: Int
        let loadStatus: String
        let truck: String
        let isOnline: Bool
        
        var body: some View {
            VStack(spacing: 0) {
                // Header
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(name)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(DriverColors.textDark)
                        
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 12))
                                .foregroundColor(DriverColors.starColor)
                            Text("\(rating, specifier: "%.1f") Rating")
                                .font(.system(size: 12))
                                .foregroundColor(DriverColors.textLight)
                        }
                    }
                    
                    Spacer()
                    
                    // Status Badge
                    Text(status)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(isOnline ? DriverColors.success : DriverColors.error)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(isOnline ? DriverColors.success.opacity(0.1) : DriverColors.error.opacity(0.1))
                        .clipShape(Capsule())
                }
                .padding(.bottom, 16)
                
                Divider()
                    .padding(.bottom, 16)
                
                // Details Grid
                VStack(spacing: 12) {
                    detailRow(icon: "truck.box.fill", label: "Truck", value: truck)
                    detailRow(icon: "doc.text.fill", label: "Compliance", value: "\(compliance)%")
                    detailRow(icon: "mappin.and.ellipse", label: "Load Status", value: loadStatus)
                }
                .padding(.horizontal, 4)
                
                // Action Buttons
                HStack(spacing: 12) {
                    actionButton(title: "View Profile", icon: "person.text.rectangle", color: DriverColors.secondary)
                    actionButton(title: "Track Live", icon: "location.fill", color: DriverColors.primary)
                }
                .padding(.top, 20)
            }
            .padding(20)
            .background(DriverColors.cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        }
        
        func detailRow(icon: String, label: String, value: String) -> some View {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(DriverColors.secondary)
                    .frame(width: 20)
                
                Text(label)
                    .font(.system(size: 14))
                    .foregroundColor(DriverColors.textLight)
                
                Spacer()
                
                Text(value)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DriverColors.textDark)
            }
        }
        
        func actionButton(title: String, icon: String, color: Color) -> some View {
            Button(action: {}) {
                HStack {
                    Image(systemName: icon)
                    Text(title)
                        .font(.system(size: 14, weight: .medium))
                }
                .foregroundColor(.white)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(color)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
    }
    
    // MARK: - Compensation Section
    var compensationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Driver Compensation Overview")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(DriverColors.textDark)
            
            // Compensation Card
            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading) {
                        Text("Total Payout (This Week)")
                            .font(.system(size: 14))
                            .foregroundColor(DriverColors.textLight)
                        Text("$12,450.00")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(DriverColors.textDark)
                    }
                    Spacer()
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 30))
                        .foregroundColor(DriverColors.success)
                }
                
                Divider()
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("Pending Commissions")
                            .font(.system(size: 12))
                            .foregroundColor(DriverColors.textLight)
                        Text("$2,100.00")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(DriverColors.warning)
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text("Total Loads")
                            .font(.system(size: 12))
                            .foregroundColor(DriverColors.textLight)
                        Text("18")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(DriverColors.textDark)
                    }
                }
            }
            .padding(20)
            .background(DriverColors.cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
            
            // Action Button
            Button(action: {}) {
                Text("View All Commission Statements")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(DriverColors.mainGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 30)
    }
    
    // MARK: - EUSOWALLET Section
    var walletSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("EusoWallet Quick Access")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(DriverColors.textDark)
            
            // Wallet Card
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Current Balance")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                    Spacer()
                    Image(systemName: "creditcard.fill")
                        .foregroundColor(.white)
                }
                
                Text("$8,350.00")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.white)
                
                HStack {
                    VStack(alignment: .leading) {
                        Text("Last Transaction")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.7))
                        Text("Load 478 Payout")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Text("+\\$950.00")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(DriverColors.success)
                }
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(DriverColors.navBg) // Using a dark color for the wallet card
            )
            .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
            
            // Instant Pay Button
            Button(action: {}) {
                Text("Request Instant Pay")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DriverColors.navBg)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .shadow(color: .black.opacity(0.1), radius: 5, y: 2)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 30)
    }
    
    // MARK: - Action Button
    var actionButton: some View {
        Button(action: {}) {
            Text("Send Broadcast Message to All Active Drivers")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .background(DriverColors.error)
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding(.horizontal, 20)
        .padding(.top, 30)
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
                DriverColors.navBg
                
                // Top border line
                Rectangle()
                    .fill(DriverColors.homeIndicator)
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
            .foregroundColor(selectedTab == tag ? DriverColors.primary : DriverColors.navGray)
            .frame(maxWidth: .infinity)
        }
    }
}

// Preview
struct MyDriversView_Previews: PreviewProvider {
    static var previews: some View {
        MyDriversView()
    }
}
