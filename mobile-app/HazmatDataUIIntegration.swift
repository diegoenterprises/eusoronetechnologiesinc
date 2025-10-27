import SwiftUI
import Foundation

// MARK: - Hazmat Data UI Integration for EusoTrip
struct HazmatDataUIView: View {
    @StateObject private var viewModel = HazmatDataViewModel()
    @State private var selectedTab = 1 // Jobs tab
    @State private var showDetailView = false
    @State private var selectedMaterial: HazmatMaterial?
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 12/255, green: 12/255, blue: 15/255)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        headerSection
                        hazmatStatusCard
                        regulatoryComplianceSection
                        hazmatMaterialsSection
                        emergencyContactsSection
                        documentationSection
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
            viewModel.loadHazmatData()
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
                        Text("HAZMAT Management")
                            .font(.system(size: 20, weight: .light))
                            .foregroundColor(.white)
                        
                        Text("Emergency Response Guidebook Integrated")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    Button(action: {}) {
                        Image(systemName: "bell.fill")
                            .foregroundColor(.white)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 50)
                
                Spacer()
            }
        }
    }
    
    // MARK: - Hazmat Status Card
    var hazmatStatusCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Hazmat Status")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                    
                    Text(viewModel.hazmatStatus.rawValue)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(viewModel.hazmatStatusColor)
                }
                
                Spacer()
                
                Image(systemName: viewModel.hazmatStatusIcon)
                    .font(.system(size: 28))
                    .foregroundColor(viewModel.hazmatStatusColor)
            }
            
            Divider()
                .background(Color.white.opacity(0.08))
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Compliance Level")
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                    
                    ProgressView(value: viewModel.complianceLevel)
                        .tint(LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 20/255, green: 115/255, blue: 255/255),
                                Color(red: 190/255, green: 1/255, blue: 255/255)
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(height: 6)
                    
                    Text("\(Int(viewModel.complianceLevel * 100))% Compliant")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color(red: 0/255, green: 196/255, blue: 140/255))
                }
                
                Spacer()
            }
        }
        .padding(20)
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
    
    // MARK: - Regulatory Compliance Section
    var regulatoryComplianceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Regulatory Compliance")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                ForEach(viewModel.complianceItems, id: \.id) { item in
                    complianceItemRow(item)
                }
            }
            .background(Color(red: 25/255, green: 25/255, blue: 30/255))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    func complianceItemRow(_ item: ComplianceItem) -> some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                    
                    Text(item.description)
                        .font(.system(size: 12))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(item.status)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(item.statusColor)
                        .clipShape(Capsule())
                    
                    Text(item.expiryDate)
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            
            Divider()
                .background(Color.white.opacity(0.08))
                .padding(.leading, 16)
        }
    }
    
    // MARK: - Hazmat Materials Section
    var hazmatMaterialsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Hazmat Materials Database")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.hazmatMaterials, id: \.id) { material in
                        hazmatMaterialCard(material)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.bottom, 24)
    }
    
    func hazmatMaterialCard(_ material: HazmatMaterial) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(material.classCode)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(material.classColor)
                    .clipShape(Capsule())
                
                Spacer()
            }
            
            Text(material.name)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
            
            Text(material.hazards)
                .font(.system(size: 11))
                .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                .lineLimit(2)
            
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 10))
                    .foregroundColor(material.hazardLevel == .high ? Color(red: 244/255, green: 67/255, blue: 54/255) : Color(red: 255/255, green: 167/255, blue: 38/255))
                
                Text(material.hazardLevel.rawValue.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(material.hazardLevel == .high ? Color(red: 244/255, green: 67/255, blue: 54/255) : Color(red: 255/255, green: 167/255, blue: 38/255))
            }
        }
        .padding(12)
        .background(Color(red: 25/255, green: 25/255, blue: 30/255))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .frame(width: 160)
    }
    
    // MARK: - Emergency Contacts Section
    var emergencyContactsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Emergency Contacts & Resources")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            VStack(spacing: 12) {
                ForEach(viewModel.emergencyContacts, id: \.id) { contact in
                    emergencyContactRow(contact)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    func emergencyContactRow(_ contact: EmergencyContact) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(contact.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                
                Text(contact.phone)
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "phone.fill")
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color(red: 20/255, green: 115/255, blue: 255/255))
                    .clipShape(Circle())
            }
        }
        .padding(12)
        .background(Color(red: 25/255, green: 25/255, blue: 30/255))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
    
    // MARK: - Documentation Section
    var documentationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Required Documentation")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                ForEach(viewModel.requiredDocuments, id: \.id) { doc in
                    documentRow(doc)
                }
            }
            .background(Color(red: 25/255, green: 25/255, blue: 30/255))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
    
    func documentRow(_ doc: RequiredDocument) -> some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "doc.fill")
                    .foregroundColor(Color(red: 190/255, green: 1/255, blue: 255/255))
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(doc.name)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color(red: 240/255, green: 240/255, blue: 245/255))
                    
                    Text("Expires: \(doc.expiryDate)")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 160/255, green: 160/255, blue: 170/255))
                }
                
                Spacer()
                
                Image(systemName: doc.isVerified ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(doc.isVerified ? Color(red: 0/255, green: 196/255, blue: 140/255) : Color(red: 244/255, green: 67/255, blue: 54/255))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            
            Divider()
                .background(Color.white.opacity(0.08))
                .padding(.leading, 16)
        }
    }
    
    // MARK: - Action Buttons
    var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: {}) {
                Text("View Full ERG Guidebook")
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
                Text("Report Hazmat Incident")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(red: 244/255, green: 67/255, blue: 54/255))
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color(red: 244/255, green: 67/255, blue: 54/255).opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(red: 244/255, green: 67/255, blue: 54/255), lineWidth: 1)
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

// MARK: - View Model
class HazmatDataViewModel: ObservableObject {
    @Published var hazmatStatus: HazmatStatus = .compliant
    @Published var complianceLevel: Double = 0.95
    @Published var complianceItems: [ComplianceItem] = []
    @Published var hazmatMaterials: [HazmatMaterial] = []
    @Published var emergencyContacts: [EmergencyContact] = []
    @Published var requiredDocuments: [RequiredDocument] = []
    
    var hazmatStatusColor: Color {
        switch hazmatStatus {
        case .compliant:
            return Color(red: 0/255, green: 196/255, blue: 140/255)
        case .warning:
            return Color(red: 255/255, green: 167/255, blue: 38/255)
        case .alert:
            return Color(red: 244/255, green: 67/255, blue: 54/255)
        }
    }
    
    var hazmatStatusIcon: String {
        switch hazmatStatus {
        case .compliant:
            return "checkmark.circle.fill"
        case .warning:
            return "exclamationmark.circle.fill"
        case .alert:
            return "xmark.circle.fill"
        }
    }
    
    func loadHazmatData() {
        // Load compliance items
        complianceItems = [
            ComplianceItem(id: "1", title: "DOT Hazmat Registration", description: "Federal hazmat transport certification", status: "Active", expiryDate: "Expires: Jan 2026", statusColor: Color(red: 0/255, green: 196/255, blue: 140/255)),
            ComplianceItem(id: "2", title: "HAZWOPER Training", description: "Hazardous waste operations training", status: "Active", expiryDate: "Expires: Jun 2025", statusColor: Color(red: 0/255, green: 196/255, blue: 140/255)),
            ComplianceItem(id: "3", title: "Vehicle Inspection", description: "Annual DOT vehicle safety inspection", status: "Pending", expiryDate: "Due: Dec 2024", statusColor: Color(red: 255/255, green: 167/255, blue: 38/255))
        ]
        
        // Load hazmat materials
        hazmatMaterials = [
            HazmatMaterial(id: "1", name: "Crude Oil", classCode: "3", hazards: "Flammable liquid", hazardLevel: .high, classColor: Color.red),
            HazmatMaterial(id: "2", name: "Diesel Fuel", classCode: "3", hazards: "Flammable liquid", hazardLevel: .high, classColor: Color.orange),
            HazmatMaterial(id: "3", name: "Gasoline", classCode: "3", hazards: "Flammable liquid", hazardLevel: .high, classColor: Color.red),
            HazmatMaterial(id: "4", name: "Propane", classCode: "2", hazards: "Compressed gas", hazardLevel: .medium, classColor: Color.yellow)
        ]
        
        // Load emergency contacts
        emergencyContacts = [
            EmergencyContact(id: "1", name: "CHEMTREC (24/7)", phone: "1-800-424-9300"),
            EmergencyContact(id: "2", name: "DOT Hazmat Hotline", phone: "1-202-366-4488"),
            EmergencyContact(id: "3", name: "Local Fire Department", phone: "911")
        ]
        
        // Load required documents
        requiredDocuments = [
            RequiredDocument(id: "1", name: "Hazmat Endorsement (HE)", expiryDate: "Jan 2026", isVerified: true),
            RequiredDocument(id: "2", name: "Medical Certificate", expiryDate: "Jun 2025", isVerified: true),
            RequiredDocument(id: "3", name: "HAZWOPER Certification", expiryDate: "Dec 2024", isVerified: false)
        ]
    }
}

// MARK: - Data Models
enum HazmatStatus: String {
    case compliant = "Compliant"
    case warning = "Warning"
    case alert = "Alert"
}

struct ComplianceItem: Identifiable {
    let id: String
    let title: String
    let description: String
    let status: String
    let expiryDate: String
    let statusColor: Color
}

struct HazmatMaterial: Identifiable {
    let id: String
    let name: String
    let classCode: String
    let hazards: String
    let hazardLevel: HazardLevel
    let classColor: Color
    
    enum HazardLevel: String {
        case low, medium, high
    }
}

struct EmergencyContact: Identifiable {
    let id: String
    let name: String
    let phone: String
}

struct RequiredDocument: Identifiable {
    let id: String
    let name: String
    let expiryDate: String
    let isVerified: Bool
}

// Preview
struct HazmatDataUIView_Previews: PreviewProvider {
    static var previews: some View {
        HazmatDataUIView()
    }
}
