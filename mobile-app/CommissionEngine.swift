import Foundation
import Combine

// MARK: - Commission Engine for EusoTrip Platform Revenue
class CommissionEngine: ObservableObject {
    static let shared = CommissionEngine()
    
    // MARK: - Revenue Tracking
    @Published var totalPlatformRevenue: Double = 0.0
    @Published var dailyRevenue: Double = 0.0
    @Published var monthlyRevenue: Double = 0.0
    @Published var yearlyRevenue: Double = 0.0
    @Published var revenueByStream: [RevenueStream: Double] = [:]
    
    // MARK: - Commission Rates Configuration
    private let commissionRates = CommissionRates(
        // Load-based commissions (Primary Revenue Stream)
        standardLoadCommission: 0.05,      // 5% for standard loads
        premiumLoadCommission: 0.08,       // 8% for premium loads
        hazmatLoadCommission: 0.10,        // 10% for hazmat loads
        oversizedLoadCommission: 0.12,     // 12% for oversized loads
        
        // Payment processing fees (Secondary Revenue Stream)
        instantPayFee: 0.015,              // 1.5% for instant pay
        creditCardProcessingFee: 0.029,    // 2.9% + $0.30 for credit cards
        achProcessingFee: 0.008,           // 0.8% for ACH transfers
        
        // Subscription fees (Recurring Revenue Stream)
        basicSubscription: 29.99,          // $29.99/month basic plan
        premiumSubscription: 79.99,        // $79.99/month premium plan
        enterpriseSubscription: 199.99,    // $199.99/month enterprise plan
        
        // Advertising revenue (Growth Revenue Stream)
        adImpressionRate: 0.002,           // $0.002 per impression
        adClickRate: 0.25,                 // $0.25 per click
        sponsoredLoadFee: 50.0,            // $50 to promote a load
        
        // Referral bonuses (User Acquisition Cost)
        driverReferralBonus: 100.0,        // $100 for referring a driver
        carrierReferralBonus: 250.0,       // $250 for referring a carrier
        shipperReferralBonus: 500.0,       // $500 for referring a shipper
        
        // Minimum commission thresholds
        minimumLoadCommission: 25.0,       // Minimum $25 per load
        minimumTransactionFee: 2.50        // Minimum $2.50 per transaction
    )
    
    // MARK: - Revenue Calculation Methods
    
    /// Calculate comprehensive commission breakdown for a load transaction
    func calculateLoadCommissions(
        loadAmount: Double,
        shipper: User,
        driver: User,
        load: Load
    ) -> LoadCommissionBreakdown {
        
        // 1. Determine base commission rate
        let baseRate = determineCommissionRate(load: load, shipper: shipper, driver: driver)
        let platformCommission = max(loadAmount * baseRate, commissionRates.minimumLoadCommission)
        
        // 2. Calculate driver earnings (85-92% of load amount)
        let driverEarnings = loadAmount - platformCommission - calculateAdditionalFees(load: load)
        
        // 3. Calculate ecosystem commissions
        let carrierCommission = calculateCarrierCommission(load: load, loadAmount: loadAmount)
        let brokerCommission = calculateBrokerCommission(load: load, loadAmount: loadAmount)
        let escortDriverCommission = calculateEscortDriverCommission(load: load, loadAmount: loadAmount)
        
        // 4. Calculate referral bonuses
        let referralBonus = calculateReferralBonus(driver: driver, loadAmount: loadAmount)
        
        // 5. Calculate advertising revenue (if load is sponsored)
        let advertisingRevenue = load.isSponsored ? commissionRates.sponsoredLoadFee : 0.0
        
        return LoadCommissionBreakdown(
            loadAmount: loadAmount,
            platformCommission: platformCommission,
            driverEarnings: driverEarnings,
            carrierCommission: carrierCommission,
            brokerCommission: brokerCommission,
            escortDriverCommission: escortDriverCommission,
            referralBonus: referralBonus,
            advertisingRevenue: advertisingRevenue,
            commissionRate: baseRate,
            totalPlatformRevenue: platformCommission + advertisingRevenue
        )
    }
    
    /// Calculate payment processing fees (Additional Revenue Stream)
    func calculatePaymentProcessingFees(
        amount: Double,
        paymentMethod: PaymentMethodType
    ) -> PaymentProcessingBreakdown {
        
        var processingFee: Double
        var platformRevenue: Double
        
        switch paymentMethod {
        case .creditCard:
            processingFee = (amount * commissionRates.creditCardProcessingFee) + 0.30
            platformRevenue = processingFee * 0.3 // Platform keeps 30% of processing fees
            
        case .ach:
            processingFee = amount * commissionRates.achProcessingFee
            platformRevenue = processingFee * 0.5 // Platform keeps 50% of ACH fees
            
        case .instantPay:
            processingFee = amount * commissionRates.instantPayFee
            platformRevenue = processingFee // Platform keeps 100% of instant pay fees
            
        case .wallet:
            processingFee = 0.0 // No fee for wallet-to-wallet transfers
            platformRevenue = 0.0
        }
        
        let finalFee = max(processingFee, commissionRates.minimumTransactionFee)
        
        return PaymentProcessingBreakdown(
            transactionAmount: amount,
            processingFee: finalFee,
            platformRevenue: platformRevenue,
            netAmount: amount - finalFee
        )
    }
    
    /// Calculate subscription revenue (Recurring Revenue Stream)
    func calculateSubscriptionRevenue(user: User) -> SubscriptionRevenue {
        let monthlyFee: Double
        let features: [String]
        
        switch user.subscriptionTier {
        case .basic:
            monthlyFee = commissionRates.basicSubscription
            features = ["Basic load matching", "Standard support", "Mobile app access"]
            
        case .premium:
            monthlyFee = commissionRates.premiumSubscription
            features = ["Advanced load matching", "Priority support", "Analytics dashboard", "API access"]
            
        case .enterprise:
            monthlyFee = commissionRates.enterpriseSubscription
            features = ["Custom integrations", "Dedicated support", "White-label options", "Advanced analytics"]
            
        case .free:
            monthlyFee = 0.0
            features = ["Limited load matching", "Community support"]
        }
        
        return SubscriptionRevenue(
            userId: user.id,
            tier: user.subscriptionTier,
            monthlyFee: monthlyFee,
            yearlyRevenue: monthlyFee * 12,
            features: features
        )
    }
    
    /// Calculate advertising revenue (Growth Revenue Stream)
    func calculateAdvertisingRevenue(
        impressions: Int,
        clicks: Int,
        sponsoredLoads: Int
    ) -> AdvertisingRevenue {
        
        let impressionRevenue = Double(impressions) * commissionRates.adImpressionRate
        let clickRevenue = Double(clicks) * commissionRates.adClickRate
        let sponsoredLoadRevenue = Double(sponsoredLoads) * commissionRates.sponsoredLoadFee
        
        let totalRevenue = impressionRevenue + clickRevenue + sponsoredLoadRevenue
        
        return AdvertisingRevenue(
            impressions: impressions,
            clicks: clicks,
            sponsoredLoads: sponsoredLoads,
            impressionRevenue: impressionRevenue,
            clickRevenue: clickRevenue,
            sponsoredLoadRevenue: sponsoredLoadRevenue,
            totalRevenue: totalRevenue
        )
    }
    
    // MARK: - Private Calculation Methods
    
    private func determineCommissionRate(load: Load, shipper: User, driver: User) -> Double {
        var rate: Double
        
        // Base rate by load type
        switch load.loadType {
        case .standard:
            rate = commissionRates.standardLoadCommission
        case .premium:
            rate = commissionRates.premiumLoadCommission
        case .hazmat:
            rate = commissionRates.hazmatLoadCommission
        case .oversized:
            rate = commissionRates.oversizedLoadCommission
        }
        
        // Adjustments based on user behavior and volume
        
        // High-volume shippers get discounts
        if shipper.monthlyLoadVolume > 100 {
            rate -= 0.01 // 1% discount for high-volume shippers
        }
        
        // Premium subscribers get reduced rates
        if shipper.subscriptionTier == .premium || shipper.subscriptionTier == .enterprise {
            rate -= 0.005 // 0.5% discount for premium subscribers
        }
        
        // New users pay slightly higher rates
        if driver.totalLoadsCompleted < 10 {
            rate += 0.005 // 0.5% higher for new drivers
        }
        
        // High-value loads get tiered pricing
        if load.amount > 10000 {
            rate += 0.01 // 1% higher for loads over $10k
        }
        
        // Ensure rate stays within bounds
        return min(max(rate, 0.03), 0.15) // Between 3% and 15%
    }
    
    private func calculateCarrierCommission(load: Load, loadAmount: Double) -> Double? {
        guard let carrierId = load.carrierId, carrierId != load.driverId else {
            return nil
        }
        
        // Carrier gets 2-5% depending on their tier and volume
        let baseRate = 0.03 // 3% base rate
        return loadAmount * baseRate
    }
    
    private func calculateBrokerCommission(load: Load, loadAmount: Double) -> Double? {
        guard let brokerId = load.brokerId else {
            return nil
        }
        
        // Broker gets 1-3% for facilitating the load
        let baseRate = 0.02 // 2% base rate
        return loadAmount * baseRate
    }
    
    private func calculateEscortDriverCommission(load: Load, loadAmount: Double) -> Double? {
        guard let escortDriverId = load.escortDriverId else {
            return nil
        }
        
        // Escort driver gets 1-2% for escort services
        let baseRate = 0.015 // 1.5% base rate
        return loadAmount * baseRate
    }
    
    private func calculateReferralBonus(driver: User, loadAmount: Double) -> Double? {
        guard let referrerId = driver.referredBy else {
            return nil
        }
        
        // Referrer gets a bonus on the first 5 loads of the referred driver (e.g., 0.5% of load amount)
        if driver.totalLoadsCompleted < 5 {
            return loadAmount * 0.005
        }
        
        return nil
    }
    
    private func calculateAdditionalFees(load: Load) -> Double {
        var fees = 0.0
        
        // Cold weather fee
        if load.isColdWeather {
            fees += 50.0
        }
        
        // Tolls and bridge fees
        if load.hasTolls {
            fees += 25.0
        }
        
        // Detention fees (if applicable)
        if load.detentionHours > 0 {
            fees += Double(load.detentionHours) * 75.0
        }
        
        return fees
    }
    
    // MARK: - Data Structures (Simplified for brevity)
    
    struct CommissionRates {
        let standardLoadCommission: Double
        let premiumLoadCommission: Double
        let hazmatLoadCommission: Double
        let oversizedLoadCommission: Double
        let instantPayFee: Double
        let creditCardProcessingFee: Double
        let achProcessingFee: Double
        let basicSubscription: Double
        let premiumSubscription: Double
        let enterpriseSubscription: Double
        let adImpressionRate: Double
        let adClickRate: Double
        let sponsoredLoadFee: Double
        let driverReferralBonus: Double
        let carrierReferralBonus: Double
        let shipperReferralBonus: Double
        let minimumLoadCommission: Double
        let minimumTransactionFee: Double
    }
    
    struct LoadCommissionBreakdown {
        let loadAmount: Double
        let platformCommission: Double
        let driverEarnings: Double
        let carrierCommission: Double?
        let brokerCommission: Double?
        let escortDriverCommission: Double?
        let referralBonus: Double?
        let advertisingRevenue: Double
        let commissionRate: Double
        let totalPlatformRevenue: Double
    }
    
    struct PaymentProcessingBreakdown {
        let transactionAmount: Double
        let processingFee: Double
        let platformRevenue: Double
        let netAmount: Double
    }
    
    struct SubscriptionRevenue {
        let userId: String
        let tier: SubscriptionTier
        let monthlyFee: Double
        let yearlyRevenue: Double
        let features: [String]
    }
    
    struct AdvertisingRevenue {
        let impressions: Int
        let clicks: Int
        let sponsoredLoads: Int
        let impressionRevenue: Double
        let clickRevenue: Double
        let sponsoredLoadRevenue: Double
        let totalRevenue: Double
    }
    
    // MARK: - Mock Data Structures (To be replaced by API models)
    
    enum LoadType {
        case standard, premium, hazmat, oversized
    }
    
    enum SubscriptionTier {
        case free, basic, premium, enterprise
    }
    
    enum PaymentMethodType {
        case creditCard, ach, instantPay, wallet
    }
    
    enum RevenueStream: String, CaseIterable {
        case loadCommission = "Load Commission"
        case paymentProcessing = "Payment Processing"
        case subscription = "Subscription"
        case advertising = "Advertising"
        case ancillaryFees = "Ancillary Fees"
    }
    
    struct User {
        let id: String
        let subscriptionTier: SubscriptionTier
        let monthlyLoadVolume: Int
        let totalLoadsCompleted: Int
        let referredBy: String?
    }
    
    struct Load {
        let id: String
        let amount: Double
        let loadType: LoadType
        let driverId: String
        let carrierId: String?
        let brokerId: String?
        let escortDriverId: String?
        let isSponsored: Bool
        let isColdWeather: Bool
        let hasTolls: Bool
        let detentionHours: Int
    }
}
