const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const logger = require('./logger');
const backup = require('./backup');

const DB_PATH = path.join(__dirname, '..', process.env.DB_PATH || './pms.db');

let db = null;

async function getDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    logger.info('New database created');
  }

  db.run('PRAGMA foreign_keys = ON');

  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      UserName TEXT PRIMARY KEY,
      Password TEXT NOT NULL,
      Role TEXT NOT NULL DEFAULT 'viewer',
      Email TEXT,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      LastLogin TEXT
    )
  `);

  // Create Vehicle table
  db.run(`
    CREATE TABLE IF NOT EXISTS Vehicle (
      Plate_Number TEXT PRIMARY KEY,
      Brand TEXT NOT NULL,
      Model TEXT NOT NULL,
      Year INTEGER NOT NULL,
      Vehicle_Type TEXT NOT NULL,
      Purchase_Price REAL NOT NULL,
      Status TEXT NOT NULL DEFAULT 'Available',
      RegisteredBy TEXT NOT NULL,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (RegisteredBy) REFERENCES Users(UserName)
    )
  `);

  // Create Customer table
  db.run(`
    CREATE TABLE IF NOT EXISTS Customer (
      CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Email TEXT NOT NULL,
      PhoneNumber TEXT NOT NULL,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      Status TEXT NOT NULL DEFAULT 'Active',
      RegisteredBy TEXT NOT NULL,
      FOREIGN KEY (RegisteredBy) REFERENCES Users(UserName)
    )
  `);

  // Create Promotion table
  db.run(`
    CREATE TABLE IF NOT EXISTS Promotion (
      PromotionID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Description TEXT,
      Discount_Type TEXT NOT NULL,
      Discount_Value REAL NOT NULL,
      Start_Date TEXT NOT NULL,
      End_Date TEXT NOT NULL,
      Status TEXT NOT NULL DEFAULT 'Active',
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      CreatedBy TEXT NOT NULL,
      FOREIGN KEY (CreatedBy) REFERENCES Users(UserName)
    )
  `);

  // Create Promotion_Vehicle junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS Promotion_Vehicle (
      PromotionID INTEGER NOT NULL,
      Plate_Number TEXT NOT NULL,
      Performance TEXT,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (PromotionID, Plate_Number),
      FOREIGN KEY (PromotionID) REFERENCES Promotion(PromotionID) ON DELETE CASCADE,
      FOREIGN KEY (Plate_Number) REFERENCES Vehicle(Plate_Number) ON DELETE CASCADE
    )
  `);

  // Create Activity_Logs table for audit trail
  db.run(`
    CREATE TABLE IF NOT EXISTS Activity_Logs (
      LogID INTEGER PRIMARY KEY AUTOINCREMENT,
      UserName TEXT NOT NULL,
      Action TEXT NOT NULL,
      Entity TEXT NOT NULL,
      EntityID TEXT,
      Details TEXT,
      IPAddress TEXT,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (UserName) REFERENCES Users(UserName)
    )
  `);

  // Create Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS Notifications (
      NotificationID INTEGER PRIMARY KEY AUTOINCREMENT,
      UserName TEXT NOT NULL,
      Title TEXT NOT NULL,
      Message TEXT NOT NULL,
      Type TEXT NOT NULL DEFAULT 'info',
      IsRead INTEGER NOT NULL DEFAULT 0,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (UserName) REFERENCES Users(UserName)
    )
  `);

  // Create Indexes for performance
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_vehicle_status ON Vehicle(Status)",
    "CREATE INDEX IF NOT EXISTS idx_vehicle_brand ON Vehicle(Brand)",
    "CREATE INDEX IF NOT EXISTS idx_customer_status ON Customer(Status)",
    "CREATE INDEX IF NOT EXISTS idx_customer_email ON Customer(Email)",
    "CREATE INDEX IF NOT EXISTS idx_promotion_status ON Promotion(Status)",
    "CREATE INDEX IF NOT EXISTS idx_promotion_dates ON Promotion(Start_Date, End_Date)",
    "CREATE INDEX IF NOT EXISTS idx_activity_user ON Activity_Logs(UserName)",
    "CREATE INDEX IF NOT EXISTS idx_activity_created ON Activity_Logs(CreatedAt)",
    "CREATE INDEX IF NOT EXISTS idx_notification_user ON Notifications(UserName, IsRead)"
  ];
  indexes.forEach(idx => db.run(idx));

  // Seed default admin user if not exists
  const userResult = db.exec("SELECT COUNT(*) as cnt FROM Users");
  if (userResult.length > 0 && userResult[0].values[0][0] === 0) {
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const defaultUser = process.env.DEFAULT_ADMIN_USER || 'admin';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 12);
    db.run("INSERT INTO Users (UserName, Password, Role) VALUES (?, ?, ?)",
      [defaultUser, hashedPassword, 'admin']);
    logger.info(`Default admin user created: ${defaultUser}`);
  }

  saveDatabase();

  // Schedule automatic backups
  backup.scheduleBackups(db);

  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function closeDatabase() {
  if (db) {
    backup.createBackup(db);
    saveDatabase();
    db.close();
    db = null;
    logger.info('Database closed');
  }
}

// Helper: Execute a SELECT query with optional bind parameters and return all rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: Execute a SELECT query and return the first row as an object, or null
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: Execute an INSERT/UPDATE/DELETE with parameters
function execute(sql, params = []) {
  db.run(sql, params);
}

// Activity logging helper
function logActivity(username, action, entity, entityId = null, details = null, ipAddress = null) {
  try {
    execute(
      "INSERT INTO Activity_Logs (UserName, Action, Entity, EntityID, Details, IPAddress) VALUES (?, ?, ?, ?, ?, ?)",
      [username, action, entity, entityId, details ? JSON.stringify(details) : null, ipAddress]
    );
    saveDatabase();
  } catch (err) {
    logger.error('Failed to log activity:', err);
  }
}

// Notification helper
function createNotification(username, title, message, type = 'info') {
  try {
    execute(
      "INSERT INTO Notifications (UserName, Title, Message, Type) VALUES (?, ?, ?, ?)",
      [username, title, message, type]
    );
    saveDatabase();
  } catch (err) {
    logger.error('Failed to create notification:', err);
  }
}

module.exports = {
  getDatabase, saveDatabase, closeDatabase,
  queryAll, queryOne, execute,
  logActivity, createNotification
};
