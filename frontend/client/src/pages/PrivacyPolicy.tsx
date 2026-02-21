/**
 * PRIVACY POLICY PAGE
 * Standalone page (outside DashboardLayout)
 * Ironclad privacy policy for EusoTrip Freight & Energy Logistics Platform
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Shield,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Lock,
  Eye,
  Mail,
  Globe,
  Users,
  Server,
  Database,
  Fingerprint,
  FileText,
  MapPin,
  Cookie,
  Baby,
  Scale,
  Bell,
  Share2,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";

const EFFECTIVE_DATE = "February 5, 2025";
const LAST_UPDATED = "February 5, 2025";
const COMPANY_NAME = "Eusorone Technologies Inc.";
const PLATFORM_NAME = "EusoTrip";
const COMPANY_STATE = "Texas";
const COMPANY_JURISDICTION = "Harris County, Texas";
const CONTACT_EMAIL = "legal@eusoronetech.com";
const DPO_EMAIL = "privacy@eusoronetech.com";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  highlight?: boolean;
}

const PRIVACY_SECTIONS: Section[] = [
  {
    id: "introduction",
    title: "1. Introduction & Scope",
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    content: (
      <div className="space-y-3">
        <p>{COMPANY_NAME} ("Company," "we," "us," or "our") operates the {PLATFORM_NAME} freight and energy logistics platform (the "Platform"). This Privacy Policy describes how we collect, use, disclose, store, and protect your personal information when you access or use the Platform, visit our website, or interact with us in any way.</p>
        <p>This Privacy Policy applies to all Users of the Platform, including Shippers, Catalysts, Brokers, Drivers, Dispatchers (Dispatch), Escort/Pilot Vehicle Operators, Terminal Managers, Compliance Officers, Safety Managers, and all other registered and unregistered visitors.</p>
        <p>By using the Platform, you consent to the data practices described in this Privacy Policy. If you do not agree with this Privacy Policy, please do not use the Platform. This Privacy Policy is incorporated into and subject to our Terms of Service.</p>
        <p>We are committed to complying with applicable privacy and data protection laws, including but not limited to the California Consumer Privacy Act (CCPA/CPRA, Cal. Civ. Code 1798.100 et seq.), the Texas Data Privacy and Security Act (TDPSA), the Virginia Consumer Data Protection Act (VCDPA), the Colorado Privacy Act (CPA), the Connecticut Data Privacy Act (CTDPA), the Gramm-Leach-Bliley Act (GLBA) to the extent applicable to financial services, and applicable provisions of the European General Data Protection Regulation (GDPR) for any EU/EEA users.</p>
      </div>
    ),
  },
  {
    id: "information-collected",
    title: "2. Information We Collect",
    icon: <Database className="w-5 h-5 text-green-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">2.1 Information You Provide Directly:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-white">Account & Registration Data:</strong> Name, email address, phone number, mailing address, company name, job title, role selection, username, and password</li>
          <li><strong className="text-white">Identity & Credential Data:</strong> Commercial Driver's License (CDL) number and state, CDL endorsements, TWIC card number, medical examiner's certificate, USDOT number, MC/MX authority number, FMCSA safety rating, employer identification number (EIN), Social Security Number (last 4 digits for verification), date of birth</li>
          <li><strong className="text-white">Insurance & Financial Data:</strong> Insurance policy numbers and coverage amounts, surety bond information, bank account details (for payments/factoring), payment card information (processed via PCI-DSS compliant third-party processors), tax identification information</li>
          <li><strong className="text-white">Regulatory & Compliance Data:</strong> PHMSA registration numbers, EPA IDs, hazmat training certificates, drug and alcohol testing program enrollment, CSA scores, inspection history, accident history, safety audit documentation</li>
          <li><strong className="text-white">Operational Data:</strong> Load details (origin, destination, commodity, weight, dimensions, special handling), rate information, bid amounts, contract terms, delivery schedules, proof of delivery documents, bills of lading, shipping papers</li>
          <li><strong className="text-white">Communications:</strong> Messages sent through the Platform, support tickets, feedback, reviews, ratings, and any other content you submit</li>
          <li><strong className="text-white">Vehicle & Equipment Data:</strong> Vehicle identification numbers (VIN), license plate numbers, vehicle specifications, trailer information, maintenance records, inspection reports</li>
        </ul>
        <p><strong className="text-white">2.2 Information Collected Automatically:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-white">GPS & Location Data:</strong> Real-time location data from driver mobile devices and ELD-equipped vehicles during active loads, geofence entry/exit events, route history, speed data, idle time (collected with your consent and as required for ELD compliance under 49 CFR Part 395)</li>
          <li><strong className="text-white">Device & Technical Data:</strong> IP address, browser type and version, operating system, device identifiers, mobile device type, screen resolution, language preferences, referring URLs</li>
          <li><strong className="text-white">Usage Data:</strong> Pages visited, features used, click patterns, search queries, session duration, load views, bid activity, login timestamps, feature engagement metrics</li>
          <li><strong className="text-white">ELD & Telematics Data:</strong> Hours of Service records, engine diagnostics, fuel consumption, hard braking events, acceleration patterns, vehicle fault codes (collected from integrated ELD and telematics systems)</li>
          <li><strong className="text-white">Cookies & Tracking Technologies:</strong> We use cookies, web beacons, pixels, and similar technologies as described in Section 8 below</li>
        </ul>
        <p><strong className="text-white">2.3 Information from Third Parties:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-white">FMCSA/SAFER Data:</strong> Catalyst safety ratings, authority status, insurance filing status, inspection and crash data from FMCSA SAFER system</li>
          <li><strong className="text-white">Credit & Background Checks:</strong> Credit reports (with your authorization), criminal background check results, MVR (Motor Vehicle Records) reports, employment verification</li>
          <li><strong className="text-white">Identity Verification Services:</strong> Results from third-party identity verification, document authentication, and fraud detection services</li>
          <li><strong className="text-white">Payment Processors:</strong> Transaction confirmation data, chargeback notifications, fraud alerts from payment processing partners</li>
          <li><strong className="text-white">Insurance Verification:</strong> Insurance status updates from catalyst insurance databases and verification services</li>
        </ul>
      </div>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    icon: <Eye className="w-5 h-5 text-purple-400" />,
    content: (
      <div className="space-y-3">
        <p>We use the information we collect for the following purposes:</p>
        <p><strong className="text-white">3.1 Platform Operations & Service Delivery:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Creating and managing your account and verifying your identity and credentials</li>
          <li>Facilitating load matching, bidding, booking, and transportation management</li>
          <li>Processing payments, invoices, factoring, and financial transactions</li>
          <li>Providing real-time tracking, dispatch, and fleet management services</li>
          <li>Managing compliance documentation and regulatory reporting</li>
          <li>Operating gamification features, rewards programs, and driver incentives</li>
          <li>Facilitating communications between Users through in-platform messaging</li>
          <li>Providing AI-powered analytics, SpectraMatch crude oil identification, and ERG guidance</li>
        </ul>
        <p><strong className="text-white">3.2 Safety & Regulatory Compliance:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Monitoring Hours of Service compliance and ELD data as required by 49 CFR Part 395</li>
          <li>Verifying CDL status, endorsements, medical certificates, and driver qualifications per 49 CFR Part 391</li>
          <li>Monitoring hazardous materials shipping compliance per 49 CFR Parts 171-180</li>
          <li>Conducting drug and alcohol testing program administration per 49 CFR Part 382</li>
          <li>Reporting required safety data to FMCSA, PHMSA, DOT, and other regulatory agencies</li>
          <li>Emergency response coordination during supply chain disruptions or hazmat incidents</li>
        </ul>
        <p><strong className="text-white">3.3 Platform Integrity & Anti-Circumvention:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Detecting and preventing fraud, unauthorized access, and abuse of the Platform</li>
          <li>Monitoring for potential circumvention of Platform fees as described in our Terms of Service</li>
          <li>Analyzing transaction patterns to detect double brokering, cargo theft, and other prohibited conduct</li>
          <li>Enforcing our Terms of Service and other Platform policies</li>
        </ul>
        <p><strong className="text-white">3.4 Analytics & Improvement:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Analyzing usage patterns to improve Platform features and user experience</li>
          <li>Generating aggregated, anonymized market intelligence and benchmarking data</li>
          <li>Developing new features, products, and services</li>
          <li>Conducting research and development of AI and machine learning models</li>
        </ul>
        <p><strong className="text-white">3.5 Communications:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Sending transactional notifications (load updates, payment confirmations, bid alerts)</li>
          <li>Sending safety alerts, emergency mobilization orders, and regulatory updates</li>
          <li>Sending marketing and promotional communications (with your consent where required)</li>
          <li>Responding to your inquiries and providing customer support</li>
        </ul>
      </div>
    ),
  },
  {
    id: "legal-bases",
    title: "4. Legal Bases for Processing",
    icon: <Scale className="w-5 h-5 text-cyan-400" />,
    content: (
      <div className="space-y-3">
        <p>We process your personal information based on the following legal grounds:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Contract Performance:</strong> Processing necessary to perform our contract with you (the Terms of Service), including account creation, load management, payments, and service delivery</li>
          <li><strong className="text-white">Legal Obligation:</strong> Processing necessary to comply with federal and state transportation regulations (FMCSA, PHMSA, DOT), tax laws, anti-money laundering requirements, and other legal obligations</li>
          <li><strong className="text-white">Legitimate Interests:</strong> Processing necessary for our legitimate business interests, including fraud prevention, anti-circumvention enforcement, platform security, analytics, and service improvement, balanced against your privacy rights</li>
          <li><strong className="text-white">Consent:</strong> Processing based on your explicit consent, including marketing communications, location tracking beyond regulatory requirements, and optional data sharing features. You may withdraw consent at any time without affecting the lawfulness of prior processing</li>
          <li><strong className="text-white">Vital Interests:</strong> Processing necessary to protect vital interests in emergency response situations (e.g., hazmat spills, accidents, driver emergencies)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "sharing-disclosure",
    title: "5. Information Sharing & Disclosure",
    icon: <Share2 className="w-5 h-5 text-amber-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
        <p><strong className="text-white">5.1 With Other Platform Users:</strong> When you use the Platform, certain information is shared with other Users as necessary for transactions. For example, Shippers see Catalyst company names and safety ratings; Catalysts see load details and pickup/delivery locations; Drivers' real-time locations are shared with dispatchers and load stakeholders during active deliveries.</p>
        <p><strong className="text-white">5.2 Service Providers:</strong> We share information with trusted third-party service providers who assist us in operating the Platform, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cloud hosting and infrastructure providers (data storage, computing)</li>
          <li>Payment processors and financial service partners (PCI-DSS compliant)</li>
          <li>Identity verification and background check providers</li>
          <li>FMCSA/SAFER data providers and insurance verification services</li>
          <li>Email and communication service providers</li>
          <li>Analytics and monitoring tools</li>
          <li>Customer support platforms</li>
        </ul>
        <p>All service providers are contractually bound to use your information only for the purposes we specify and to maintain appropriate security measures.</p>
        <p><strong className="text-white">5.3 Regulatory & Government Authorities:</strong> We may disclose your information to regulatory agencies and government authorities as required by law, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>FMCSA (safety data, inspection results, compliance records)</li>
          <li>PHMSA (hazardous materials incident reports, registration data)</li>
          <li>DOT (accident reports, safety data)</li>
          <li>EPA (environmental incident reports, facility data)</li>
          <li>OSHA (workplace safety incidents)</li>
          <li>TSA (security threat assessments, TWIC-related inquiries)</li>
          <li>IRS and state tax authorities (1099 reporting, tax compliance)</li>
          <li>Law enforcement (in response to valid legal process, subpoenas, or court orders)</li>
        </ul>
        <p><strong className="text-white">5.4 Legal Proceedings:</strong> We may disclose information in connection with legal proceedings, including to enforce our Terms of Service, to protect our rights, property, or safety, or the rights, property, or safety of our Users or the public.</p>
        <p><strong className="text-white">5.5 Business Transfers:</strong> In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.</p>
        <p><strong className="text-white">5.6 Aggregated & De-Identified Data:</strong> We may share aggregated, anonymized, or de-identified data that cannot reasonably be used to identify you for industry benchmarking, research, analytics, and marketing purposes.</p>
      </div>
    ),
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    icon: <Server className="w-5 h-5 text-indigo-400" />,
    content: (
      <div className="space-y-3">
        <p>We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. Specific retention periods include:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Account Data:</strong> Retained for the duration of your active account plus 7 years after account termination (for tax, legal, and regulatory compliance purposes)</li>
          <li><strong className="text-white">ELD/HOS Records:</strong> Retained for a minimum of 6 months as required by 49 CFR 395.8(k), and up to 3 years for compliance auditing</li>
          <li><strong className="text-white">Driver Qualification Files:</strong> Retained for 3 years after the driver's employment/contract ends per 49 CFR 391.51</li>
          <li><strong className="text-white">Drug & Alcohol Testing Records:</strong> Retained for 1-5 years depending on record type per 49 CFR Part 40</li>
          <li><strong className="text-white">Financial & Transaction Records:</strong> Retained for 7 years per IRS and state tax requirements</li>
          <li><strong className="text-white">Accident & Incident Records:</strong> Retained for 3 years per 49 CFR 390.15, or longer if related to ongoing litigation</li>
          <li><strong className="text-white">Hazmat Shipping Records:</strong> Retained for 2 years per 49 CFR 172.201(e) or 3 years for hazardous waste manifests per EPA RCRA</li>
          <li><strong className="text-white">Insurance Records:</strong> Retained for the policy period plus 3 years</li>
          <li><strong className="text-white">Communication Records:</strong> Retained for 3 years after the last communication</li>
          <li><strong className="text-white">GPS/Location Data:</strong> Retained for 6 months for active tracking purposes, then archived for up to 3 years for compliance and dispute resolution</li>
        </ul>
        <p>When retention periods expire, we securely delete or anonymize the data. We may retain de-identified or aggregated data indefinitely for analytics and research purposes.</p>
      </div>
    ),
  },
  {
    id: "data-security",
    title: "7. Data Security",
    icon: <Lock className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />,
    content: (
      <div className="space-y-3">
        <p>We implement comprehensive technical and organizational security measures to protect your personal information, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-white">Encryption:</strong> TLS 1.3 encryption for all data in transit; AES-256 encryption for data at rest; encrypted database backups</li>
          <li><strong className="text-white">Access Controls:</strong> Role-based access control (RBAC), multi-factor authentication for administrative access, principle of least privilege</li>
          <li><strong className="text-white">Infrastructure Security:</strong> SOC 2 compliant cloud infrastructure, network segmentation, intrusion detection/prevention systems, DDoS protection, regular penetration testing</li>
          <li><strong className="text-white">Payment Security:</strong> PCI-DSS compliant payment processing; we do not store raw credit card numbers on our servers</li>
          <li><strong className="text-white">Monitoring:</strong> 24/7 security monitoring, automated anomaly detection, comprehensive audit logging</li>
          <li><strong className="text-white">Incident Response:</strong> Documented incident response procedures, breach notification protocols in compliance with applicable state breach notification laws</li>
          <li><strong className="text-white">Employee Training:</strong> Regular security awareness training for all personnel with access to user data</li>
          <li><strong className="text-white">Vendor Security:</strong> Due diligence and contractual security requirements for all third-party service providers</li>
        </ul>
        <p>Despite our efforts, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but will promptly notify affected Users and applicable authorities in the event of a data breach as required by law.</p>
      </div>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookies & Tracking Technologies",
    icon: <Cookie className="w-5 h-5 text-orange-400" />,
    content: (
      <div className="space-y-3">
        <p>We use the following types of cookies and tracking technologies:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Strictly Necessary Cookies:</strong> Required for the Platform to function (authentication, session management, security tokens, load balancing). These cannot be disabled.</li>
          <li><strong className="text-white">Functional Cookies:</strong> Remember your preferences and settings (language, role, dashboard layout, map preferences).</li>
          <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how Users interact with the Platform (page views, feature usage, error tracking). We use these to improve the Platform.</li>
          <li><strong className="text-white">Performance Cookies:</strong> Monitor Platform performance, load times, and identify technical issues.</li>
        </ul>
        <p><strong className="text-white">Managing Cookies:</strong> You can control cookies through your browser settings. Disabling certain cookies may limit Platform functionality. Strictly necessary cookies cannot be disabled without impacting core Platform operations.</p>
        <p><strong className="text-white">Do Not Track:</strong> We currently respond to "Do Not Track" browser signals by disabling non-essential analytics cookies.</p>
      </div>
    ),
  },
  {
    id: "your-rights",
    title: "9. Your Privacy Rights",
    icon: <Fingerprint className="w-5 h-5 text-rose-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
        <p><strong className="text-white">9.1 Right to Know / Access (CCPA 1798.100, TDPSA, VCDPA, GDPR Art. 15):</strong> You have the right to request that we disclose what personal information we collect, use, disclose, and sell about you. You may request a copy of your personal information in a portable, machine-readable format.</p>
        <p><strong className="text-white">9.2 Right to Delete (CCPA 1798.105, TDPSA, VCDPA, GDPR Art. 17):</strong> You have the right to request deletion of your personal information, subject to certain exceptions. We may retain information necessary for legal compliance (e.g., ELD records, driver qualification files, tax records), fraud prevention, exercising or defending legal claims, or as otherwise permitted by law.</p>
        <p><strong className="text-white">9.3 Right to Correct (CCPA 1798.106, TDPSA, GDPR Art. 16):</strong> You have the right to request correction of inaccurate personal information. You can update most information directly through your account settings.</p>
        <p><strong className="text-white">9.4 Right to Opt-Out of Sale (CCPA 1798.120):</strong> We do not sell your personal information as defined by the CCPA. If this changes, we will provide a clear opt-out mechanism.</p>
        <p><strong className="text-white">9.5 Right to Non-Discrimination (CCPA 1798.125):</strong> We will not discriminate against you for exercising your privacy rights. However, some features require certain data to function (e.g., GPS tracking for active load tracking, credential data for compliance verification).</p>
        <p><strong className="text-white">9.6 Right to Data Portability (GDPR Art. 20, VCDPA):</strong> Where technically feasible, you may request your personal information in a structured, commonly used, machine-readable format.</p>
        <p><strong className="text-white">9.7 Right to Restrict Processing (GDPR Art. 18):</strong> In certain circumstances, you may request that we restrict the processing of your personal information.</p>
        <p><strong className="text-white">9.8 Right to Object (GDPR Art. 21):</strong> You may object to processing based on our legitimate interests. We will cease processing unless we demonstrate compelling legitimate grounds.</p>
        <p><strong className="text-white">9.9 How to Exercise Your Rights:</strong> To exercise any of these rights, contact us at <a href={`mailto:${DPO_EMAIL}`} className="text-blue-400 hover:underline">{DPO_EMAIL}</a> or through the Privacy Settings in your account. We will respond to verified requests within 45 days (CCPA) or 30 days (GDPR/VCDPA). We may extend the response period by an additional 45 days (CCPA) or 60 days (GDPR) if reasonably necessary, with notice.</p>
        <p><strong className="text-white">9.10 Authorized Agents:</strong> You may designate an authorized agent to submit privacy requests on your behalf with proper written authorization.</p>
        <p><strong className="text-white">9.11 Appeal:</strong> If we deny your privacy request, you have the right to appeal by contacting us at {DPO_EMAIL}. If your appeal is denied, you may contact your state's Attorney General.</p>
      </div>
    ),
  },
  {
    id: "location-data",
    title: "10. Location Data & GPS Tracking",
    icon: <MapPin className="w-5 h-5 text-red-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">10.1 When We Collect Location Data:</strong> We collect GPS location data from Drivers and vehicles: (a) during active load assignments (from acceptance to delivery confirmation); (b) when ELD-equipped vehicles are in operation (as required by 49 CFR Part 395); (c) when you voluntarily enable location sharing for features like nearby load search or rest stop finder.</p>
        <p><strong className="text-white">10.2 How We Use Location Data:</strong> Location data is used for: real-time load tracking and ETA updates; ELD/HOS compliance; geofence alerts for pickup/delivery; route optimization; emergency response coordination; verifying load completion and proof of delivery; detention time calculation.</p>
        <p><strong className="text-white">10.3 Who Sees Your Location:</strong> Your real-time location during active loads is visible to: the Shipper, Broker, and/or Dispatcher associated with the active load; your catalyst's fleet management team; Platform safety and compliance systems. Your location is NOT visible to other unrelated Platform Users.</p>
        <p><strong className="text-white">10.4 Controlling Location Data:</strong> Location tracking during active ELD operation is required by federal regulation and cannot be disabled. For non-ELD location features, you may disable location permissions in your device settings. Disabling location may limit certain Platform features.</p>
      </div>
    ),
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    icon: <Baby className="w-5 h-5 text-pink-400" />,
    content: (
      <div className="space-y-3">
        <p>The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18 (or under 16 for GDPR purposes). If you are under 18, you may not create an account or use the Platform.</p>
        <p>If we become aware that we have collected personal information from a child under the applicable age, we will take steps to delete such information promptly. If you believe we have inadvertently collected information from a minor, please contact us immediately at {DPO_EMAIL}.</p>
      </div>
    ),
  },
  {
    id: "international",
    title: "12. International Data Transfers",
    icon: <Globe className="w-5 h-5 text-teal-400" />,
    content: (
      <div className="space-y-3">
        <p>The Platform is primarily operated in the United States. Your information may be transferred to, stored in, and processed in the United States and other countries where our service providers operate.</p>
        <p>If you are accessing the Platform from outside the United States, please be aware that your information will be transferred to the United States, which may have different data protection laws than your country. By using the Platform, you consent to this transfer.</p>
        <p>For transfers of personal data from the EU/EEA, we rely on: (a) Standard Contractual Clauses (SCCs) approved by the European Commission; (b) data processing agreements with all service providers; and (c) additional technical and organizational safeguards to ensure adequate protection of your data.</p>
      </div>
    ),
  },
  {
    id: "state-specific",
    title: "13. State-Specific Disclosures",
    icon: <FileText className="w-5 h-5 text-violet-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">13.1 California Residents (CCPA/CPRA):</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Categories of personal information collected: Identifiers, commercial information, internet activity, geolocation data, professional/employment information, biometric information (if fingerprint/facial verification is used), financial information</li>
          <li>Business purposes for collection: As described in Section 3</li>
          <li>Categories of third parties with whom information is shared: As described in Section 5</li>
          <li>We do not sell or share (as defined by CPRA) personal information for cross-context behavioral advertising</li>
          <li>We do not use or disclose sensitive personal information for purposes other than those permitted by CCPA 1798.121</li>
          <li>Financial incentive programs (e.g., gamification rewards, referral bonuses) are based on Platform usage and are not tied to the value of your personal information</li>
        </ul>
        <p><strong className="text-white">13.2 Texas Residents (TDPSA):</strong> Texas residents have the right to access, correct, delete, and obtain a copy of their personal data, and to opt out of targeted advertising, sale, and profiling. Contact us at {DPO_EMAIL} to exercise these rights.</p>
        <p><strong className="text-white">13.3 Virginia, Colorado, Connecticut Residents:</strong> Residents of these states have similar rights under VCDPA, CPA, and CTDPA respectively. Contact us at {DPO_EMAIL} to exercise your rights. You may appeal any denial to us, and if unsatisfied, to your state Attorney General.</p>
      </div>
    ),
  },
  {
    id: "changes",
    title: "14. Changes to This Privacy Policy",
    icon: <RefreshCw className="w-5 h-5 text-slate-400" />,
    content: (
      <div className="space-y-3">
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes, we will:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Update the "Last Updated" date at the top of this page</li>
          <li>Provide notice through the Platform (in-app notification or banner)</li>
          <li>Send an email notification to your registered email address for material changes</li>
          <li>Where required by law, obtain your consent before implementing changes</li>
        </ul>
        <p>Your continued use of the Platform after we post changes constitutes your acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.</p>
      </div>
    ),
  },
  {
    id: "contact",
    title: "15. Contact Us & Data Protection Officer",
    icon: <Mail className="w-5 h-5 text-blue-400" />,
    content: (
      <div className="space-y-3">
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
          <p><strong className="text-white">Data Protection Officer</strong></p>
          <p>{COMPANY_NAME}</p>
          <p>Email: <a href={`mailto:${DPO_EMAIL}`} className="text-blue-400 hover:underline">{DPO_EMAIL}</a></p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-2 mt-3">
          <p><strong className="text-white">Legal Department</strong></p>
          <p>{COMPANY_NAME}</p>
          <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a></p>
        </div>
        <p className="mt-3">If you are not satisfied with our response, you have the right to lodge a complaint with your applicable data protection authority or state Attorney General.</p>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["introduction"]));
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(PRIVACY_SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      {/* Top Navigation */}
      <div className={`sticky top-0 z-10 backdrop-blur-lg border-b ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/90 border-white/[0.06]'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-1 text-sm transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {PLATFORM_NAME}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/eusotrip-logo.png"
                alt="EusoTrip Logo"
                className="w-6 h-6 object-contain"
              />
              <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{PLATFORM_NAME}</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 ${isLight ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-white/[0.06]'}`}
              title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-2">
            Privacy Policy
          </h1>
          <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
            {COMPANY_NAME} - {PLATFORM_NAME} Freight & Energy Logistics Platform
          </p>
          <div className={`flex items-center justify-center gap-4 mt-3 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Effective: {EFFECTIVE_DATE}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Last Updated: {LAST_UPDATED}
            </span>
          </div>
        </div>

        {/* Privacy Commitment Banner */}
        <Card className={`rounded-xl mb-6 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent'}`} />
              <div>
                <p className={`font-semibold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>YOUR PRIVACY MATTERS</p>
                <p className={`text-sm mt-1 ${isLight ? 'text-emerald-600/80' : 'text-emerald-200/80'}`}>
                  We are committed to protecting your personal information. This policy explains what data we collect, how we use it, who we share it with, and your rights. We comply with CCPA, TDPSA, VCDPA, and other applicable privacy laws. We do not sell your personal information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expand/Collapse Controls */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button onClick={expandAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Expand All
          </button>
          <span className="text-slate-600">|</span>
          <button onClick={collapseAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Collapse All
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {PRIVACY_SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <Card
                key={section.id}
                className={`rounded-xl transition-colors ${
                  section.highlight
                    ? (isLight ? 'bg-white border-emerald-300 shadow-sm' : 'bg-slate-800/70 border-emerald-500/30')
                    : (isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-white/[0.06]')
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors rounded-xl ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.06]/30'}`}
                >
                  {section.icon}
                  <span className={`flex-1 font-semibold text-sm md:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {section.title}
                  </span>
                  {section.highlight && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent border border-emerald-500/30 mr-2">
                      KEY
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className={`text-sm leading-relaxed border-t pt-4 ${isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/[0.06]'}`}>
                      {section.content}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Contact DPO */}
        <Card className={`rounded-xl mt-8 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-white/[0.06]'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Privacy Questions or Data Requests?</p>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Data Protection Officer:{" "}
                  <a href={`mailto:${DPO_EMAIL}`} className="text-blue-400 hover:underline">
                    {DPO_EMAIL}
                  </a>
                </p>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Legal Department:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className={`text-xs mt-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {COMPANY_NAME} | {PLATFORM_NAME} Freight & Energy Logistics Platform
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-slate-500">
            Copyright {new Date().getFullYear()} {COMPANY_NAME} All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
