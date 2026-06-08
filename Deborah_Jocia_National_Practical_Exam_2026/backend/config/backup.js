const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const BACKUP_DIR = path.join(__dirname, '..', process.env.DB_BACKUP_DIR || './backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function createBackup(db) {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `pms-backup-${timestamp}.db`);

    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(backupPath, buffer);

    logger.info(`Database backup created: ${backupPath}`);
    return backupPath;
  } catch (err) {
    logger.error('Backup creation failed:', err);
    throw err;
  }
}

function cleanupOldBackups() {
  try {
    ensureBackupDir();
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 7;
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const files = fs.readdirSync(BACKUP_DIR);
    let deleted = 0;

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });

    if (deleted > 0) {
      logger.info(`Cleaned up ${deleted} old backup(s)`);
    }
  } catch (err) {
    logger.error('Backup cleanup failed:', err);
  }
}

function scheduleBackups(db) {
  const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info(`Scheduled backups every ${intervalHours} hours`);

  setInterval(() => {
    createBackup(db);
    cleanupOldBackups();
  }, intervalMs);

  // Run initial backup
  createBackup(db);
  cleanupOldBackups();
}

module.exports = { createBackup, cleanupOldBackups, scheduleBackups };
