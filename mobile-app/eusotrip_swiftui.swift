import SwiftUI

struct CompanyDetailsView: View {
    @State private var selectedTab = 4
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // Header Section
                        headerSection
                        
                        // Company Info Card
                        companyInfoCard
                        
                        // Registration Information
                        registrationSection
                        
                        // Safety & Compliance
                        safetySection
                        
                        // Fleet Information
                        fleetSection
                        
                        // Contact Information
                        contactSection
                        
                        // Terminal Locations
                        terminalsSection
                        
                        // Service Areas
                        serviceAreasSection
                        
                        // Action Button
                        actionButton
                        
                        Spacer(minLength: 100) // Space for tab bar
                    }
                }
                .ignoresSafeArea(edges: .top)
                
                // Custom Tab Bar
                VStack {
                    Spacer()
                    customTabBar
                }
            }
        }
        .navigationBarHidden(true)
    }
    
    // MARK: - Header Section
    var headerSection: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color(red: 0.08, green: 0.45, blue: 1.0), Color(red: 0.75, green: 0.0, blue: 1.0)]),
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 140)
            
            VStack {
                HStack {
                    Button(action: {}) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                            .font(.system(size: 18, weight: .medium))
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                            .blur(radius: 0.5)
                    }
                    
                    Spacer()
                    
                    Text("Company Details")
                        .font(.system(size: 20, weight: .light))
                        .foregroundColor(.white)
                        .letterSpacing(0.5)
                    
                    Spacer()
                    
                    Color.clear.frame(width: 32, height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 50)
                
                Spacer()
            }
        }
    }
    
    // MARK: - Company Info Card
    var companyInfoCard: some View {
        VStack {
            HStack {
                Spacer()
                
                Button("Edit") {
                    // Edit action
                }
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(Color(red: 0.08, green: 0.45, blue: 1.0))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(radius: 2)
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)
            
            // Company Logo
            RoundedRectangle(cornerRadius: 16)
                .fill(LinearGradient(
                    gradient: Gradient(colors: [Color(red: 0.08, green: 0.45, blue: 1.0), Color(red: 0.75, green: 0.0, blue: 1.0)]),
                    startPoint: .leading,
                    endPoint: .trailing
                ))
                .frame(width: 120, height: 80)
                .overlay(
                    Image(systemName: "truck.box")
                        .font(.system(size: 40))
                        .foregroundColor(.white)
                )
            
            // Company Name
            Text("DIEGOVILLE TRANSPORTATION")
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(.primary)
                .padding(.top, 16)
                .letterSpacing(1)
            
            Text("Hazmat & Petroleum Carrier")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .padding(.top, 8)
            
            // Badges
            HStack(spacing: 12) {
                ForEach(["Verified Carrier", "HazMat Certified", "Premium Partner"], id: \.self) { badge in
                    Text(badge)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: [Color(red: 0.08, green: 0.45, blue: 1.0), Color(red: 0.75, green: 0.0, blue: 1.0)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                }
            }
            .padding(.top, 16)
            .padding(.bottom, 24)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(radius: 5)
        .padding(.horizontal, 20)
        .padding(.top, -20)
    }
    
    // MARK: - Registration Section
    var registrationSection: some View {
        sectionCard(title: "Registration Information") {
            VStack(spacing: 0) {
                infoRow("MC Number", "MC-947563")
                infoRow("DOT Number", "DOT-3174852")
                infoRow("SCAC Code", "DGVL")
                infoRow("Tax ID", "47-8291650")
                
                HStack {
                    Text("Operating Authority")
                        .font(.system(size: 14))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text("Active")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.8))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
            }
        }
    }
    
    // MARK: - Safety Section
    var safetySection: some View {
        sectionCard(title: "Safety & Compliance") {
            VStack(spacing: 0) {
                // Safety Rating with Progress Bar
                HStack {
                    Text("Safety Rating")
                        .font(.system(size: 14))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    HStack(spacing: 12) {
                        ProgressView(value: 0.96)
                            .frame(width: 60, height: 6)
                            .tint(LinearGradient(
                                gradient: Gradient(colors: [Color(red: 0.08, green: 0.45, blue: 1.0), Color(red: 0.75, green: 0.0, blue: 1.0)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                        
                        Text("96%")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.primary)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                
                Divider()
                
                infoRowWithBadge("HazMat Registration", "Valid until Jan 2026", .green)
                infoRow("Insurance Coverage", "$5M Liability")
                infoRow("Out of Service Rate", "0.8%")
                infoRow("Crash Rate", "0.0 per million miles", isLast: true)
            }
        }
    }
    
    // MARK: - Fleet Section
    var fleetSection: some View {
        sectionCard(title: "Fleet Information") {
            VStack(spacing: 20) {
                // Fleet Stats Grid
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 16) {
                    fleetStat("47", "Total Vehicles")
                    fleetStat("42", "Active Drivers")
                    fleetStat("38", "Tanker Units")
                    fleetStat("9", "Dry Van Units")
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 20)
                
                Divider()
                
                VStack(spacing: 0) {
                    infoRow("Average Fleet Age", "3.2 years")
                    
                    HStack {
                        Text("ELD Compliance")
                            .font(.system(size: 14))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text("100%")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.green.opacity(0.8))
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
            }
        }
    }
    
    // MARK: - Contact Section
    var contactSection: some View {
        sectionCard(title: "Contact Information") {
            VStack(spacing: 0) {
                infoRow("Primary Contact", "Diego Usoro")
                infoRow("Phone", "(800) 555-1234")
                infoRow("Email", "support@diegoenterprises.com")
                infoRow("Address", "123 Eusotrip Way, Dallas, TX 75201", isLast: true)
            }
        }
    }
    
    // MARK: - Terminal Locations
    var terminalsSection: some View {
        sectionCard(title: "Terminal Locations (3)") {
            VStack(spacing: 0) {
                terminalRow("Dallas, TX (HQ)", "Active", isLast: false)
                terminalRow("Houston, TX", "Active", isLast: false)
                terminalRow("Baton Rouge, LA", "Maintenance", isLast: true)
            }
        }
    }
    
    // MARK: - Service Areas
    var serviceAreasSection: some View {
        sectionCard(title: "Primary Service Areas") {
            VStack(spacing: 0) {
                infoRow("Regions", "South Central, Southeast, Midwest")
                infoRow("States", "TX, LA, OK, AR, MS, AL, GA, FL", isLast: true)
            }
        }
    }
    
    // MARK: - Action Button
    var actionButton: some View {
        Button(action: {}) {
            Text("Request Carrier Audit")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [Color.red.opacity(0.8), Color.orange.opacity(0.8)]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
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
                Color.white
                
                // Top border line
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 1)
                    .offset(y: -20)
            }
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 20,
                    topTrailingRadius: 20
                )
            )
            .shadow(color: .black.opacity(0.1), radius: 10, y: -5)
            .ignoresSafeArea(edges: .bottom)
        )
    }
    
    // MARK: - Helper Views
    
    func sectionCard<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.secondary)
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 10)
            
            VStack(spacing: 0) {
                content()
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(radius: 2)
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
    }
    
    func infoRow(_ label: String, _ value: String, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(label)
                    .font(.system(size: 14))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(value)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            
            if !isLast {
                Divider()
                    .padding(.leading, 16)
            }
        }
    }
    
    func infoRowWithBadge(_ label: String, _ value: String, _ color: Color, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(label)
                    .font(.system(size: 14))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(value)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(color.opacity(0.8))
                    .clipShape(RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            
            if !isLast {
                Divider()
                    .padding(.leading, 16)
            }
        }
    }
    
    func fleetStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(Color(red: 0.08, green: 0.45, blue: 1.0))
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    func terminalRow(_ name: String, _ status: String, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.red)
                
                Text(name)
                    .font(.system(size: 14))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(status)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(status == "Active" ? Color.green.opacity(0.8) : Color.orange.opacity(0.8))
                    .clipShape(RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            
            if !isLast {
                Divider()
                    .padding(.leading, 16)
            }
        }
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
            .foregroundColor(selectedTab == tag ? Color(red: 0.75, green: 0.0, blue: 1.0) : Color.gray)
            .frame(maxWidth: .infinity)
        }
    }
}

// Custom extension for letter spacing
extension Text {
    func letterSpacing(_ spacing: CGFloat) -> Text {
        if #available(iOS 16.0, *) {
            return self.kerning(spacing)
        } else {
            return self
        }
    }
}

// Preview
struct CompanyDetailsView_Previews: PreviewProvider {
    static var previews: some View {
        CompanyDetailsView()
    }
}
