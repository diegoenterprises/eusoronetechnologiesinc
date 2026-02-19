// Storage helpers for file uploads
// Primary: Azure Blob Storage (AZURE_STORAGE_CONNECTION_STRING)
// Fallback: Forge proxy (BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY)

import { ENV } from './_core/env';
import { BlobServiceClient } from '@azure/storage-blob';

const AZURE_CONTAINER = "documents";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ── Azure Blob Storage ──

function getAzureClient(): BlobServiceClient | null {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) return null;
  try {
    return BlobServiceClient.fromConnectionString(connStr);
  } catch {
    return null;
  }
}

async function azurePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getAzureClient();
  if (!client) throw new Error("Azure Storage not configured");
  const container = client.getContainerClient(AZURE_CONTAINER);
  await container.createIfNotExists({ access: "blob" });
  const key = normalizeKey(relKey);
  const blob = container.getBlockBlobClient(key);
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);
  await blob.uploadData(buf, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return { key, url: blob.url };
}

async function azureGet(relKey: string): Promise<{ key: string; url: string }> {
  const client = getAzureClient();
  if (!client) throw new Error("Azure Storage not configured");
  const container = client.getContainerClient(AZURE_CONTAINER);
  const key = normalizeKey(relKey);
  const blob = container.getBlockBlobClient(key);
  return { key, url: blob.url };
}

// ── Forge Proxy Fallback ──

function getForgeConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

async function forgePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const config = getForgeConfig();
  if (!config) throw new Error("Storage not configured: set AZURE_STORAGE_CONNECTION_STRING or BUILT_IN_FORGE_API_URL");
  const key = normalizeKey(relKey);
  const uploadUrl = new URL("v1/storage/upload", ensureTrailingSlash(config.baseUrl));
  uploadUrl.searchParams.set("path", key);
  const blob = typeof data === "string"
    ? new Blob([data], { type: contentType })
    : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: form,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

async function forgeGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getForgeConfig();
  if (!config) throw new Error("Storage not configured");
  const key = normalizeKey(relKey);
  const downloadUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(config.baseUrl));
  downloadUrl.searchParams.set("path", key);
  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  return { key, url: (await response.json()).url };
}

// ── Public API: auto-selects Azure or Forge ──

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (getAzureClient()) return azurePut(relKey, data, contentType);
  return forgePut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (getAzureClient()) return azureGet(relKey);
  return forgeGet(relKey);
}
