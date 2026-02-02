/**
 * DIGITAL SIGNATURE SERVICE
 * Addresses GAP-002: Digital signature integration
 * 
 * Provides electronic signature capabilities for:
 * - Bills of Lading (BOL)
 * - Rate Confirmations
 * - Delivery Receipts (POD)
 * - Contracts and Agreements
 * - Driver Documents
 */

import crypto from "crypto";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SignatureType = "click_to_sign" | "typed" | "drawn" | "uploaded";
export type DocumentType = "bol" | "rate_confirmation" | "pod" | "contract" | "agreement" | "dq_file" | "other";
export type SignatureStatus = "pending" | "signed" | "declined" | "expired" | "voided";

export interface SignatureRequest {
  requestId: string;
  documentId: string;
  documentType: DocumentType;
  documentName: string;
  documentUrl?: string;
  
  // Signers
  signers: SignerInfo[];
  
  // Settings
  expiresAt: string;
  reminderEnabled: boolean;
  reminderFrequency?: "daily" | "weekly";
  
  // Status
  status: SignatureStatus;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
}

export interface SignerInfo {
  signerId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  order: number;
  status: SignatureStatus;
  signedAt?: string;
  signature?: SignatureData;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignatureData {
  type: SignatureType;
  data: string; // Base64 for drawn/uploaded, text for typed
  timestamp: string;
  hash: string;
  certificate?: string;
}

export interface SignedDocument {
  documentId: string;
  originalDocumentHash: string;
  signedDocumentUrl?: string;
  signatures: {
    signerId: string;
    signerName: string;
    signerRole: string;
    signedAt: string;
    signatureHash: string;
  }[];
  auditTrail: AuditEntry[];
  completedAt: string;
  certificateOfCompletion?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface SignatureVerification {
  isValid: boolean;
  signedAt: string;
  signerName: string;
  documentHash: string;
  certificateValid: boolean;
  tamperedDetected: boolean;
}

// ============================================================================
// SIGNATURE SERVICE
// ============================================================================

class SignatureService {
  private requestCounter: number = 1000;

  /**
   * Generate request ID
   */
  generateRequestId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const seq = (++this.requestCounter).toString().padStart(6, "0");
    return `SIG-${year}${month}-${seq}`;
  }

  /**
   * Create a new signature request
   */
  async createSignatureRequest(
    documentId: string,
    documentType: DocumentType,
    documentName: string,
    signers: Omit<SignerInfo, "signerId" | "status" | "signature">[],
    options: {
      expiresInDays?: number;
      reminderEnabled?: boolean;
      reminderFrequency?: "daily" | "weekly";
      documentUrl?: string;
    },
    createdBy: string
  ): Promise<SignatureRequest> {
    const requestId = this.generateRequestId();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (options.expiresInDays || 7));

    const signerInfos: SignerInfo[] = signers.map((s, index) => ({
      ...s,
      signerId: `signer_${requestId}_${index + 1}`,
      status: "pending" as SignatureStatus,
      order: s.order || index + 1,
    }));

    return {
      requestId,
      documentId,
      documentType,
      documentName,
      documentUrl: options.documentUrl,
      signers: signerInfos,
      expiresAt: expiresAt.toISOString(),
      reminderEnabled: options.reminderEnabled || false,
      reminderFrequency: options.reminderFrequency,
      status: "pending",
      createdAt: now.toISOString(),
      createdBy,
    };
  }

  /**
   * Sign a document
   */
  async signDocument(
    request: SignatureRequest,
    signerId: string,
    signatureType: SignatureType,
    signatureData: string,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ success: boolean; request: SignatureRequest; error?: string }> {
    // Find the signer
    const signerIndex = request.signers.findIndex((s) => s.signerId === signerId);
    if (signerIndex === -1) {
      return { success: false, request, error: "Signer not found" };
    }

    const signer = request.signers[signerIndex];

    // Check if already signed
    if (signer.status === "signed") {
      return { success: false, request, error: "Document already signed by this signer" };
    }

    // Check if expired
    if (new Date() > new Date(request.expiresAt)) {
      return { success: false, request, error: "Signature request has expired" };
    }

    // Check signing order
    const previousSigners = request.signers.filter((s) => s.order < signer.order);
    const allPreviousSigned = previousSigners.every((s) => s.status === "signed");
    if (!allPreviousSigned) {
      return { success: false, request, error: "Previous signers must sign first" };
    }

    // Create signature hash
    const signatureHash = this.createSignatureHash(
      signatureData,
      signerId,
      request.documentId,
      new Date().toISOString()
    );

    // Update signer
    const now = new Date().toISOString();
    request.signers[signerIndex] = {
      ...signer,
      status: "signed",
      signedAt: now,
      signature: {
        type: signatureType,
        data: signatureData,
        timestamp: now,
        hash: signatureHash,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    };

    // Check if all signers have signed
    const allSigned = request.signers.every((s) => s.status === "signed");
    if (allSigned) {
      request.status = "signed";
      request.completedAt = now;
    }

    return { success: true, request };
  }

  /**
   * Decline to sign
   */
  async declineSignature(
    request: SignatureRequest,
    signerId: string,
    reason?: string
  ): Promise<SignatureRequest> {
    const signerIndex = request.signers.findIndex((s) => s.signerId === signerId);
    if (signerIndex !== -1) {
      request.signers[signerIndex].status = "declined";
      request.status = "declined";
    }
    return request;
  }

  /**
   * Void a signature request
   */
  async voidRequest(request: SignatureRequest, reason?: string): Promise<SignatureRequest> {
    request.status = "voided";
    return request;
  }

  /**
   * Create signature hash
   */
  private createSignatureHash(
    signatureData: string,
    signerId: string,
    documentId: string,
    timestamp: string
  ): string {
    const data = `${signatureData}|${signerId}|${documentId}|${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Verify a signature
   */
  verifySignature(
    signature: SignatureData,
    signerId: string,
    documentId: string
  ): SignatureVerification {
    const expectedHash = this.createSignatureHash(
      signature.data,
      signerId,
      documentId,
      signature.timestamp
    );

    const isValid = expectedHash === signature.hash;

    return {
      isValid,
      signedAt: signature.timestamp,
      signerName: signerId,
      documentHash: signature.hash,
      certificateValid: true,
      tamperedDetected: !isValid,
    };
  }

  /**
   * Generate audit trail
   */
  generateAuditTrail(request: SignatureRequest): AuditEntry[] {
    const trail: AuditEntry[] = [];

    // Document created
    trail.push({
      timestamp: request.createdAt,
      action: "Document created and sent for signature",
      actor: request.createdBy,
    });

    // Each signer action
    for (const signer of request.signers) {
      if (signer.signedAt) {
        trail.push({
          timestamp: signer.signedAt,
          action: `Document signed by ${signer.name} (${signer.role})`,
          actor: signer.name,
          actorEmail: signer.email,
          ipAddress: signer.ipAddress,
          userAgent: signer.userAgent,
        });
      } else if (signer.status === "declined") {
        trail.push({
          timestamp: new Date().toISOString(),
          action: `Signature declined by ${signer.name}`,
          actor: signer.name,
          actorEmail: signer.email,
        });
      }
    }

    // Completion
    if (request.completedAt) {
      trail.push({
        timestamp: request.completedAt,
        action: "All signatures collected - Document completed",
        actor: "System",
      });
    }

    return trail.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Generate certificate of completion HTML
   */
  generateCertificateHTML(request: SignatureRequest): string {
    const auditTrail = this.generateAuditTrail(request);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion - ${request.requestId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .title { font-size: 18pt; font-weight: bold; color: #1a5f2a; }
    .subtitle { font-size: 12pt; color: #666; margin-top: 10px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; font-size: 12pt; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
    .info-row { display: flex; margin-bottom: 5px; }
    .info-label { width: 150px; font-weight: bold; }
    .info-value { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .signature-box { border: 1px solid #ddd; padding: 10px; margin: 10px 0; background: #fafafa; }
    .checkmark { color: #1a5f2a; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 8pt; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">CERTIFICATE OF COMPLETION</div>
    <div class="subtitle">Electronic Signature Verification</div>
  </div>

  <div class="section">
    <div class="section-title">Document Information</div>
    <div class="info-row">
      <span class="info-label">Request ID:</span>
      <span class="info-value">${request.requestId}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Document:</span>
      <span class="info-value">${request.documentName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Document Type:</span>
      <span class="info-value">${request.documentType.toUpperCase()}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status:</span>
      <span class="info-value checkmark">✓ COMPLETED</span>
    </div>
    <div class="info-row">
      <span class="info-label">Completed:</span>
      <span class="info-value">${request.completedAt ? new Date(request.completedAt).toLocaleString() : "N/A"}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Signers</div>
    ${request.signers.map(signer => `
      <div class="signature-box">
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${signer.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${signer.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Role:</span>
          <span class="info-value">${signer.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Signed:</span>
          <span class="info-value">${signer.signedAt ? new Date(signer.signedAt).toLocaleString() : "Pending"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">IP Address:</span>
          <span class="info-value">${signer.ipAddress || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Signature Hash:</span>
          <span class="info-value" style="font-family: monospace; font-size: 8pt;">${signer.signature?.hash || "N/A"}</span>
        </div>
      </div>
    `).join("")}
  </div>

  <div class="section">
    <div class="section-title">Audit Trail</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Actor</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>
        ${auditTrail.map(entry => `
          <tr>
            <td>${new Date(entry.timestamp).toLocaleString()}</td>
            <td>${entry.action}</td>
            <td>${entry.actor}${entry.actorEmail ? ` (${entry.actorEmail})` : ""}</td>
            <td>${entry.ipAddress || "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This certificate confirms that the document was signed electronically through the EusoTrip platform.</p>
    <p>All electronic signatures are legally binding under the ESIGN Act and UETA.</p>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Create quick signature for BOL
   */
  async createBOLSignatureRequest(
    bolNumber: string,
    shipper: { name: string; email: string },
    carrier: { name: string; email: string },
    consignee: { name: string; email: string },
    createdBy: string
  ): Promise<SignatureRequest> {
    return this.createSignatureRequest(
      bolNumber,
      "bol",
      `Bill of Lading - ${bolNumber}`,
      [
        { name: shipper.name, email: shipper.email, role: "Shipper", order: 1 },
        { name: carrier.name, email: carrier.email, role: "Carrier", order: 2 },
        { name: consignee.name, email: consignee.email, role: "Consignee", order: 3 },
      ],
      { expiresInDays: 30, reminderEnabled: true, reminderFrequency: "daily" },
      createdBy
    );
  }

  /**
   * Create quick signature for Rate Confirmation
   */
  async createRateConfirmationRequest(
    rateConfNumber: string,
    broker: { name: string; email: string },
    carrier: { name: string; email: string },
    createdBy: string
  ): Promise<SignatureRequest> {
    return this.createSignatureRequest(
      rateConfNumber,
      "rate_confirmation",
      `Rate Confirmation - ${rateConfNumber}`,
      [
        { name: carrier.name, email: carrier.email, role: "Carrier", order: 1 },
        { name: broker.name, email: broker.email, role: "Broker", order: 2 },
      ],
      { expiresInDays: 3, reminderEnabled: true },
      createdBy
    );
  }

  /**
   * Create quick signature for POD
   */
  async createPODSignatureRequest(
    loadNumber: string,
    driver: { name: string; email: string },
    receiver: { name: string; email: string },
    createdBy: string
  ): Promise<SignatureRequest> {
    return this.createSignatureRequest(
      loadNumber,
      "pod",
      `Proof of Delivery - ${loadNumber}`,
      [
        { name: receiver.name, email: receiver.email, role: "Receiver", order: 1 },
        { name: driver.name, email: driver.email, role: "Driver", order: 2 },
      ],
      { expiresInDays: 1 },
      createdBy
    );
  }
}

// Export singleton instance
export const signatureService = new SignatureService();
