/**
 * DOCUMENT CENTER — Shared Types
 * Used by both frontend and backend
 */

export type DocumentCategory =
  | 'CDL' | 'DOT' | 'HAZ' | 'INS' | 'TAX'
  | 'EMP' | 'VEH' | 'SAF' | 'OPS' | 'AUT'
  | 'COM' | 'LEG' | 'STATE';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADING'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXPIRING_SOON'
  | 'SUPERSEDED'
  | 'NOT_APPLICABLE'
  | 'WAIVED';

export interface DocumentCenterData {
  summary: {
    complianceScore: number;
    canOperate: boolean;
    totalRequired: number;
    totalCompleted: number;
    totalMissing: number;
    totalExpiring: number;
    totalIssues: number;
  };
  urgentActions: UrgentAction[];
  documents: {
    all: DocumentRequirementStatus[];
    missing: DocumentRequirementStatus[];
    expiring: DocumentRequirementStatus[];
    expired: DocumentRequirementStatus[];
    pending: DocumentRequirementStatus[];
    rejected: DocumentRequirementStatus[];
    verified: DocumentRequirementStatus[];
  };
  nextExpiration: {
    date: string;
    documentTypeId: string;
  } | null;
  hasBlockingIssues: boolean;
  calculatedAt: Date;
}

export interface DocumentRequirementStatus {
  documentTypeId: string;
  documentTypeName: string;
  category: string;
  isRequired: boolean;
  isBlocking: boolean;
  priority: number;
  requirementReason: string;
  status: DocumentStatus;
  currentDocumentId: number | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  uploadedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  actionRequired: 'UPLOAD' | 'RENEW' | 'RESUBMIT' | 'NONE';
  actionUrl: string;
  downloadTemplateUrl: string | null;
}

export interface UrgentAction {
  documentTypeId: string;
  documentTypeName: string;
  actionType: 'UPLOAD_MISSING' | 'RENEW_EXPIRING' | 'FIX_REJECTED' | 'REVIEW_EXPIRED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  dueDate: string | null;
  blocksOperations: boolean;
}

export function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'VERIFIED': return 'green';
    case 'PENDING_REVIEW': return 'blue';
    case 'NOT_UPLOADED': return 'gray';
    case 'EXPIRING_SOON': return 'yellow';
    case 'EXPIRED': return 'red';
    case 'REJECTED': return 'red';
    default: return 'gray';
  }
}

export function getStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'VERIFIED': return 'Verified';
    case 'PENDING_REVIEW': return 'Pending Review';
    case 'NOT_UPLOADED': return 'Not Uploaded';
    case 'EXPIRING_SOON': return 'Expiring Soon';
    case 'EXPIRED': return 'Expired';
    case 'REJECTED': return 'Rejected';
    case 'UPLOADING': return 'Uploading...';
    case 'WAIVED': return 'Waived';
    case 'NOT_APPLICABLE': return 'N/A';
    default: return status;
  }
}

export function getCategoryLabel(category: DocumentCategory): string {
  const labels: Record<DocumentCategory, string> = {
    CDL: 'Driver License',
    DOT: 'DOT/FMCSA',
    HAZ: 'Hazmat',
    INS: 'Insurance',
    TAX: 'Tax Forms',
    EMP: 'Employment',
    VEH: 'Vehicle',
    SAF: 'Safety',
    OPS: 'Operations',
    AUT: 'Authority',
    COM: 'Compliance',
    LEG: 'Legal',
    STATE: 'State-Specific',
  };
  return labels[category] || category;
}

export function getSeverityColor(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (severity) {
    case 'CRITICAL': return 'red';
    case 'HIGH': return 'orange';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'blue';
  }
}
