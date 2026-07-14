import { Client as MinioClient } from 'minio';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

/**
 * Object storage for resume PDFs.
 *
 * Primary backend is MinIO (S3-compatible). When MinIO is not configured
 * (no endpoint/keys) or fails to initialise, the service transparently falls
 * back to the local `uploads/resumes` directory so the app keeps working.
 *
 * Files are content-addressed (sha256 → key), which deduplicates identical
 * resumes automatically. The stored `resume_url` keeps its historical shape
 * (`/uploads/resumes/<key>`) so existing consumers need no changes.
 */
const DISK_DIR = path.join(__dirname, '../../../uploads/resumes');

class StorageService {
  private client: MinioClient | null = null;

  constructor() {
    if (env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY) {
      this.client = new MinioClient({
        endPoint: env.MINIO_ENDPOINT,
        port: env.MINIO_PORT,
        useSSL: env.MINIO_USE_SSL,
        accessKey: env.MINIO_ACCESS_KEY,
        secretKey: env.MINIO_SECRET_KEY,
      });
    }
  }

  get enabled(): boolean {
    return !!this.client;
  }

  /** Ensure the bucket exists. Falls back to disk if MinIO is unreachable. */
  async init(): Promise<void> {
    if (!this.client) {
      logger.info('[Storage] MinIO not configured — using local disk for resumes', { module: 'Storage' });
      return;
    }
    try {
      const exists = await this.client.bucketExists(env.MINIO_BUCKET);
      if (!exists) await this.client.makeBucket(env.MINIO_BUCKET);
      logger.info(`[Storage] MinIO ready (bucket: ${env.MINIO_BUCKET})`, { module: 'Storage' });
    } catch (err: any) {
      logger.error('[Storage] MinIO init failed — falling back to disk', { module: 'Storage', message: err?.message });
      this.client = null;
    }
  }

  /**
   * Persist a resume PDF and return its browser URL path + object key.
   * Content-addressed: identical uploads reuse the same object (dedup).
   */
  async saveResume(buffer: Buffer, originalName = 'resume.pdf'): Promise<{ url: string; key: string }> {
    const hash = createHash('sha256').update(buffer).digest('hex');
    const ext = (path.extname(originalName) || '.pdf').toLowerCase();
    const key = `${hash}${ext}`;

    if (this.client) {
      // Dedup: skip the upload when the object already exists.
      let alreadyStored = false;
      try {
        await this.client.statObject(env.MINIO_BUCKET, key);
        alreadyStored = true;
      } catch {
        alreadyStored = false;
      }
      if (!alreadyStored) {
        await this.client.putObject(env.MINIO_BUCKET, key, buffer, buffer.length, {
          'Content-Type': 'application/pdf',
        });
      }
    } else {
      await fs.mkdir(DISK_DIR, { recursive: true });
      await fs.writeFile(path.join(DISK_DIR, key), buffer);
    }

    return { url: `/uploads/resumes/${key}`, key };
  }

  /**
   * Stream a stored resume by key from MinIO. Returns null when MinIO is not
   * the active backend or the object is missing (caller serves from disk).
   */
  async getResumeStream(key: string): Promise<NodeJS.ReadableStream | null> {
    if (!this.client) return null;
    try {
      return await this.client.getObject(env.MINIO_BUCKET, key);
    } catch {
      return null;
    }
  }

  /** Best-effort delete (no-op on disk backend; disk files are harmless to keep). */
  async deleteResume(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.removeObject(env.MINIO_BUCKET, key);
    } catch (err: any) {
      logger.warn('[Storage] Failed to delete resume object', { module: 'Storage', key, message: err?.message });
    }
  }
}

export const storageService = new StorageService();
