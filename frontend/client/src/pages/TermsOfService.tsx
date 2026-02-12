/**
 * TERMS OF SERVICE PAGE
 * Standalone page (outside DashboardLayout)
 * Ironclad legal terms for EusoTrip Freight & Energy Logistics Platform
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertTriangle,
  Scale,
  Truck,
  Lock,
  Ban,
  Gavel,
  BookOpen,
  Mail,
  Globe,
  Users,
  DollarSign,
  Eye,
  Server,
  Flame,
  Building2,
  CircleAlert,
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

const TERMS_SECTIONS: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms & Agreement to Be Bound",
    icon: <Gavel className="w-5 h-5 text-blue-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p>By accessing, browsing, registering for, or using the {PLATFORM_NAME} platform (the "Platform"), operated by {COMPANY_NAME} ("Company," "we," "us," or "our"), you ("User," "you," or "your") acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms"), our Privacy Policy, and all applicable laws and regulations, including but not limited to the Federal Motor Carrier Safety Regulations (FMCSRs, 49 CFR Parts 350-399), Pipeline and Hazardous Materials Safety Administration (PHMSA) regulations (49 CFR Parts 100-185), Federal Aviation Administration (FAA) rules as applicable, the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. 7001-7031), the Uniform Electronic Transactions Act (UETA), and all applicable state transportation and commercial codes.</p>
        <p><strong className="text-white">IF YOU DO NOT AGREE TO ALL OF THESE TERMS, YOU MUST NOT ACCESS OR USE THE PLATFORM. YOUR CONTINUED USE OF THE PLATFORM CONSTITUTES YOUR ONGOING ACCEPTANCE OF THESE TERMS AS AMENDED FROM TIME TO TIME.</strong></p>
        <p>These Terms constitute a legally binding agreement between you and {COMPANY_NAME}. By clicking "I Accept," "I Agree," creating an account, or using any part of the Platform, you represent and warrant that you are at least 18 years old, have the legal capacity to enter into this agreement, and if acting on behalf of a company or entity, have the authority to bind that entity to these Terms.</p>
        <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email, in-platform notification, or posting on the Platform with a revised "Last Updated" date. Your continued use after such changes constitutes acceptance of the modified Terms.</p>
      </div>
    ),
  },
  {
    id: "platform-description",
    title: "2. Platform Description & Scope of Services",
    icon: <Truck className="w-5 h-5 text-green-400" />,
    content: (
      <div className="space-y-3">
        <p>{PLATFORM_NAME} is a comprehensive freight and energy logistics technology platform that facilitates the connection of Shippers, Carriers, Brokers, Drivers, Dispatchers (Catalysts), Escort/Pilot Vehicle Operators, Terminal Managers, Compliance Officers, Safety Managers, and other transportation industry participants ("Users"). The Platform provides tools for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Load posting, searching, matching, and booking across all commodity types including but not limited to hazardous materials, crude oil, refined petroleum products, chemicals, dry goods, agricultural products, and oversized/overweight freight</li>
          <li>Real-time GPS tracking, Hours of Service (HOS) monitoring, and Electronic Logging Device (ELD) compliance</li>
          <li>Automated dispatch, route optimization, and fleet management</li>
          <li>Digital bill of lading (BOL), proof of delivery (POD), rate confirmations, and document management</li>
          <li>Bidding, rate negotiation, and marketplace transactions</li>
          <li>Regulatory compliance management (FMCSA, PHMSA, DOT, EPA, OSHA, TSA, EIA)</li>
          <li>Financial services including invoicing, factoring, wallet, and payment processing</li>
          <li>Emergency response coordination, supply chain disruption management, and crisis mobilization</li>
          <li>Gamification, rewards, and driver incentive programs ("The Haul")</li>
          <li>AI-powered analytics, crude oil identification (SpectraMatch), and emergency response guidance (ERG)</li>
          <li>Communication, messaging, and collaboration tools</li>
        </ul>
        <p><strong className="text-white">The Platform is a technology marketplace and intermediary.</strong> {COMPANY_NAME} does not itself transport goods, operate vehicles, employ drivers, or act as a motor carrier, freight broker, or freight forwarder unless separately licensed and disclosed. The Platform facilitates connections between independent parties who negotiate and execute transportation services directly.</p>
      </div>
    ),
  },
  {
    id: "user-accounts",
    title: "3. User Accounts, Registration & Verification",
    icon: <Users className="w-5 h-5 text-purple-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">3.1 Account Registration.</strong> To use the Platform, you must create an account and provide accurate, complete, and current information during registration. You agree to update your information promptly if it changes. Providing false, misleading, or outdated information is grounds for immediate account termination.</p>
        <p><strong className="text-white">3.2 Role-Specific Requirements.</strong> Depending on your selected role, you may be required to provide and maintain valid:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-white">Shippers:</strong> PHMSA registration (if shipping hazmat), EPA ID (if applicable), commodity classifications, insurance certificates</li>
          <li><strong className="text-white">Carriers:</strong> USDOT number, MC/MX authority, operating authority, FMCSA safety rating, insurance ($1M+ liability, cargo coverage), BOC-3 filing</li>
          <li><strong className="text-white">Brokers:</strong> Broker authority (MC number), surety bond or trust fund ($75,000 minimum per 49 CFR 387.307), insurance</li>
          <li><strong className="text-white">Drivers:</strong> Valid CDL (Class A or B), medical examiner's certificate (per 49 CFR 391.41-391.49), endorsements as applicable (H, N, T, X, P, S), TWIC card (if accessing MTSA-regulated facilities), TSA security threat assessment (if hauling hazmat)</li>
          <li><strong className="text-white">Terminal Managers:</strong> Facility EPA ID, SPCC plan, state permits, OSHA compliance documentation</li>
          <li><strong className="text-white">Escorts:</strong> State pilot/escort certifications, vehicle insurance, required equipment</li>
        </ul>
        <p><strong className="text-white">3.3 Verification.</strong> We reserve the right to verify all credentials, licenses, registrations, insurance, and other documentation at any time. Failure to pass verification or maintain current credentials may result in account suspension or termination.</p>
        <p><strong className="text-white">3.4 Account Security.</strong> You are solely responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access. You are liable for all activities conducted through your account.</p>
      </div>
    ),
  },
  {
    id: "anti-circumvention",
    title: "4. Anti-Circumvention & Platform Exclusivity",
    icon: <Ban className="w-5 h-5 text-red-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p className="text-amber-300 font-semibold">THIS SECTION IS A MATERIAL TERM OF THIS AGREEMENT. PLEASE READ IT CAREFULLY.</p>
        <p><strong className="text-white">4.1 Non-Circumvention Covenant.</strong> You agree that for any business relationship, load, shipment, transportation arrangement, or commercial opportunity that was originated, discovered, introduced, facilitated, matched, or negotiated through the {PLATFORM_NAME} Platform (an "Originated Relationship"), you shall not, directly or indirectly:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">(a)</strong> Contact, solicit, negotiate with, or transact business with any other Platform User outside of the Platform for the purpose of circumventing, avoiding, or reducing any fee, commission, or payment owed to {COMPANY_NAME};</li>
          <li><strong className="text-white">(b)</strong> Exchange personal contact information (phone numbers, email addresses, physical addresses, social media handles, or any other direct communication channel) with other Platform Users for the purpose of conducting transactions that would otherwise occur through the Platform;</li>
          <li><strong className="text-white">(c)</strong> Arrange, book, dispatch, or execute any load, shipment, or transportation service that was posted, matched, or identified through the Platform by communicating directly with the counterparty outside the Platform to avoid Platform fees;</li>
          <li><strong className="text-white">(d)</strong> Use information obtained through the Platform (including but not limited to shipper identities, carrier capacities, load origins/destinations, rate information, lane data, or driver availability) to conduct off-platform transactions;</li>
          <li><strong className="text-white">(e)</strong> Divert, redirect, or reassign any load or shipment that was booked through the Platform to an off-platform arrangement;</li>
          <li><strong className="text-white">(f)</strong> Create, maintain, or use any parallel communication channel, third-party tool, or workaround designed to replicate Platform functionality while avoiding Platform fees;</li>
          <li><strong className="text-white">(g)</strong> Encourage, assist, or conspire with any other User to engage in any of the foregoing prohibited conduct.</li>
        </ul>
        <p><strong className="text-white">4.2 Duration of Non-Circumvention.</strong> The non-circumvention obligations under Section 4.1 apply: (a) for the duration of your active account; and (b) for a period of twenty-four (24) months following the last transaction between you and any specific counterparty that was originated through the Platform, regardless of whether your account remains active.</p>
        <p><strong className="text-white">4.3 Pre-Existing Relationships.</strong> The non-circumvention obligations do not apply to business relationships that you can demonstrate, with documentary evidence, existed prior to either party's registration on the Platform. The burden of proof lies with the User claiming a pre-existing relationship.</p>
        <p><strong className="text-white">4.4 Monitoring & Detection.</strong> You acknowledge and consent that {COMPANY_NAME} may employ reasonable monitoring tools, pattern analysis, and algorithmic detection to identify potential circumvention activity, including but not limited to analyzing transaction patterns, load volumes, communication metadata, and booking frequency between Users.</p>
        <p><strong className="text-white">4.5 Remedies for Circumvention.</strong> In the event of a breach of this Section 4, {COMPANY_NAME} shall be entitled to, without limitation:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">(a)</strong> Immediate suspension or permanent termination of your account;</li>
          <li><strong className="text-white">(b)</strong> Recovery of all fees, commissions, and revenue that would have been earned by {COMPANY_NAME} had the circumvented transactions been conducted through the Platform, plus a penalty equal to two times (2x) the estimated lost revenue ("Circumvention Fee");</li>
          <li><strong className="text-white">(c)</strong> Recovery of all costs and attorneys' fees incurred in enforcing this provision;</li>
          <li><strong className="text-white">(d)</strong> Injunctive relief, including temporary restraining orders and preliminary and permanent injunctions, without the necessity of proving actual damages or posting a bond, as circumvention would cause irreparable harm for which monetary damages are inadequate;</li>
          <li><strong className="text-white">(e)</strong> Forfeiture of any outstanding payments, credits, rewards, or balances in your Platform accounts;</li>
          <li><strong className="text-white">(f)</strong> Reporting to applicable regulatory authorities if circumvention involves regulatory violations (e.g., operating without authority, insurance fraud, or safety violations).</li>
        </ul>
        <p><strong className="text-white">4.6 Liquidated Damages.</strong> You agree that the Circumvention Fee described in Section 4.5(b) constitutes a reasonable estimate of the damages that would be incurred by {COMPANY_NAME} in the event of circumvention and is not a penalty. You acknowledge that actual damages would be difficult to calculate and that this liquidated damages provision is fair and reasonable.</p>
        <p><strong className="text-white">4.7 Reporting Obligation.</strong> If you become aware of any other User attempting to circumvent these Terms, you have an affirmative obligation to report such activity to {COMPANY_NAME} through the Platform's reporting mechanisms.</p>
      </div>
    ),
  },
  {
    id: "fees-payments",
    title: "5. Fees, Payments & Financial Terms",
    icon: <DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">5.1 Platform Fees.</strong> {COMPANY_NAME} charges fees for use of the Platform, which may include transaction fees, subscription fees, listing fees, premium feature fees, factoring fees, and/or commissions on loads booked through the Platform. Current fee schedules are available in the Platform and may be updated from time to time with 30 days' notice.</p>
        <p><strong className="text-white">5.2 Payment Obligations.</strong> All fees are non-refundable except as expressly stated. You authorize {COMPANY_NAME} to charge fees to your designated payment method. Late payments accrue interest at the lesser of 1.5% per month or the maximum rate permitted by law.</p>
        <p><strong className="text-white">5.3 Escrow & Payment Processing.</strong> When the Platform facilitates payments between Users (e.g., freight charges from Shippers to Carriers), {COMPANY_NAME} may hold funds in escrow until delivery confirmation. {COMPANY_NAME} is not liable for disputes between Users regarding payment amounts, freight charges, accessorial charges, or detention/demurrage fees.</p>
        <p><strong className="text-white">5.4 Factoring.</strong> If you use the Platform's factoring services, separate factoring terms and a notice of assignment will govern those transactions. Factoring rates, advance percentages, and reserve amounts will be disclosed prior to activation.</p>
        <p><strong className="text-white">5.5 Taxes.</strong> You are solely responsible for all applicable federal, state, and local taxes arising from your use of the Platform and your transportation operations. {COMPANY_NAME} may issue 1099 forms as required by law.</p>
        <p><strong className="text-white">5.6 Chargebacks & Disputes.</strong> Unauthorized chargebacks or payment reversals may result in account suspension, collections action, and/or reporting to credit bureaus. Payment disputes must be submitted through the Platform's dispute resolution process within 30 days of the transaction.</p>
      </div>
    ),
  },
  {
    id: "user-conduct",
    title: "6. User Conduct & Prohibited Activities",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    content: (
      <div className="space-y-3">
        <p>You agree not to, and shall not permit any third party to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Platform for any unlawful purpose or in violation of any federal, state, or local law or regulation</li>
          <li>Provide false, inaccurate, or misleading information in connection with your account, loads, bids, credentials, or any other Platform feature</li>
          <li>Operate a commercial motor vehicle without valid operating authority, insurance, or driver qualifications as required by FMCSA regulations</li>
          <li>Transport hazardous materials without proper placarding, shipping papers, training (per 49 CFR 172 Subpart H), or endorsements</li>
          <li>Violate Hours of Service regulations (49 CFR Part 395), falsify ELD records, or encourage or coerce any driver to violate HOS rules</li>
          <li>Engage in double brokering (re-brokering loads without authorization) in violation of 49 CFR 371.3</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity</li>
          <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Platform's servers, networks, or infrastructure</li>
          <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Platform</li>
          <li>Use automated scripts, bots, crawlers, or scraping tools to collect data from the Platform</li>
          <li>Manipulate bidding, ratings, reviews, or any other marketplace mechanism</li>
          <li>Harass, threaten, discriminate against, or defame any other User</li>
          <li>Post or transmit any content that is obscene, defamatory, or infringes on any intellectual property right</li>
          <li>Engage in or facilitate cargo theft, insurance fraud, identity fraud, or any other criminal activity</li>
          <li>Use the Platform to facilitate human trafficking, smuggling, or transport of illegal substances</li>
          <li>Collude with other Users to fix prices, allocate markets, or engage in any antitrust violation</li>
        </ul>
      </div>
    ),
  },
  {
    id: "regulatory-compliance",
    title: "7. Regulatory Compliance & Safety Obligations",
    icon: <Shield className="w-5 h-5 text-cyan-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">7.1 General Compliance.</strong> Each User is independently responsible for complying with all applicable federal, state, local, and international laws and regulations governing their operations, including but not limited to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Federal Motor Carrier Safety Act and FMCSRs (49 CFR Parts 350-399)</li>
          <li>Hazardous Materials Transportation Act (49 U.S.C. 5101-5128) and PHMSA regulations (49 CFR Parts 100-185)</li>
          <li>OSHA standards (29 CFR Part 1910 and 1926)</li>
          <li>EPA regulations including RCRA, CERCLA, Clean Water Act, and Clean Air Act</li>
          <li>TSA Transportation Worker Identification Credential (TWIC) requirements (49 CFR Part 1572)</li>
          <li>Drug and alcohol testing requirements (49 CFR Part 382 and Part 40)</li>
          <li>Commercial Driver's License standards (49 CFR Part 383)</li>
          <li>State oversize/overweight permit requirements</li>
          <li>International trade and customs regulations (if applicable)</li>
        </ul>
        <p><strong className="text-white">7.2 Insurance Requirements.</strong> All Carriers and Drivers must maintain minimum insurance coverage as required by 49 CFR Part 387 and as specified during registration. Proof of insurance must be kept current on the Platform. Lapse of insurance results in automatic account suspension.</p>
        <p><strong className="text-white">7.3 Safety Reporting.</strong> Users must promptly report through the Platform any accidents, spills, releases, security incidents, or near-misses occurring in connection with Platform-facilitated transportation. Failure to report required incidents may result in account suspension and regulatory referral.</p>
        <p><strong className="text-white">7.4 No Coercion.</strong> No User shall use the Platform to coerce any driver to operate a vehicle in violation of safety regulations, including HOS rules, vehicle inspection requirements, or hazardous materials handling procedures (per 49 CFR 390.6).</p>
      </div>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property Rights",
    icon: <Lock className="w-5 h-5 text-indigo-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">8.1 Platform Ownership.</strong> The Platform, including all software, algorithms, designs, text, graphics, logos, icons, images, audio clips, data compilations, APIs, and all other content and materials (collectively, "Platform IP"), is the exclusive property of {COMPANY_NAME} or its licensors and is protected by U.S. and international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
        <p><strong className="text-white">8.2 Limited License.</strong> Subject to your compliance with these Terms, {COMPANY_NAME} grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for your internal business purposes in connection with transportation and logistics operations.</p>
        <p><strong className="text-white">8.3 Restrictions.</strong> You may not: (a) copy, modify, or create derivative works of the Platform IP; (b) license, sublicense, sell, resell, transfer, or distribute the Platform or any Platform IP; (c) use {COMPANY_NAME} or {PLATFORM_NAME} trademarks without prior written consent; (d) use any data mining, robots, or similar data gathering and extraction tools on the Platform.</p>
        <p><strong className="text-white">8.4 User Content.</strong> You retain ownership of content you upload to the Platform ("User Content"). By uploading User Content, you grant {COMPANY_NAME} a worldwide, royalty-free, non-exclusive license to use, reproduce, modify, and display such content solely for the purpose of operating and improving the Platform.</p>
        <p><strong className="text-white">8.5 Feedback.</strong> Any suggestions, ideas, or feedback you provide regarding the Platform become the property of {COMPANY_NAME} and may be used without obligation or compensation to you.</p>
      </div>
    ),
  },
  {
    id: "data-confidentiality",
    title: "9. Confidentiality & Data Use",
    icon: <Eye className="w-5 h-5 text-violet-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">9.1 Confidential Information.</strong> All non-public information obtained through the Platform, including but not limited to rate information, lane data, shipper identities, carrier capacities, driver information, load details, financial terms, and business strategies, constitutes "Confidential Information." You agree not to disclose Confidential Information to any third party or use it for any purpose other than conducting transactions through the Platform.</p>
        <p><strong className="text-white">9.2 Data Aggregation.</strong> {COMPANY_NAME} may aggregate and anonymize data from Platform usage for purposes of analytics, benchmarking, market insights, and Platform improvement. Aggregated data will not identify individual Users.</p>
        <p><strong className="text-white">9.3 Regulatory Disclosure.</strong> Notwithstanding the foregoing, {COMPANY_NAME} may disclose User information as required by law, regulation, subpoena, court order, or government investigation, including to FMCSA, PHMSA, DOT, EPA, OSHA, TSA, law enforcement, or other regulatory authorities.</p>
        <p><strong className="text-white">9.4 Data Security.</strong> We implement industry-standard security measures to protect your data. However, no electronic transmission or storage method is 100% secure. See our Privacy Policy for detailed information on our data handling practices.</p>
      </div>
    ),
  },
  {
    id: "disclaimers",
    title: "10. Disclaimers & Limitation of Liability",
    icon: <CircleAlert className="w-5 h-5 text-orange-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">10.1 "AS IS" Disclaimer.</strong> THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. {COMPANY_NAME.toUpperCase()} DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
        <p><strong className="text-white">10.2 No Guarantee of Results.</strong> {COMPANY_NAME} does not guarantee: (a) that you will find loads, carriers, drivers, or other business opportunities through the Platform; (b) the accuracy, reliability, or completeness of any information provided by other Users; (c) the creditworthiness, safety record, or regulatory compliance of any User; (d) the condition, quality, legality, or safety of any cargo, vehicle, or service.</p>
        <p><strong className="text-white">10.3 Limitation of Liability.</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY_NAME.toUpperCase()}, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, SUCCESSORS, OR ASSIGNS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE), EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
        <p><strong className="text-white">10.4 Cap on Liability.</strong> {COMPANY_NAME.toUpperCase()}'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO {COMPANY_NAME.toUpperCase()} DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE THOUSAND DOLLARS ($1,000).</p>
        <p><strong className="text-white">10.5 Basis of the Bargain.</strong> You acknowledge that {COMPANY_NAME} has set its prices and entered into this agreement in reliance on the limitations of liability set forth herein, which allocate risk between you and {COMPANY_NAME} and form an essential basis of the bargain between the parties.</p>
      </div>
    ),
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    icon: <Scale className="w-5 h-5 text-pink-400" />,
    content: (
      <div className="space-y-3">
        <p>You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers, directors, employees, agents, affiliates, successors, and assigns (collectively, "Indemnified Parties") from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or relating to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your use of or inability to use the Platform</li>
          <li>Your violation of these Terms or any applicable law or regulation</li>
          <li>Your violation of any rights of any third party, including intellectual property rights</li>
          <li>Any transportation services you provide or receive through the Platform</li>
          <li>Any accident, injury, death, environmental contamination, property damage, or cargo loss/damage occurring in connection with your operations</li>
          <li>Your breach of the anti-circumvention provisions of Section 4</li>
          <li>Any fines, penalties, or sanctions imposed by any regulatory authority in connection with your operations</li>
          <li>Any content you post or transmit through the Platform</li>
          <li>Any tax liability, including employment tax reclassification claims</li>
        </ul>
        <p>This indemnification obligation survives termination of your account and these Terms.</p>
      </div>
    ),
  },
  {
    id: "dispute-resolution",
    title: "12. Dispute Resolution, Arbitration & Governing Law",
    icon: <Gavel className="w-5 h-5 text-rose-400" />,
    highlight: true,
    content: (
      <div className="space-y-3">
        <p className="text-amber-300 font-semibold">THIS SECTION CONTAINS A BINDING ARBITRATION CLAUSE AND CLASS ACTION WAIVER. PLEASE READ CAREFULLY.</p>
        <p><strong className="text-white">12.1 Governing Law.</strong> These Terms are governed by and construed in accordance with the laws of the State of {COMPANY_STATE}, without regard to its conflict of law provisions. For any disputes not subject to arbitration, you consent to the exclusive jurisdiction of the state and federal courts located in {COMPANY_JURISDICTION}.</p>
        <p><strong className="text-white">12.2 Mandatory Arbitration.</strong> Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be finally settled by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitration shall be conducted in {COMPANY_JURISDICTION} before a single arbitrator with experience in transportation or technology disputes. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>
        <p><strong className="text-white">12.3 Class Action Waiver.</strong> YOU AND {COMPANY_NAME.toUpperCase()} AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU EXPRESSLY WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.</p>
        <p><strong className="text-white">12.4 Small Claims Exception.</strong> Either party may bring an individual action in small claims court for disputes within the court's jurisdictional limit.</p>
        <p><strong className="text-white">12.5 Injunctive Relief Exception.</strong> Notwithstanding the arbitration requirement, either party may seek injunctive or equitable relief in any court of competent jurisdiction to prevent actual or threatened infringement of intellectual property rights or violation of the anti-circumvention provisions of Section 4.</p>
        <p><strong className="text-white">12.6 Statute of Limitations.</strong> Any claim arising out of or related to these Terms must be filed within one (1) year after the cause of action accrues or be permanently barred.</p>
      </div>
    ),
  },
  {
    id: "termination",
    title: "13. Termination & Suspension",
    icon: <Ban className="w-5 h-5 text-red-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">13.1 Termination by You.</strong> You may terminate your account at any time by providing written notice through the Platform. Outstanding obligations, including unpaid fees, pending transactions, and active loads, must be settled before termination takes effect.</p>
        <p><strong className="text-white">13.2 Termination by Us.</strong> {COMPANY_NAME} may suspend or terminate your account at any time, with or without cause and with or without notice, including for: (a) violation of these Terms; (b) fraudulent, illegal, or harmful activity; (c) lapse of required credentials or insurance; (d) failure to pay fees; (e) circumvention of Platform fees (Section 4); (f) safety concerns; (g) regulatory non-compliance; or (h) extended account inactivity.</p>
        <p><strong className="text-white">13.3 Effect of Termination.</strong> Upon termination: (a) your license to use the Platform immediately ceases; (b) you must stop using the Platform and delete any downloaded Platform content; (c) {COMPANY_NAME} may retain your data as required by law and for legitimate business purposes; (d) Sections 4, 5, 8, 9, 10, 11, 12, 13.3, 14, and 15 survive termination.</p>
        <p><strong className="text-white">13.4 No Liability for Termination.</strong> {COMPANY_NAME} shall not be liable to you or any third party for any suspension or termination of your account or access to the Platform.</p>
      </div>
    ),
  },
  {
    id: "independent-contractors",
    title: "14. Independent Contractor Relationship",
    icon: <Building2 className="w-5 h-5 text-teal-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">14.1 No Employment Relationship.</strong> Users of the Platform are independent contractors and not employees, agents, joint venturers, or partners of {COMPANY_NAME}. Nothing in these Terms creates an employer-employee relationship between {COMPANY_NAME} and any User, including Drivers, Carriers, or Dispatchers.</p>
        <p><strong className="text-white">14.2 No Authority to Bind.</strong> No User has the authority to bind {COMPANY_NAME} to any contract, obligation, or liability. Users shall not represent themselves as employees or agents of {COMPANY_NAME}.</p>
        <p><strong className="text-white">14.3 Tax Responsibility.</strong> Each User is solely responsible for their own tax obligations, including income taxes, self-employment taxes, sales taxes, fuel taxes (IFTA), and any other applicable taxes. {COMPANY_NAME} does not withhold taxes on behalf of Users.</p>
        <p><strong className="text-white">14.4 Benefits.</strong> Users are not entitled to any employee benefits from {COMPANY_NAME}, including but not limited to health insurance, retirement benefits, workers' compensation, unemployment insurance, or paid time off.</p>
      </div>
    ),
  },
  {
    id: "general",
    title: "15. General Provisions",
    icon: <BookOpen className="w-5 h-5 text-slate-400" />,
    content: (
      <div className="space-y-3">
        <p><strong className="text-white">15.1 Entire Agreement.</strong> These Terms, together with the Privacy Policy and any additional terms or policies referenced herein, constitute the entire agreement between you and {COMPANY_NAME} regarding the Platform and supersede all prior agreements and understandings.</p>
        <p><strong className="text-white">15.2 Severability.</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.</p>
        <p><strong className="text-white">15.3 Waiver.</strong> The failure of {COMPANY_NAME} to enforce any provision of these Terms shall not constitute a waiver of that provision or any other provision.</p>
        <p><strong className="text-white">15.4 Assignment.</strong> You may not assign or transfer these Terms or any rights hereunder without {COMPANY_NAME}'s prior written consent. {COMPANY_NAME} may freely assign these Terms.</p>
        <p><strong className="text-white">15.5 Force Majeure.</strong> {COMPANY_NAME} shall not be liable for any delay or failure in performance resulting from causes beyond its reasonable control, including acts of God, natural disasters, pandemics, war, terrorism, government actions, civil unrest, power outages, internet failures, or labor disputes.</p>
        <p><strong className="text-white">15.6 Notices.</strong> All legal notices to {COMPANY_NAME} must be sent to: {CONTACT_EMAIL} or by certified mail to our registered address. Notices to you may be sent to the email address associated with your account.</p>
        <p><strong className="text-white">15.7 Headings.</strong> Section headings are for convenience only and shall not affect the interpretation of these Terms.</p>
        <p><strong className="text-white">15.8 No Third-Party Beneficiaries.</strong> These Terms do not confer any rights on any third party.</p>
      </div>
    ),
  },
];

export default function TermsOfService() {
  const [, navigate] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["acceptance"]));
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
    setExpandedSections(new Set(TERMS_SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      {/* Top Navigation */}
      <div className={`sticky top-0 z-10 backdrop-blur-lg border-b ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/90 border-slate-700/50'}`}>
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
              className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 ${isLight ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-2">
            Terms of Service
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

        {/* Binding Notice */}
        <Card className={`rounded-xl mb-6 ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <div>
                <p className={`font-semibold text-sm ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>LEGALLY BINDING AGREEMENT</p>
                <p className={`text-sm mt-1 ${isLight ? 'text-amber-600/80' : 'text-amber-200/80'}`}>
                  These Terms of Service constitute a legally binding contract between you and {COMPANY_NAME}. By using {PLATFORM_NAME}, you agree to be bound by these Terms, including the mandatory arbitration clause, class action waiver, and anti-circumvention provisions. If you do not agree, do not use the Platform.
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
          {TERMS_SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <Card
                key={section.id}
                className={`rounded-xl transition-colors ${
                  section.highlight
                    ? (isLight ? 'bg-white border-amber-300 shadow-sm' : 'bg-slate-800/70 border-amber-500/30')
                    : (isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50')
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors rounded-xl ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/30'}`}
                >
                  {section.icon}
                  <span className={`flex-1 font-semibold text-sm md:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {section.title}
                  </span>
                  {section.highlight && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mr-2">
                      IMPORTANT
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
                    <div className={`text-sm leading-relaxed border-t pt-4 ${isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'}`}>
                      {section.content}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Contact */}
        <Card className={`rounded-xl mt-8 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Questions About These Terms?</p>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Contact our Legal Department at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Data Protection Officer:{" "}
                  <a href={`mailto:${DPO_EMAIL}`} className="text-blue-400 hover:underline">
                    {DPO_EMAIL}
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
