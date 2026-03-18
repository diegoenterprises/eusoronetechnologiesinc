/**
 * CRON JOB FAILURE ALERTING
 * Sends webhook notifications when background jobs fail.
 * Supports Slack, PagerDuty, or any webhook endpoint.
 */
import { logger } from "../_core/logger";

export async function notifyCronFailure(jobName: string, error: string): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  logger.error(`[CronAlert] Job "${jobName}" FAILED: ${error}`);

  if (!webhookUrl) return; // No webhook configured — just log

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*EusoTrip Alert*: Cron job \`${jobName}\` failed\n*Error:* ${error.slice(0, 500)}\n*Time:* ${new Date().toISOString()}\n*Host:* ${process.env.HOSTNAME || process.env.WEBSITE_HOSTNAME || 'unknown'}`,
      }),
    });
  } catch (alertErr: any) {
    logger.error(`[CronAlert] Failed to send alert webhook: ${alertErr.message}`);
  }
}
