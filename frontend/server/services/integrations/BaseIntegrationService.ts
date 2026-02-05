/**
 * EUSOCONNECT BASE INTEGRATION SERVICE
 * Abstract base class for all integration providers
 */

import { getDb } from "../../db";
import { 
  integrationConnections, 
  integrationSyncLogs, 
  integrationSyncedRecords,
  integrationProviders 
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  externalId?: string;
  tokenExpiresAt?: Date;
}

export interface SyncResult {
  success: boolean;
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
}

export interface MappedRecord {
  externalId: string;
  externalType: string;
  externalData: Record<string, unknown>;
  internalTable: string;
  internalData: Record<string, unknown>;
}

export abstract class BaseIntegrationService {
  protected providerSlug: string;
  protected apiBaseUrl: string;
  protected connectionId: number | null = null;
  protected credentials: IntegrationCredentials = {};

  constructor(providerSlug: string, apiBaseUrl: string) {
    this.providerSlug = providerSlug;
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Initialize the service with connection credentials
   */
  async initialize(connectionId: number): Promise<boolean> {
    const db = await getDb(); if (!db) return false;
    
    const [connection] = await db
      .select()
      .from(integrationConnections)
      .where(eq(integrationConnections.id, connectionId));
    
    if (!connection) {
      console.error(`[${this.providerSlug}] Connection not found: ${connectionId}`);
      return false;
    }
    
    this.connectionId = connectionId;
    this.credentials = {
      accessToken: connection.accessToken || undefined,
      refreshToken: connection.refreshToken || undefined,
      apiKey: connection.apiKey || undefined,
      apiSecret: connection.apiSecret || undefined,
      externalId: connection.externalId || undefined,
      tokenExpiresAt: connection.tokenExpiresAt || undefined,
    };
    
    return true;
  }

  /**
   * Check if token is expired and needs refresh
   */
  protected isTokenExpired(): boolean {
    if (!this.credentials.tokenExpiresAt) return false;
    return new Date() >= this.credentials.tokenExpiresAt;
  }

  /**
   * Refresh OAuth token - must be implemented by OAuth-based providers
   */
  protected async refreshToken(): Promise<boolean> {
    console.warn(`[${this.providerSlug}] Token refresh not implemented`);
    return false;
  }

  /**
   * Make authenticated API request
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check token expiration for OAuth providers
    if (this.isTokenExpired() && this.credentials.refreshToken) {
      await this.refreshToken();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authentication
    if (this.credentials.accessToken) {
      headers["Authorization"] = `Bearer ${this.credentials.accessToken}`;
    } else if (this.credentials.apiKey) {
      if (this.credentials.apiSecret) {
        // API Key + Secret (Basic Auth or custom header)
        headers["X-API-Key"] = this.credentials.apiKey;
        headers["X-API-Secret"] = this.credentials.apiSecret;
      } else {
        headers["Authorization"] = `ApiKey ${this.credentials.apiKey}`;
      }
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[${this.providerSlug}] Request failed:`, error);
      throw error;
    }
  }

  /**
   * Start a sync operation and create log entry
   */
  protected async startSync(
    syncType: "full" | "incremental" | "webhook" | "manual",
    dataType?: string,
    triggeredBy?: string,
    triggeredByUserId?: number
  ): Promise<number> {
    const db = await getDb(); if (!db) return 0;
    
    const [syncLog] = await db.insert(integrationSyncLogs).values({
      connectionId: this.connectionId!,
      syncType,
      dataType,
      status: "running",
      triggeredBy,
      triggeredByUserId,
    }).$returningId();
    
    // Update connection status
    await db
      .update(integrationConnections)
      .set({ status: "syncing" })
      .where(eq(integrationConnections.id, this.connectionId!));
    
    return syncLog.id;
  }

  /**
   * Complete a sync operation
   */
  protected async completeSync(
    syncLogId: number,
    result: SyncResult
  ): Promise<void> {
    const db = await getDb(); if (!db) return;
    const startedAt = new Date();
    
    await db.update(integrationSyncLogs).set({
      status: result.success ? "completed" : "failed",
      completedAt: new Date(),
      durationMs: new Date().getTime() - startedAt.getTime(),
      recordsFetched: result.recordsFetched,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      recordsFailed: result.recordsFailed,
      errorMessage: result.errors.length > 0 ? result.errors.join("; ") : null,
    }).where(eq(integrationSyncLogs.id, syncLogId));
    
    // Update connection
    await db.update(integrationConnections).set({
      status: result.success ? "connected" : "error",
      lastSyncAt: new Date(),
      lastError: result.success ? null : result.errors[0],
      errorCount: result.success ? 0 : (await this.getConnectionErrorCount()) + 1,
      totalRecordsSynced: result.recordsCreated + result.recordsUpdated,
      lastRecordsSynced: result.recordsCreated + result.recordsUpdated,
    }).where(eq(integrationConnections.id, this.connectionId!));
  }

  /**
   * Get current error count for connection
   */
  private async getConnectionErrorCount(): Promise<number> {
    const db = await getDb(); if (!db) return 0;
    const [connection] = await db
      .select({ errorCount: integrationConnections.errorCount })
      .from(integrationConnections)
      .where(eq(integrationConnections.id, this.connectionId!));
    
    return connection?.errorCount || 0;
  }

  /**
   * Save a synced record mapping
   */
  protected async saveSyncedRecord(record: MappedRecord, internalId: number): Promise<void> {
    const db = await getDb(); if (!db) return;
    
    // Check if record already exists
    const [existing] = await db
      .select()
      .from(integrationSyncedRecords)
      .where(and(
        eq(integrationSyncedRecords.connectionId, this.connectionId!),
        eq(integrationSyncedRecords.externalId, record.externalId),
        eq(integrationSyncedRecords.externalType, record.externalType)
      ));
    
    if (existing) {
      await db.update(integrationSyncedRecords).set({
        externalData: record.externalData,
        internalId,
        lastSyncedAt: new Date(),
        syncStatus: "synced",
      }).where(eq(integrationSyncedRecords.id, existing.id));
    } else {
      await db.insert(integrationSyncedRecords).values({
        connectionId: this.connectionId!,
        externalId: record.externalId,
        externalType: record.externalType,
        externalData: record.externalData,
        internalTable: record.internalTable,
        internalId,
        syncStatus: "synced",
        syncDirection: "inbound",
      });
    }
  }

  /**
   * Abstract methods that must be implemented by each provider
   */
  abstract testConnection(): Promise<boolean>;
  abstract fetchData(dataTypes?: string[]): Promise<SyncResult>;
  abstract mapToInternal(externalData: unknown, dataType: string): MappedRecord[];
}

export default BaseIntegrationService;
