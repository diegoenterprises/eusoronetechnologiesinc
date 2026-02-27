import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { database, collections } from '@/database';
import { syncEngine } from './sync-engine';
import * as Location from 'expo-location';
import { Q } from '@nozbe/watermelondb';

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CAPTURE SERVICE
// Captures photos, signatures, and BOL images fully offline.
// Files are stored on device, metadata in WatermelonDB, synced when online.
// ═══════════════════════════════════════════════════════════════════════════════

type DocumentType = 'BOL' | 'POD' | 'PHOTO' | 'SIGNATURE' | 'INSPECTION';
type PhotoPurpose = 'DAMAGE' | 'SEAL' | 'PLACARD' | 'CARGO' | 'GENERAL';

interface CaptureResult {
  id: string;
  localPath: string;
  capturedAt: Date;
  syncStatus: 'PENDING' | 'SYNCED';
}

class DocumentCaptureService {
  private readonly documentsDir = `${FileSystem.documentDirectory}eusotrip_docs/`;

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.documentsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.documentsDir, { intermediates: true });
    }
  }

  /**
   * Capture and store a signature (works fully offline)
   */
  async captureSignature(params: {
    loadId: string;
    type: 'BOL' | 'POD';
    signedBy: string;
    signatureBase64: string;
    signedByTitle?: string;
    notes?: string;
  }): Promise<CaptureResult> {
    // Get current location (GPS works offline)
    let location: { latitude: number; longitude: number } | undefined;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (e) {
      console.warn('[DocumentCapture] Could not get location for signature');
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `signature_${params.loadId}_${params.type}_${timestamp}.png`;
    const localPath = `${this.documentsDir}${filename}`;

    // Save signature image
    await FileSystem.writeAsStringAsync(
      localPath,
      params.signatureBase64.replace(/^data:image\/\w+;base64,/, ''),
      { encoding: FileSystem.EncodingType.Base64 }
    );

    // Create record in local database
    const doc = await database.write(async () => {
      return collections.localDocuments.create((record: any) => {
        record.loadId = params.loadId;
        record.documentType = params.type === 'BOL' ? 'BOL' : 'POD';
        record.purpose = 'SIGNATURE';
        record.localPath = localPath;
        record.fileSize = params.signatureBase64.length;
        record.mimeType = 'image/png';
        record.latitude = location?.latitude;
        record.longitude = location?.longitude;
        record.capturedAt = timestamp;
        record.capturedBy = params.signedBy;
        record.metadata = {
          signedBy: params.signedBy,
          signedByTitle: params.signedByTitle,
          notes: params.notes,
        };
        record.syncStatus = 'PENDING';
      });
    });

    // Queue for sync
    await syncEngine.queueAction({
      actionType: 'SIGNATURE',
      payload: {
        documentId: doc.id,
        loadId: params.loadId,
        type: params.type,
        signedBy: params.signedBy,
        signedByTitle: params.signedByTitle,
        notes: params.notes,
        latitude: location?.latitude,
        longitude: location?.longitude,
        capturedAt: new Date(timestamp).toISOString(),
        localPath, // For file upload
      },
      priority: 'HIGH',
      requiresOrder: false,
    });

    console.log(`[DocumentCapture] Signature captured: ${filename}`);

    return {
      id: doc.id,
      localPath,
      capturedAt: new Date(timestamp),
      syncStatus: 'PENDING',
    };
  }

  /**
   * Capture a photo (works fully offline)
   */
  async capturePhoto(params: {
    loadId: string;
    imageUri: string; // From camera
    purpose: PhotoPurpose;
    notes?: string;
  }): Promise<CaptureResult> {
    // Get location
    let location: { latitude: number; longitude: number } | undefined;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (e) {
      console.warn('[DocumentCapture] Could not get location for photo');
    }

    // Compress image
    const compressed = await ImageManipulator.manipulateAsync(
      params.imageUri,
      [{ resize: { width: 1920 } }], // Max width 1920px
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Generate filename
    const timestamp = Date.now();
    const filename = `photo_${params.loadId}_${params.purpose}_${timestamp}.jpg`;
    const localPath = `${this.documentsDir}${filename}`;

    // Copy to our documents directory
    await FileSystem.copyAsync({
      from: compressed.uri,
      to: localPath,
    });

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    const fileSize = fileInfo.exists ? (fileInfo as any).size : 0;

    // Create record
    const doc = await database.write(async () => {
      return collections.localDocuments.create((record: any) => {
        record.loadId = params.loadId;
        record.documentType = 'PHOTO';
        record.purpose = params.purpose;
        record.localPath = localPath;
        record.fileSize = fileSize;
        record.mimeType = 'image/jpeg';
        record.latitude = location?.latitude;
        record.longitude = location?.longitude;
        record.capturedAt = timestamp;
        record.capturedBy = 'driver'; // Get from auth context
        record.metadata = { notes: params.notes };
        record.syncStatus = 'PENDING';
      });
    });

    // Queue for sync
    await syncEngine.queueAction({
      actionType: 'DOCUMENT_CAPTURE',
      payload: {
        documentId: doc.id,
        loadId: params.loadId,
        documentType: 'PHOTO',
        purpose: params.purpose,
        notes: params.notes,
        latitude: location?.latitude,
        longitude: location?.longitude,
        capturedAt: new Date(timestamp).toISOString(),
        localPath,
        mimeType: 'image/jpeg',
        fileSize,
      },
      priority: 'NORMAL',
      requiresOrder: false,
    });

    console.log(`[DocumentCapture] Photo captured: ${filename}`);

    return {
      id: doc.id,
      localPath,
      capturedAt: new Date(timestamp),
      syncStatus: 'PENDING',
    };
  }

  /**
   * Get all pending documents for a load
   */
  async getPendingDocuments(loadId: string): Promise<any[]> {
    return collections.localDocuments
      .query(
        Q.where('load_id', loadId),
        Q.where('sync_status', 'PENDING')
      )
      .fetch();
  }

  /**
   * Get local path for a document
   */
  async getDocumentPath(documentId: string): Promise<string | null> {
    const doc = await collections.localDocuments.find(documentId);
    return doc?.localPath || null;
  }

  /**
   * Clean up synced documents older than 7 days
   */
  async cleanupOldDocuments(): Promise<void> {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const oldDocs = await collections.localDocuments
      .query(
        Q.where('sync_status', 'SYNCED'),
        Q.where('captured_at', Q.lt(sevenDaysAgo))
      )
      .fetch();

    for (const doc of oldDocs) {
      // Delete file
      try {
        await FileSystem.deleteAsync(doc.localPath, { idempotent: true });
      } catch (e) {
        console.warn(`[DocumentCapture] Could not delete ${doc.localPath}`);
      }

      // Delete record
      await database.write(async () => {
        await doc.destroyPermanently();
      });
    }

    console.log(`[DocumentCapture] Cleaned up ${oldDocs.length} old documents`);
  }
}

export const documentCapture = new DocumentCaptureService();
