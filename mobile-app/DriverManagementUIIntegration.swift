import SwiftUI
import Foundation
import MapKit

// MARK: - Driver Management UI Integration for EusoTrip
struct DriverManagementView: View {
    @StateObject private var viewModel = DriverManagementViewModel()
    @State private var selectedTab = 3 // Loads tab
    @State private var showAddDriver = false
    @State private var showDriverDetail = false
    @State private var selectedDriver: DriverProfile?
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 32.7767, longitude: -96.7970),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 12/255, green: 12/255, blue: 15/255)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        headerSection
                        driverStatsCard
                        filterSection
                        driverListSection
                        performanceMetricsSection
                        actionButtons
                        
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
        .navigationBarHidden(true)
        .onAppear {
            viewModel.loadDrivers()
        }
        .sheet(isPresented: $showAddDriver) {
            AddDriverSheet(isPresented: $showAddDriver, viewModel: viewModel)
        }
    }
    
    // MARK: - Header Section
    var headerSection: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 20/255, green: 115/255, blue: 255/255),
                    Color(red: 190/255, green: 1/255, blue: 255/255)
                ]),
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 140)
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 0,
                    bottomLeadingRadius: 24,
                    bottomTrailingRadius: 24,
                    topTrailingRadius: 0
                )
            )
            
            VStack {
                HStack {
                    Button(action: {}) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                            .font(.system(size: 18, weight: .medium))
                    }
                    
                    Spacer()
                    
                    VStack(spacing: 4) {
                        Text("Driver Management")
                            .font(.system(size: 20, weight: .light))
                            .foregroundColor(.white)
                        
                        Text("\(viewModel.drivers.count) Active Drivers")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    Button(action: { showAddDriver = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 24))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 50)
                
                Spacer()
            }
        }
    }
    
    // MARK: - Driver Stats Card
    var driverStatsCard: some View {
        HStack(spacing: 20) {
            VStack(alignment: .center, spacing: 8) {
                Text("\(viewModel.activeDriverCount)")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(red: 0/255, green: 196/255, blue: 140/255))
                
                Text("Active")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
            }
            
            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.1))
            
            VStack(alignment: .center, spacing: 8) {
                Text(String(format: "%.1f", viewModel.averageSafetyScore))
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(red: 190/255, green: 1/255, blue: 255/255))
                
                Text("Avg Safety")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
            }
            
            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.1))
            
            VStack(alignment: .center, spacing: 8) {
                Text(String(format: "%.0f%%", viewModel.averageComplianceRate * 100))
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(red: 20/255, green: 115/255, blue: 255/255))
                
                Text("Compliance")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
            }
        }
        .padding(24)
        .background(Color(red: 25/255, green: 25/255, blue: 30/255))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.3), radius: 10, y: 5)
        .padding(.horizontal, 20)
        .padding(.top, -20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Filter Section
    var filterSection: some View {
        HStack(spacing: 12) {
            ForEach(["All", "Active", "Inactive", "Hazmat"], id: \.self) { filter in
                Button(action: {
                    viewModel.selectedFilter = filter
                }) {
                    Text(filter)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(viewModel.selectedFilter == filter ? .white : Color(red: 160/255, green: 160/255, blue: 170/255))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(viewModel.selectedFilter == filter ? LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 20/255, green: 115/255, blue: 255/255),
                                Color(red: 190/255, green: 1/255, blue: 255/255)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ) : LinearGradient(gradient: Gradient(colors: [Color(red: 25/255, green: 25/255, blue: 30/255)]), startPoint: .leading, endPoint: .trailing))
                        .clipShape(Capsule())
                }
            }
            
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
    
    // MARK: - Driver List Section
    var driverListSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Driver Fleet")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            VStack(spacing: 12) {
                ForEach(viewModel.filteredDrivers, id: \.id) { driver in
                    driverCard(driver)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    func driverCard(_ driver: DriverProfile) -> some View {
        VStack(spacing: 12) {
            HStack {
                // Driver Avatar
                Circle()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [
                            Color(red: 20/255, green: 115/255, blue: 255/255),
                            Color(red: 190/255, green: 1/255, blue: 255/255)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 50, height: 50)
                    .overlay(
                        Text(String(driver.name.prefix(1)))
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(driver.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                    
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 255/255, green: 177/255, blue: 0/255))
                        
                        Text("\(driver.safetyScore, specifier: "%.1f") • \(driver.loadsCompleted) loads")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(driver.status.rawValue)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(driver.status == .active ? Color(red: 0/255, green: 196/255, blue: 140/255) : Color(red: 160/255, green: 160/255, blue: 170/255))
                        .clipShape(Capsule())
                    
                    if driver.hasHazmatCert {
                        Text("HazMat")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(red: 255/255, green: 167/255, blue: 38/255))
                            .clipShape(Capsule())
                    }
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.08))
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Compliance")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                    
                    ProgressView(value: driver.complianceRate)
                        .tint(LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 20/255, green: 115/255, blue: 255/255),
                                Color(red: 190/255, green: 1/255, blue: 255/255)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(height: 4)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Earnings")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                    
                    Text("$\(driver.monthlyEarnings, specifier: "%.0f")")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 0/255, green: 196/255, blue: 140/255))
                }
            }
            
            HStack(spacing: 8) {
                Button(action: {}) {
                    Text("View Profile")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 20/255, green: 115/255, blue: 255/255))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                
                Button(action: {}) {
                    Text("Assign Load")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 190/255, green: 1/255, blue: 255/255))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding(16)
        .background(Color(red: 25/255, green: 25/255, blue: 30/255))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
    
    // MARK: - Performance Metrics Section
    var performanceMetricsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Fleet Performance Metrics")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            VStack(spacing: 12) {
                metricRow(label: "On-Time Delivery Rate", value: String(format: "%.1f%%", viewModel.onTimeDeliveryRate * 100), color: Color(red: 0/255, green: 196/255, blue: 140/255))
                metricRow(label: "Safety Incidents (30 days)", value: "\(viewModel.safetyIncidents)", color: Color(red: 244/255, green: 67/255, blue: 54/255))
                metricRow(label: "Average Load Value", value: "$\(viewModel.averageLoadValue, specifier: "%.0f")", color: Color(red: 190/255, green: 1/255, blue: 255/255))
                metricRow(label: "Total Fleet Earnings", value: "$\(viewModel.totalFleetEarnings, specifier: "%.0f")", color: Color(red: 20/255, green: 115/255, blue: 255/255))
            }
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    func metricRow(label: String, value: String, color: Color) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
            
            Spacer()
            
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
        }
        .padding(12)
        .background(Color(red: 25/255, green: 25/255, blue: 30/255))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
    
    // MARK: - Action Buttons
    var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: {}) {
                Text("Generate Fleet Report")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 20/255, green: 115/255, blue: 255/255),
                                Color(red: 190/255, green: 1/255, blue: 255/255)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            
            Button(action: {}) {
                Text("Schedule Training")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 25/255, green: 25/255, blue: 30/255))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
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
                Color(red: 30/255, green: 30/255, blue: 38/255)
                Rectangle()
                    .fill(Color.white.opacity(0.08))
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
            .foregroundColor(selectedTab == tag ? Color(red: 190/255, green: 1/255, blue: 255/255) : Color(red: 100/255, green: 100/255, blue: 110/255))
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Add Driver Sheet
struct AddDriverSheet: View {
    @Binding var isPresented: Bool
    @ObservedObject var viewModel: DriverManagementViewModel
    @State private var driverName = ""
    @State private var driverPhone = ""
    @State private var hasHazmatCert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Driver Information")) {
                    TextField("Driver Name", text: $driverName)
                    TextField("Phone Number", text: $driverPhone)
                    Toggle("HazMat Certified", isOn: $hasHazmatCert)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        viewModel.addDriver(name: driverName, phone: driverPhone, hasHazmatCert: hasHazmatCert)
                        isPresented = false
                    }
                }
            }
        }
    }
}

// MARK: - View Model
class DriverManagementViewModel: ObservableObject {
    @Published var drivers: [DriverProfile] = []
    @Published var selectedFilter = "All"
    @Published var activeDriverCount = 0
    @Published var averageSafetyScore: Double = 0.0
    @Published var averageComplianceRate: Double = 0.0
    @Published var onTimeDeliveryRate: Double = 0.0
    @Published var safetyIncidents = 0
    @Published var averageLoadValue: Double = 0.0
    @Published var totalFleetEarnings: Double = 0.0
    
    var filteredDrivers: [DriverProfile] {
        switch selectedFilter {
        case "Active":
            return drivers.filter { $0.status == .active }
        case "Inactive":
            return drivers.filter { $0.status == .inactive }
        case "Hazmat":
            return drivers.filter { $0.hasHazmatCert }
        default:
            return drivers
        }
    }
    
    func loadDrivers() {
        // Mock driver data
        drivers = [
            DriverProfile(id: "1", name: "John 'Tanker' Doe", status: .active, safetyScore: 4.9, loadsCompleted: 156, complianceRate: 0.98, monthlyEarnings: 8500, hasHazmatCert: true),
            DriverProfile(id: "2", name: "Jane 'Hazmat' Smith", status: .active, safetyScore: 4.7, loadsCompleted: 142, complianceRate: 0.92, monthlyEarnings: 7200, hasHazmatCert: true),
            DriverProfile(id: "3", name: "Mike 'Diesel' Johnson", status: .active, safetyScore: 4.5, loadsCompleted: 98, complianceRate: 0.85, monthlyEarnings: 6800, hasHazmatCert: false),
            DriverProfile(id: "4", name: "Sarah 'Express' Williams", status: .inactive, safetyScore: 4.8, loadsCompleted: 201, complianceRate: 0.96, monthlyEarnings: 9100, hasHazmatCert: true)
        ]
        
        updateMetrics()
    }
    
    func addDriver(name: String, phone: String, hasHazmatCert: Bool) {
        let newDriver = DriverProfile(
            id: UUID().uuidString,
            name: name,
            status: .active,
            safetyScore: 4.5,
            loadsCompleted: 0,
            complianceRate: 1.0,
            monthlyEarnings: 0,
            hasHazmatCert: hasHazmatCert
        )
        drivers.append(newDriver)
        updateMetrics()
    }
    
    private func updateMetrics() {
        activeDriverCount = drivers.filter { $0.status == .active }.count
        averageSafetyScore = drivers.map { $0.safetyScore }.reduce(0, +) / Double(drivers.count)
        averageComplianceRate = drivers.map { $0.complianceRate }.reduce(0, +) / Double(drivers.count)
        onTimeDeliveryRate = 0.94
        safetyIncidents = 2
        averageLoadValue = 1250.0
        totalFleetEarnings = drivers.map { $0.monthlyEarnings }.reduce(0, +)
    }
}

// MARK: - Data Models
struct DriverProfile: Identifiable {
    let id: String
    let name: String
    let status: DriverStatus
    let safetyScore: Double
    let loadsCompleted: Int
    let complianceRate: Double
    let monthlyEarnings: Double
    let hasHazmatCert: Bool
    
    enum DriverStatus: String {
        case active = "Active"
        case inactive = "Inactive"
    }
}

// Preview
struct DriverManagementView_Previews: PreviewProvider {
    static var previews: some View {
        DriverManagementView()
    }
}
