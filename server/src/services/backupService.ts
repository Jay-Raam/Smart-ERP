import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';

export interface BackupMetadata {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  collections: Record<string, number>;
  totalDocuments: number;
}

const BACKUPS_DIR = path.resolve(
  process.cwd().endsWith('server') ? process.cwd() : path.join(process.cwd(), 'server'),
  'backups'
);
const MAX_RETENTION_COUNT = 10;

/**
 * Automated Database Backup and Recovery Service
 */
export class BackupService {
  private static ensureBackupDir() {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  /**
   * Generates a compressed snapshot of all MongoDB collections
   */
  public static async createBackup(): Promise<BackupMetadata> {
    this.ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_erp_${timestamp}.json.gz`;
    const filepath = path.join(BACKUPS_DIR, filename);

    const collections = mongoose.connection.collections;
    const backupData: Record<string, any[]> = {};
    const collectionCounts: Record<string, number> = {};
    let totalDocuments = 0;

    for (const [name, col] of Object.entries(collections)) {
      try {
        const docs = await col.find({}).toArray();
        backupData[name] = docs;
        collectionCounts[name] = docs.length;
        totalDocuments += docs.length;
      } catch (err) {
        console.error(`Error dumping collection ${name}:`, err);
      }
    }

    const jsonString = JSON.stringify({
      metadata: {
        timestamp: new Date().toISOString(),
        totalDocuments,
        collectionCounts,
      },
      data: backupData,
    });

    const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    fs.writeFileSync(filepath, compressed);

    const stats = fs.statSync(filepath);

    // Prune old backups past retention limit
    await this.pruneOldBackups();

    return {
      filename,
      filepath,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      createdAt: new Date().toISOString(),
      collections: collectionCounts,
      totalDocuments,
    };
  }

  /**
   * Lists all existing backup files
   */
  public static async listBackups(): Promise<BackupMetadata[]> {
    this.ensureBackupDir();

    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json.gz'));
    const backups: BackupMetadata[] = [];

    for (const file of files) {
      const filepath = path.join(BACKUPS_DIR, file);
      try {
        const stats = fs.statSync(filepath);
        backups.push({
          filename: file,
          filepath,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime.toISOString(),
          collections: {},
          totalDocuments: 0,
        });
      } catch {
        // Skip unreadable files
      }
    }

    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Prunes backup files older than MAX_RETENTION_COUNT
   */
  private static async pruneOldBackups() {
    try {
      const backups = await this.listBackups();
      if (backups.length > MAX_RETENTION_COUNT) {
        const toDelete = backups.slice(MAX_RETENTION_COUNT);
        for (const b of toDelete) {
          if (fs.existsSync(b.filepath)) {
            fs.unlinkSync(b.filepath);
          }
        }
      }
    } catch (err) {
      console.error('Error during backup pruning:', err);
    }
  }
}
