/**
 * WEB DOCUMENT CAPTURE — Offline photo/signature capture via Canvas & File API
 *
 * Features:
 *   - Camera capture via <input type="file" capture="environment">
 *   - Canvas-based signature pad
 *   - Image compression (resize + JPEG quality)
 *   - GPS-tagged captures (lat/lng from current position)
 *   - Offline storage in IndexedDB as Blobs
 *   - Auto-enqueue to sync engine for upload
 */

import { offlineDB } from "./db-api";
import { webSyncEngine } from "./sync-engine";

const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const MAX_SIGNATURE_DIMENSION = 800;

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION
// ═══════════════════════════════════════════════════════════════════════════════

async function compressImage(file: File | Blob, maxDim = MAX_IMAGE_DIMENSION, quality = JPEG_QUALITY): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve({ blob, width, height }) : reject(new Error("Compression failed")),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENT POSITION
// ═══════════════════════════════════════════════════════════════════════════════

async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

export const webDocumentCapture = {
  /**
   * Capture a photo from file input, compress, store offline, enqueue for sync
   */
  async capturePhoto(
    file: File,
    loadId: string,
    documentType: string,
    capturedBy: string,
    purpose?: string,
    metadata?: Record<string, unknown>
  ): Promise<number> {
    const { blob, width, height } = await compressImage(file);
    const pos = await getCurrentPosition();
    const base64 = await blobToBase64(blob);

    const id = await offlineDB.localDocuments.add({
      loadId,
      documentType,
      purpose,
      localBlob: blob,
      localUrl: URL.createObjectURL(blob),
      fileSize: blob.size,
      mimeType: "image/jpeg",
      latitude: pos?.lat,
      longitude: pos?.lng,
      capturedAt: Date.now(),
      capturedBy,
      metadataJson: JSON.stringify({ ...metadata, width, height, originalName: file.name, originalSize: file.size }),
      syncStatus: "PENDING",
    });

    await webSyncEngine.enqueueDocument(loadId, documentType, base64, "image/jpeg", pos?.lat, pos?.lng);
    return id as number;
  },

  /**
   * Capture signature from a canvas element
   */
  async captureSignature(
    canvas: HTMLCanvasElement,
    loadId: string,
    purpose: string,
    capturedBy: string,
    metadata?: Record<string, unknown>
  ): Promise<number> {
    // Resize canvas if too large
    let sigCanvas = canvas;
    if (canvas.width > MAX_SIGNATURE_DIMENSION || canvas.height > MAX_SIGNATURE_DIMENSION) {
      const ratio = Math.min(MAX_SIGNATURE_DIMENSION / canvas.width, MAX_SIGNATURE_DIMENSION / canvas.height);
      sigCanvas = document.createElement("canvas");
      sigCanvas.width = Math.round(canvas.width * ratio);
      sigCanvas.height = Math.round(canvas.height * ratio);
      const ctx = sigCanvas.getContext("2d");
      if (ctx) ctx.drawImage(canvas, 0, 0, sigCanvas.width, sigCanvas.height);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      sigCanvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error("Signature export failed")),
        "image/png"
      );
    });

    const pos = await getCurrentPosition();
    const base64 = await blobToBase64(blob);

    const id = await offlineDB.localDocuments.add({
      loadId,
      documentType: "SIGNATURE",
      purpose,
      localBlob: blob,
      localUrl: URL.createObjectURL(blob),
      fileSize: blob.size,
      mimeType: "image/png",
      latitude: pos?.lat,
      longitude: pos?.lng,
      capturedAt: Date.now(),
      capturedBy,
      metadataJson: JSON.stringify({ ...metadata, width: sigCanvas.width, height: sigCanvas.height }),
      syncStatus: "PENDING",
    });

    await webSyncEngine.enqueueDocument(loadId, "SIGNATURE", base64, "image/png", pos?.lat, pos?.lng);
    return id as number;
  },

  /**
   * Get all documents for a load (including pending offline ones)
   */
  async getDocumentsForLoad(loadId: string) {
    return offlineDB.localDocuments.getByLoad(loadId);
  },

  /**
   * Get pending document count
   */
  async getPendingCount() {
    return offlineDB.localDocuments.pendingCount();
  },
};
