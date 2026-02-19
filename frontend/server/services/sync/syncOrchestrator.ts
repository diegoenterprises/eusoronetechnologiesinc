/**
 * Sync Orchestrator v2.0 — Master scheduler with enable/disable,
 * failure tracking, manual trigger, and admin status reporting
 */
import cron from "node-cron";
import { logSync, generateSyncId } from "../dataSync/syncLogger";
import { registerRefreshCallback } from "../cache/smartCache";

export interface SyncJobConfig {
  id: string;
  label: string;
  dataType: string;
  schedule: string;
  syncFn: () => Promise<void>;
  enabled: boolean;
  maxConsecutiveFailures: number;
}

export interface SyncJobStatus {
  id: string;
  label: string;
  dataType: string;
  schedule: string;
  enabled: boolean;
  running: boolean;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
  totalFailures: number;
  disabledReason: string | null;
}

interface JobState {
  config: SyncJobConfig;
  task: any | null;
  running: boolean;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
  totalFailures: number;
  disabledReason: string | null;
}

class SyncOrchestrator {
  private jobs = new Map<string, JobState>();
  private initialized = false;

  /**
   * Register a sync job. Does not start it until initialize() is called.
   */
  registerJob(config: SyncJobConfig): void {
    this.jobs.set(config.id, {
      config,
      task: null,
      running: false,
      lastRunAt: null,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastError: null,
      consecutiveFailures: 0,
      totalRuns: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      disabledReason: null,
    });

    // Register as a smart cache refresh callback
    registerRefreshCallback(config.dataType, config.syncFn);
  }

  /**
   * Start all enabled jobs.
   */
  initialize(): void {
    if (this.initialized) return;

    this.jobs.forEach((state, jobId) => {
      if (state.config.enabled) {
        this.startJob(jobId);
      }
    });

    this.initialized = true;
    console.log(`[SyncOrchestrator] Initialized ${this.jobs.size} jobs (${Array.from(this.jobs.values()).filter((j) => j.config.enabled).length} enabled)`);
  }

  private startJob(jobId: string): void {
    const state = this.jobs.get(jobId);
    if (!state) return;

    if (state.task) {
      state.task.stop();
    }

    state.task = cron.schedule(state.config.schedule, async () => {
      await this.runJob(jobId);
    });
  }

  /**
   * Run a specific job (used by cron and manual trigger).
   */
  async runJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    const state = this.jobs.get(jobId);
    if (!state) return { success: false, error: "Job not found" };
    if (state.running) return { success: false, error: "Job already running" };
    if (!state.config.enabled) return { success: false, error: "Job is disabled" };

    state.running = true;
    state.lastRunAt = new Date();
    state.totalRuns++;

    const syncId = generateSyncId();
    const startedAt = new Date();

    try {
      await logSync({
        id: syncId,
        sourceName: state.config.id,
        syncType: "INCREMENTAL",
        startedAt,
        status: "RUNNING",
      });

      await state.config.syncFn();

      state.lastSuccessAt = new Date();
      state.consecutiveFailures = 0;
      state.totalSuccesses++;
      state.lastError = null;

      await logSync({
        id: syncId,
        sourceName: state.config.id,
        syncType: "INCREMENTAL",
        startedAt,
        completedAt: new Date(),
        status: "SUCCESS",
      });

      return { success: true };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      state.lastErrorAt = new Date();
      state.lastError = errMsg;
      state.consecutiveFailures++;
      state.totalFailures++;

      await logSync({
        id: syncId,
        sourceName: state.config.id,
        syncType: "INCREMENTAL",
        startedAt,
        completedAt: new Date(),
        status: "FAILED",
        errorMessage: errMsg,
      });

      // Auto-disable after max consecutive failures
      if (state.consecutiveFailures >= state.config.maxConsecutiveFailures) {
        state.config.enabled = false;
        state.disabledReason = `Auto-disabled after ${state.consecutiveFailures} consecutive failures. Last: ${errMsg}`;
        if (state.task) state.task.stop();
        console.error(`[SyncOrchestrator] Job ${jobId} auto-disabled after ${state.consecutiveFailures} failures`);
      }

      return { success: false, error: errMsg };
    } finally {
      state.running = false;
    }
  }

  /**
   * Manually trigger a specific job (for admin UI).
   */
  async triggerJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    const state = this.jobs.get(jobId);
    if (!state) return { success: false, error: "Job not found" };

    // Allow triggering even if disabled (for debugging)
    const wasEnabled = state.config.enabled;
    state.config.enabled = true;
    const result = await this.runJob(jobId);
    if (!wasEnabled && state.consecutiveFailures > 0) {
      state.config.enabled = false;
    }
    return result;
  }

  /**
   * Enable a previously disabled job.
   */
  enableJob(jobId: string): boolean {
    const state = this.jobs.get(jobId);
    if (!state) return false;

    state.config.enabled = true;
    state.consecutiveFailures = 0;
    state.disabledReason = null;
    this.startJob(jobId);
    return true;
  }

  /**
   * Disable a job.
   */
  disableJob(jobId: string, reason?: string): boolean {
    const state = this.jobs.get(jobId);
    if (!state) return false;

    state.config.enabled = false;
    state.disabledReason = reason || "Manually disabled";
    if (state.task) state.task.stop();
    return true;
  }

  /**
   * Get status of all jobs (for admin dashboard).
   */
  getAllJobStatus(): SyncJobStatus[] {
    return Array.from(this.jobs.values()).map((state) => ({
      id: state.config.id,
      label: state.config.label,
      dataType: state.config.dataType,
      schedule: state.config.schedule,
      enabled: state.config.enabled,
      running: state.running,
      lastRunAt: state.lastRunAt?.toISOString() || null,
      lastSuccessAt: state.lastSuccessAt?.toISOString() || null,
      lastErrorAt: state.lastErrorAt?.toISOString() || null,
      lastError: state.lastError,
      consecutiveFailures: state.consecutiveFailures,
      totalRuns: state.totalRuns,
      totalSuccesses: state.totalSuccesses,
      totalFailures: state.totalFailures,
      disabledReason: state.disabledReason,
    }));
  }

  /**
   * Get status of a single job.
   */
  getJobStatus(jobId: string): SyncJobStatus | null {
    const state = this.jobs.get(jobId);
    if (!state) return null;
    return this.getAllJobStatus().find((j) => j.id === jobId) || null;
  }

  /**
   * Get summary stats.
   */
  getSummary(): {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    failedJobs: number;
    disabledJobs: number;
  } {
    const states = Array.from(this.jobs.values());
    return {
      totalJobs: states.length,
      enabledJobs: states.filter((s) => s.config.enabled).length,
      runningJobs: states.filter((s) => s.running).length,
      failedJobs: states.filter((s) => s.consecutiveFailures > 0).length,
      disabledJobs: states.filter((s) => !s.config.enabled).length,
    };
  }
}

// Singleton
export const syncOrchestrator = new SyncOrchestrator();
