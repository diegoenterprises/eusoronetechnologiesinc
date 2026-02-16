/**
 * APPROVAL GATING SYSTEM
 * Controls which features are accessible before admin approval.
 * 
 * Status flow: PENDING_REVIEW -> APPROVED (or SUSPENDED)
 * 
 * PENDING_REVIEW users CAN access:
 *   Dashboard (read-only widgets), Profile, Settings, Messages,
 *   News, Support, Company Channels, Notifications, Company
 * 
 * PENDING_REVIEW users CANNOT access:
 *   Loads, Marketplace, Bidding, ESANG AI, Wallet/Billing,
 *   Fleet Management, Agreements, Analytics, Create Load, Documents,
 *   The Haul, Leaderboard, Rewards, Missions
 */

export type ApprovalStatus = "pending_review" | "approved" | "suspended";

/**
 * Paths that are ALWAYS accessible regardless of approval status.
 * Everything else requires approval.
 */
const ALWAYS_ACCESSIBLE_PATHS = new Set([
  "/",                  // Dashboard (shows limited widgets when pending)
  "/profile",
  "/settings",
  "/messages",
  "/news",
  "/support",
  "/company-channels",
  "/notifications",
  "/company",
  "/account-status",
]);

/**
 * Path prefixes that are always accessible
 */
const ALWAYS_ACCESSIBLE_PREFIXES = [
  "/admin",        // Admins/Super Admins are always approved
  "/super-admin",  // Super Admins are always approved
  "/factoring",    // Factoring has its own vetting
];

/**
 * Roles that bypass approval gating entirely (always approved)
 */
const BYPASS_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
]);

/**
 * Extract approval status from user metadata
 */
export function getApprovalStatus(user: any): ApprovalStatus {
  if (!user) return "pending_review";
  
  // Admin/Super Admin always approved
  if (BYPASS_ROLES.has(user.role)) return "approved";
  
  // Check metadata for explicit approval status
  if (user.metadata) {
    try {
      const meta = typeof user.metadata === "string" ? JSON.parse(user.metadata) : user.metadata;
      if (meta.approvalStatus) return meta.approvalStatus as ApprovalStatus;
    } catch {}
  }
  
  // If user is verified (legacy), treat as approved
  if (user.isVerified === true) return "approved";
  
  // Default: pending review
  return "pending_review";
}

/**
 * Check if a specific path requires approval
 */
export function pathRequiresApproval(path: string): boolean {
  // Exact match on always-accessible
  if (ALWAYS_ACCESSIBLE_PATHS.has(path)) return false;
  
  // Prefix match
  for (const prefix of ALWAYS_ACCESSIBLE_PREFIXES) {
    if (path.startsWith(prefix)) return false;
  }
  
  return true;
}

/**
 * Check if a user can access a specific path
 */
export function canAccessPath(user: any, path: string): boolean {
  const status = getApprovalStatus(user);
  if (status === "approved") return true;
  if (status === "suspended") return !pathRequiresApproval(path);
  // pending_review
  return !pathRequiresApproval(path);
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "pending_review": return "Pending Review";
    case "approved": return "Approved";
    case "suspended": return "Suspended";
    default: return "Unknown";
  }
}

/**
 * Get checklist items for a role's approval process
 */
export function getApprovalChecklist(role: string): { label: string; key: string }[] {
  const base = [
    { label: "Account created", key: "account_created" },
    { label: "Email verified", key: "email_verified" },
  ];
  
  switch (role) {
    case "SHIPPER":
      return [...base,
        { label: "Company information verified", key: "company_verified" },
        { label: "EIN validated", key: "ein_validated" },
        { label: "Insurance documentation reviewed", key: "insurance_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "CATALYST":
      return [...base,
        { label: "USDOT number verified via FMCSA", key: "usdot_verified" },
        { label: "MC authority confirmed", key: "mc_verified" },
        { label: "Insurance coverage confirmed", key: "insurance_reviewed" },
        { label: "Safety rating reviewed", key: "safety_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "DRIVER":
      return [...base,
        { label: "CDL verified", key: "cdl_verified" },
        { label: "Medical card valid", key: "medical_verified" },
        { label: "Background check cleared", key: "background_check" },
        { label: "Drug test cleared", key: "drug_test" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "BROKER":
      return [...base,
        { label: "MC number verified", key: "mc_verified" },
        { label: "Surety bond confirmed", key: "bond_verified" },
        { label: "Insurance reviewed", key: "insurance_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "DISPATCH":
      return [...base,
        { label: "Employer verified", key: "employer_verified" },
        { label: "Certifications reviewed", key: "certs_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "ESCORT":
      return [...base,
        { label: "Driver license verified", key: "license_verified" },
        { label: "State certifications confirmed", key: "state_certs" },
        { label: "Vehicle insurance reviewed", key: "insurance_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "TERMINAL_MANAGER":
      return [...base,
        { label: "Facility verified", key: "facility_verified" },
        { label: "EPA ID confirmed", key: "epa_verified" },
        { label: "OSHA compliance reviewed", key: "osha_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "FACTORING":
      return [...base,
        { label: "Company information verified", key: "company_verified" },
        { label: "EIN validated", key: "ein_validated" },
        { label: "State licensing confirmed", key: "state_license" },
        { label: "Surety bond or insurance reviewed", key: "bond_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    case "COMPLIANCE_OFFICER":
    case "SAFETY_MANAGER":
      return [...base,
        { label: "Employer verified", key: "employer_verified" },
        { label: "Certifications reviewed", key: "certs_reviewed" },
        { label: "Admin approval", key: "admin_approved" },
      ];
    default:
      return [...base, { label: "Admin approval", key: "admin_approved" }];
  }
}
