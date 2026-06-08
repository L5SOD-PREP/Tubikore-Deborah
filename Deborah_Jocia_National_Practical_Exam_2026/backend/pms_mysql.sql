-- ============================================================================
-- PMS DATABASE SCHEMA + SEED DATA — SwiftWheels Enterprises
-- MySQL/MariaDB Version
-- ============================================================================
-- Database: MySQL 8.x / MariaDB 10.x
-- Purpose: Create the complete PMS database with sample data (MySQL-compatible)
-- Usage:   Import this file into phpMyAdmin or run:
--          mysql -u root -p pms_database < pms_mysql.sql
-- ============================================================================

-- Create the database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS swiftwheels_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE swiftwheels_pms;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Users (
    UserName    VARCHAR(50) PRIMARY KEY,
    Password    VARCHAR(255) NOT NULL,
    Role        ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'viewer',
    Email       VARCHAR(255) NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin   DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 2. VEHICLE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Vehicle (
    Plate_Number    VARCHAR(20) PRIMARY KEY,
    Brand           VARCHAR(100) NOT NULL,
    Model           VARCHAR(100) NOT NULL,
    Year            INT NOT NULL CHECK (Year >= 1900 AND Year <= 2030),
    Vehicle_Type    VARCHAR(50) NOT NULL,
    Purchase_Price  DECIMAL(12,2) NOT NULL CHECK (Purchase_Price >= 0),
    Status          ENUM('Available', 'Rented', 'Sold', 'Maintenance') NOT NULL DEFAULT 'Available',
    RegisteredBy    VARCHAR(50) NOT NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (RegisteredBy) REFERENCES Users(UserName) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 3. CUSTOMER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Customer (
    CustomerID   INT AUTO_INCREMENT PRIMARY KEY,
    FirstName    VARCHAR(100) NOT NULL,
    LastName     VARCHAR(100) NOT NULL,
    Email        VARCHAR(255) NOT NULL,
    PhoneNumber  VARCHAR(50) NOT NULL,
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Status       ENUM('Active', 'Inactive', 'Blocked') NOT NULL DEFAULT 'Active',
    RegisteredBy VARCHAR(50) NOT NULL,
    FOREIGN KEY (RegisteredBy) REFERENCES Users(UserName) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 4. PROMOTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Promotion (
    PromotionID   INT AUTO_INCREMENT PRIMARY KEY,
    Title         VARCHAR(255) NOT NULL,
    Description   TEXT NULL,
    Discount_Type ENUM('free', 'percentage', 'FLAT_RATE', 'CASHBACK', 'BUY_ONE_GET_ONE', 'Bundle', 'amount') NOT NULL,
    Discount_Value DECIMAL(12,2) NOT NULL CHECK (Discount_Value >= 0),
    Start_Date    DATE NOT NULL,
    End_Date      DATE NOT NULL,
    Status        ENUM('Active', 'Inactive', 'Expired') NOT NULL DEFAULT 'Active',
    CreatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CreatedBy     VARCHAR(50) NOT NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserName) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 5. PROMOTION_VEHICLE (JUNCTION TABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS Promotion_Vehicle (
    PromotionID INT NOT NULL,
    Plate_Number VARCHAR(20) NOT NULL,
    Performance VARCHAR(100) NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PromotionID, Plate_Number),
    FOREIGN KEY (PromotionID) REFERENCES Promotion(PromotionID) ON DELETE CASCADE,
    FOREIGN KEY (Plate_Number) REFERENCES Vehicle(Plate_Number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 6. ACTIVITY_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Activity_Logs (
    LogID       INT AUTO_INCREMENT PRIMARY KEY,
    UserName    VARCHAR(50) NOT NULL,
    Action      VARCHAR(50) NOT NULL,
    Entity      VARCHAR(50) NOT NULL,
    EntityID    VARCHAR(100) NULL,
    Details     JSON NULL,
    IPAddress   VARCHAR(45) NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserName) REFERENCES Users(UserName) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserName       VARCHAR(50) NOT NULL,
    Title          VARCHAR(255) NOT NULL,
    Message        TEXT NOT NULL,
    Type           ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    IsRead         TINYINT(1) NOT NULL DEFAULT 0,
    CreatedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserName) REFERENCES Users(UserName) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX idx_vehicle_status ON Vehicle(Status);
CREATE INDEX idx_vehicle_brand ON Vehicle(Brand);
CREATE INDEX idx_customer_status ON Customer(Status);
CREATE INDEX idx_customer_email ON Customer(Email);
CREATE INDEX idx_promotion_status ON Promotion(Status);
CREATE INDEX idx_promotion_dates ON Promotion(Start_Date, End_Date);
CREATE INDEX idx_activity_user ON Activity_Logs(UserName);
CREATE INDEX idx_activity_created ON Activity_Logs(CreatedAt);
CREATE INDEX idx_notification_user ON Notifications(UserName, IsRead);


-- ============================================================================
-- ============================================================================
-- SEED DATA
-- ============================================================================
-- ============================================================================


-- ============================================================================
-- 1. SEED: USERS
-- ============================================================================

INSERT IGNORE INTO Users (UserName, Password, Role, Email, CreatedAt) VALUES
    ('admin',         '$2b$12$JZym.rJ.pFWbPATAN3RTReMAZdNgSlC80zjwZijYd9SoftJG6qwsS', 'admin',  'admin@swiftwheels.rw',         '2026-01-15 08:00:00'),
    ('jean.pierre',   '$2b$12$QGQE44yhnXzrji0Luffgy.FWVhVUU2pfnAeJHy2NeGBiUMIxz3sM6', 'staff',  'jean.pierre@swiftwheels.rw',   '2026-02-01 09:00:00'),
    ('alice.mukamana','$2b$12$NfCbjGT5V.eJM0MtphRYG.GU54iisFFtOohpcuAf1HL/rnus1NbK6', 'viewer', 'alice.mukamana@swiftwheels.rw','2026-03-10 10:30:00');


-- ============================================================================
-- 2. SEED: VEHICLES
-- ============================================================================

INSERT IGNORE INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, RegisteredBy, CreatedAt) VALUES
    ('RAB-001A', 'Toyota',    'Corolla',       2024, 'Sedan',       22000, 'Available',   'admin',      '2026-01-20 09:00:00'),
    ('RAB-002B', 'Honda',     'Civic',         2023, 'Sedan',       24500, 'Available',   'admin',      '2026-01-22 10:00:00'),
    ('RAB-003C', 'Toyota',    'RAV4',          2025, 'SUV',         35000, 'Available',   'jean.pierre','2026-02-05 11:00:00'),
    ('RAB-004D', 'Ford',      'Ranger',        2023, 'Truck',       38000, 'Available',   'admin',      '2026-01-25 08:30:00'),
    ('RAB-005E', 'Suzuki',    'Swift',         2024, 'Sedan',       15000, 'Rented',      'jean.pierre','2026-02-10 09:00:00'),
    ('RAB-006F', 'Toyota',    'Hilux',         2022, 'Truck',       42000, 'Sold',        'admin',      '2026-01-18 10:00:00'),
    ('RAB-007G', 'Nissan',    'X-Trail',       2024, 'SUV',         32000, 'Available',   'admin',      '2026-01-30 11:00:00'),
    ('RAB-008H', 'Toyota',    'Hiace',         2023, 'Van',         28000, 'Available',   'jean.pierre','2026-02-15 08:00:00'),
    ('RAB-009I', 'Hyundai',   'Tucson',        2025, 'SUV',         30500, 'Maintenance', 'admin',      '2026-02-20 09:30:00'),
    ('RAB-010J', 'BMW',       'X5',            2024, 'SUV',         55000, 'Available',   'admin',      '2026-03-01 10:00:00'),
    ('RAB-011K', 'Mercedes',  'C300',          2023, 'Sedan',       48000, 'Rented',      'jean.pierre','2026-03-05 11:00:00'),
    ('RAB-012L', 'Volkswagen','Golf',          2024, 'Sedan',       26000, 'Available',   'admin',      '2026-03-10 08:00:00'),
    ('RAB-013M', 'Toyota',    'Land Cruiser',  2025, 'SUV',         65000, 'Available',   'admin',      '2026-03-15 09:00:00'),
    ('RAB-014N', 'Isuzu',     'D-Max',         2023, 'Truck',       36000, 'Sold',        'jean.pierre','2026-03-20 10:00:00'),
    ('RAB-015P', 'Kia',       'Sportage',      2024, 'SUV',         28500, 'Available',   'admin',      '2026-04-01 11:00:00');


-- ============================================================================
-- 3. SEED: CUSTOMERS
-- ============================================================================

INSERT IGNORE INTO Customer (CustomerID, FirstName, LastName, Email, PhoneNumber, Status, RegisteredBy, CreatedAt) VALUES
    (1,  'Jean-Pierre', 'Habimana',        'jean.habimana@email.com',        '+250 788 100 001', 'Active',   'admin',      '2026-01-25 09:00:00'),
    (2,  'Alice',       'Uwimana',         'alice.uwimana@email.com',        '+250 788 100 002', 'Active',   'admin',      '2026-01-28 10:00:00'),
    (3,  'Patrick',     'Mugabo',          'patrick.mugabo@email.com',       '+250 788 100 003', 'Active',   'jean.pierre','2026-02-10 11:00:00'),
    (4,  'Grace',       'Nyiranshuti',     'grace.nyiranshuti@email.com',    '+250 788 100 004', 'Active',   'admin',      '2026-02-12 08:30:00'),
    (5,  'David',       'Niyonzima',       'david.niyonzima@email.com',      '+250 788 100 005', 'Inactive', 'admin',      '2026-02-15 09:00:00'),
    (6,  'Esther',      'Mukamana',        'esther.mukamana@email.com',      '+250 788 100 006', 'Active',   'jean.pierre','2026-02-20 10:00:00'),
    (7,  'Francois',    'Ndagijimana',     'francois.ndagi@email.com',       '+250 788 100 007', 'Active',   'admin',      '2026-03-01 11:00:00'),
    (8,  'Chantal',     'Uwase',           'chantal.uwase@email.com',        '+250 788 100 008', 'Blocked',  'admin',      '2026-03-05 08:00:00'),
    (9,  'Olivier',     'Hakizimana',      'olivier.haki@email.com',         '+250 788 100 009', 'Active',   'jean.pierre','2026-03-10 09:30:00'),
    (10, 'Beatrice',    'Mukandayisenga',  'beatrice.muka@email.com',        '+250 788 100 010', 'Active',   'admin',      '2026-03-15 10:00:00'),
    (11, 'Emmanuel',    'Twahirwa',        'emmanuel.twahirwa@email.com',    '+250 788 100 011', 'Inactive', 'jean.pierre','2026-03-20 11:00:00'),
    (12, 'Diane',       'Ishimwe',         'diane.ishimwe@email.com',        '+250 788 100 012', 'Active',   'admin',      '2026-04-01 08:00:00');


-- ============================================================================
-- 4. SEED: PROMOTIONS
-- ============================================================================

INSERT IGNORE INTO Promotion (PromotionID, Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status, CreatedBy, CreatedAt) VALUES
    (1, 'New Year Mega Sale',
     'Start the year with incredible savings on our entire fleet! Up to 20% off on all vehicles.',
     'percentage', 20, '2026-01-01', '2026-12-31', 'Active', 'admin', '2026-01-01 08:00:00'),
    (2, 'Holiday Price Slash',
     'Get $500 off on selected SUVs and sedans this holiday season.',
     'FLAT_RATE', 500, '2026-06-01', '2026-09-30', 'Active', 'admin', '2026-05-25 09:00:00'),
    (3, 'Clearance Discount',
     'Last year models at unbeatable prices! 35% off while stock lasts.',
     'percentage', 35, '2025-06-01', '2025-12-31', 'Expired', 'admin', '2025-05-15 10:00:00'),
    (4, 'Weekend Flash Sale',
     'Buy one vehicle rental, get the second weekend absolutely free!',
     'BUY_ONE_GET_ONE', 1, '2026-06-15', '2026-07-15', 'Active', 'jean.pierre', '2026-06-10 11:00:00'),
    (5, 'Summer Cashback',
     'Enjoy $200 cashback on every SUV rental this summer. Money back guaranteed!',
     'CASHBACK', 200, '2026-07-01', '2026-10-31', 'Active', 'admin', '2026-06-20 08:00:00'),
    (6, 'Family Bundle Deal',
     'Bundle a family van with a sedan and save big! Perfect for group travel.',
     'Bundle', 750, '2026-03-01', '2026-08-31', 'Active', 'jean.pierre', '2026-02-25 09:00:00'),
    (7, 'Spring Promotion',
     '10% off on all vehicle purchases. Spring into a new ride!',
     'percentage', 10, '2025-01-01', '2025-03-31', 'Expired', 'admin', '2024-12-15 10:00:00'),
    (8, 'Military & Veterans Discount',
     'Special $1,000 discount for all military and veterans. We honor your service.',
     'amount', 1000, '2026-05-01', '2026-12-31', 'Inactive', 'admin', '2026-04-20 11:00:00');


-- ============================================================================
-- 5. SEED: PROMOTION_VEHICLE LINKS
-- ============================================================================

INSERT IGNORE INTO Promotion_Vehicle (PromotionID, Plate_Number, Performance, CreatedAt) VALUES
    (1, 'RAB-001A', 'Excellent', '2026-01-01 08:00:00'),
    (1, 'RAB-003C', 'Good',      '2026-01-01 08:00:00'),
    (1, 'RAB-007G', 'Excellent', '2026-01-01 08:01:00'),
    (1, 'RAB-010J', 'Good',      '2026-01-01 08:01:00'),
    (1, 'RAB-015P', 'Average',   '2026-01-01 08:02:00'),
    (2, 'RAB-002B', 'Good',      '2026-06-01 09:00:00'),
    (2, 'RAB-012L', 'Excellent', '2026-06-01 09:00:00'),
    (2, 'RAB-013M', 'Good',      '2026-06-01 09:01:00'),
    (3, 'RAB-004D', 'Average',   '2025-06-01 10:00:00'),
    (3, 'RAB-008H', 'Good',      '2025-06-01 10:01:00'),
    (4, 'RAB-001A', 'Excellent', '2026-06-15 11:00:00'),
    (4, 'RAB-005E', 'Good',      '2026-06-15 11:00:00'),
    (4, 'RAB-011K', 'Average',   '2026-06-15 11:01:00'),
    (4, 'RAB-013M', 'Excellent', '2026-06-15 11:01:00'),
    (5, 'RAB-003C', 'Excellent', '2026-07-01 08:00:00'),
    (5, 'RAB-007G', 'Good',      '2026-07-01 08:00:00'),
    (5, 'RAB-009I', 'Average',   '2026-07-01 08:01:00'),
    (5, 'RAB-010J', 'Excellent', '2026-07-01 08:01:00'),
    (5, 'RAB-015P', 'Good',      '2026-07-01 08:02:00'),
    (6, 'RAB-003C', 'Good',      '2026-03-01 09:00:00'),
    (6, 'RAB-008H', 'Average',   '2026-03-01 09:00:00'),
    (6, 'RAB-012L', 'Good',      '2026-03-01 09:01:00'),
    (7, 'RAB-006F', 'Good',      '2025-01-01 10:00:00'),
    (7, 'RAB-014N', 'Average',   '2025-01-01 10:01:00'),
    (8, 'RAB-009I', 'Good',      '2026-05-01 11:00:00'),
    (8, 'RAB-011K', 'Average',   '2026-05-01 11:01:00');


-- ============================================================================
-- 6. SEED: ACTIVITY LOGS
-- ============================================================================

INSERT IGNORE INTO Activity_Logs (LogID, UserName, Action, Entity, EntityID, Details, IPAddress, CreatedAt) VALUES
    (1,  'admin',       'LOGIN',       'Users',             'admin',         NULL,                                       '127.0.0.1', '2026-01-15 08:00:00'),
    (2,  'admin',       'CREATE',      'Users',             'jean.pierre',   '{\"Role\":\"staff\"}',                      '127.0.0.1', '2026-02-01 09:00:00'),
    (3,  'admin',       'CREATE',      'Users',             'alice.mukamana','{\"Role\":\"viewer\"}',                    '127.0.0.1', '2026-03-10 10:30:00'),
    (4,  'admin',       'CREATE',      'Vehicle',           'RAB-001A',      '{\"Brand\":\"Toyota\",\"Model\":\"Corolla\",\"Year\":2024,\"Purchase_Price\":22000}', '127.0.0.1', '2026-01-20 09:00:00'),
    (5,  'jean.pierre', 'CREATE',      'Vehicle',           'RAB-003C',      '{\"Brand\":\"Toyota\",\"Model\":\"RAV4\",\"Year\":2025,\"Purchase_Price\":35000}', '192.168.1.50', '2026-02-05 11:00:00'),
    (6,  'admin',       'CREATE',      'Vehicle',           'RAB-007G',      '{\"Brand\":\"Nissan\",\"Model\":\"X-Trail\",\"Year\":2024,\"Purchase_Price\":32000}', '127.0.0.1', '2026-01-30 11:00:00'),
    (7,  'admin',       'UPDATE',      'Vehicle',           'RAB-006F',      '{\"Status\":\"Sold\"}',                     '127.0.0.1', '2026-06-01 10:00:00'),
    (8,  'admin',       'UPDATE',      'Vehicle',           'RAB-009I',      '{\"Status\":\"Maintenance\"}',              '127.0.0.1', '2026-06-05 09:00:00'),
    (9,  'admin',       'CREATE',      'Customer',          '1',             '{\"FirstName\":\"Jean-Pierre\",\"LastName\":\"Habimana\"}', '127.0.0.1', '2026-01-25 09:00:00'),
    (10, 'admin',       'CREATE',      'Customer',          '2',             '{\"FirstName\":\"Alice\",\"LastName\":\"Uwimana\"}',      '127.0.0.1', '2026-01-28 10:00:00'),
    (11, 'jean.pierre', 'CREATE',      'Customer',          '3',             '{\"FirstName\":\"Patrick\",\"LastName\":\"Mugabo\"}',    '192.168.1.50', '2026-02-10 11:00:00'),
    (12, 'admin',       'UPDATE',      'Customer',          '8',             '{\"Status\":\"Blocked\"}',                  '127.0.0.1', '2026-05-15 08:00:00'),
    (13, 'admin',       'CREATE',      'Promotion',         '1',             '{\"Title\":\"New Year Mega Sale\",\"Discount_Type\":\"percentage\",\"Discount_Value\":20}', '127.0.0.1', '2026-01-01 08:00:00'),
    (14, 'jean.pierre', 'CREATE',      'Promotion',         '4',             '{\"Title\":\"Weekend Flash Sale\",\"Discount_Type\":\"BUY_ONE_GET_ONE\"}', '192.168.1.50', '2026-06-10 11:00:00'),
    (15, 'admin',       'UPDATE',      'Promotion',         '8',             '{\"Status\":\"Inactive\"}',                 '127.0.0.1', '2026-05-01 09:00:00'),
    (16, 'admin',       'LINK',        'Promotion_Vehicle', '1-RAB-001A',    '{\"PromotionID\":1,\"Plate_Number\":\"RAB-001A\"}', '127.0.0.1', '2026-01-01 08:00:00'),
    (17, 'jean.pierre', 'LINK',        'Promotion_Vehicle', '4-RAB-005E',    '{\"PromotionID\":4,\"Plate_Number\":\"RAB-005E\"}', '192.168.1.50', '2026-06-15 11:00:00'),
    (18, 'admin',       'VIEW_REPORT', 'Report',            'customer-promotions', NULL,                               '127.0.0.1', '2026-06-06 14:00:00'),
    (19, 'admin',       'VIEW_REPORT', 'Report',            'customer-promotions', NULL,                               '127.0.0.1', '2026-06-07 10:00:00'),
    (20, 'jean.pierre', 'VIEW_REPORT', 'Report',            'customer-promotions', NULL,                               '192.168.1.50', '2026-06-08 09:00:00');


-- ============================================================================
-- 7. SEED: NOTIFICATIONS
-- ============================================================================

INSERT IGNORE INTO Notifications (NotificationID, UserName, Title, Message, Type, IsRead, CreatedAt) VALUES
    (1,  'admin',        'Welcome to PMS',              'Welcome to SwiftWheels Promotion & Marketing Subsystem. Start by adding vehicles and customers.',                       'info',    1, '2026-01-15 08:01:00'),
    (2,  'admin',        'Staff User Created',           'Staff user \"jean.pierre\" has been registered successfully.',                                                              'success', 1, '2026-02-01 09:00:00'),
    (3,  'admin',        'New Vehicle Added',            'Toyota Land Cruiser (RAB-013M) has been added to the fleet at $65,000.',                                                  'info',    1, '2026-03-15 09:00:00'),
    (4,  'admin',        'Customer Blocked',             'Customer Chantal Uwase has been marked as Blocked.',                                                                      'warning', 1, '2026-05-15 08:00:00'),
    (5,  'admin',        'Vehicle Maintenance Due',      'Hyundai Tucson (RAB-009I) has been moved to Maintenance status.',                                                          'warning', 1, '2026-06-05 09:00:00'),
    (6,  'admin',        'Report Generated',             'Customer Promotions Report was generated. Showing active customers with promotions.',                                      'info',    0, '2026-06-07 10:00:00'),
    (7,  'admin',        'Promotion Ending Soon',        'Family Bundle Deal (Promotion #6) ends on August 31, 2026. Consider renewing or updating.',                                 'warning', 0, '2026-06-08 08:00:00'),
    (8,  'admin',        'Summer Cashback Launched',     'Summer Cashback promotion is now active. $200 cashback on all SUV rentals through October 31.',                             'success', 0, '2026-07-01 08:00:00'),
    (9,  'jean.pierre',  'Welcome Aboard',               'Welcome to SwiftWheels! You have been granted staff-level access to manage vehicles, customers, and promotions.',           'info',    1, '2026-02-01 09:01:00'),
    (10, 'jean.pierre',  'Vehicle Linked to Promotion',  'You successfully linked Suzuki Swift (RAB-005E) to the Weekend Flash Sale promotion.',                                    'success', 0, '2026-06-15 11:00:00'),
    (11, 'jean.pierre',  'Weekend Flash Sale Active',    'The Weekend Flash Sale (BOGO) you created is now live and running through July 15, 2026.',                                 'success', 0, '2026-06-15 11:05:00'),
    (12, 'alice.mukamana','Account Created',              'Your viewer account has been created. You have read-only access to the PMS system.',                                      'info',    0, '2026-03-10 10:31:00');
