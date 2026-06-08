# PMS Whole Database Documentation — SwiftWheels Enterprises

> **System:** Promotion & Marketing Subsystem (PMS)  
> **Organization:** SwiftWheels Enterprises  
> **Author:** Deborah Jocia  
> **Database Engine:** SQLite 3.x (via `sql.js`)  
> **Database File:** `backend/pms.db`  
> **API Framework:** Express.js (RESTful)  
> **Frontend:** React.js (Vite)  

---

## 📋 Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Table Schemas](#table-schemas)
   - [Users](#1-users)
   - [Vehicle](#2-vehicle)
   - [Customer](#3-customer)
   - [Promotion](#4-promotion)
   - [Promotion_Vehicle](#5-promotion_vehicle)
   - [Activity_Logs](#6-activity_logs)
   - [Notifications](#7-notifications)
3. [Complete API Reference](#complete-api-reference)
   - [Authentication](#authentication)
   - [Vehicles](#vehicles)
   - [Customers](#customers)
   - [Promotions](#promotions)
   - [Reports](#reports)
4. [Business Rules & Validation](#business-rules--validation)
5. [Security Model](#security-model)
6. [Database Initialization](#database-initialization)
7. [Backup System](#backup-system)
8. [Logging System](#logging-system)
9. [Notification System](#notification-system)
10. [Audit Trail System](#audit-trail-system)
11. [Sample SQL Queries](#sample-sql-queries)
12. [Environment Configuration](#environment-configuration)
13. [Error Handling](#error-handling)
14. [Frontend–Backend Data Flow](#frontend-backend-data-flow)

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│    ┌──────────────┐       ┌──────────────────┐       ┌──────────────┐       │
│    │    Users      │       │    Vehicle        │       │  Promotion   │       │
│    │              │       │                  │       │              │       │
│    │ (PK)UserName │◄──────│ (PK)Plate_Number │       │(PK)PromotionID│      │
│    │    Password  │       │    Brand          │       │    Title     │       │
│    │    Role      │       │    Model          │       │  Discount_Type│      │
│    │    Email     │       │    Year           │       │ Discount_Value│      │
│    │    CreatedAt │       │  Vehicle_Type     │       │   Start_Date │       │
│    │    LastLogin │       │ Purchase_Price    │       │   End_Date   │       │
│    └──────┬───────┘       │    Status         │       │    Status    │       │
│           │               │  RegisteredBy ────│───────│── CreatedBy  │       │
│           │               │  CreatedAt        │       │   CreatedAt  │       │
│           │               │  UpdatedAt        │       │   UpdatedAt  │       │
│           │               └────────┬─────────┘       └──────┬────────┘       │
│           │                        │                        │               │
│           │     ┌──────────────────┴──────┐         ┌───────┴─────────┐     │
│           │     │   Promotion_Vehicle      │         │                 │     │
│           │     │                         │         │                 │     │
│           │     │ (PK)PromotionID ────────│─────────│──► Promotion    │     │
│           │     │ (PK)Plate_Number ───────│─────────│──► Vehicle      │     │
│           │     │   Performance           │         │                 │     │
│           │     │   CreatedAt             │         │                 │     │
│           │     └────────────────────────┘         │                 │     │
│           │                                        └─────────────────┘     │
│           │                                                                 │
│           │     ┌───────────────────┐        ┌─────────────────────┐       │
│           │     │   Customer        │        │   Activity_Logs     │       │
│           │     │                   │        │                     │       │
│           │     │ (PK)CustomerID    │        │ (PK)LogID           │       │
│           │     │   FirstName       │        │   UserName ─────────│───────│───►
│           ◄─────│─── LastName       │        │   Action            │       │
│           │     │   Email           │        │   Entity            │       │
│           │     │   PhoneNumber     │        │   EntityID          │       │
│           │     │   Status          │        │   Details (JSON)    │       │
│           │     │   RegisteredBy ───│────────│─── IPAddress        │       │
│           │     │   CreatedAt       │        │   CreatedAt         │       │
│           │     │   UpdatedAt       │        └─────────────────────┘       │
│           │     └───────────────────┘                                       │
│           │                                                                 │
│           │     ┌─────────────────────┐                                     │
│           │     │   Notifications     │                                     │
│           │     │                     │                                     │
│           ◄─────│─── UserName         │                                     │
│           │     │   Title             │                                     │
│           │     │   Message           │                                     │
│           │     │   Type              │                                     │
│           │     │   IsRead            │                                     │
│           │     │   CreatedAt         │                                     │
│           │     └─────────────────────┘                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

**Legend:** ────────► = Foreign Key relationship (child → parent)
◄────── = Referenced by other tables
(PK) = Primary Key

**Relationship Summary:**
- Users ──(1)──→ (N) Vehicle        (RegisteredBy)
- Users ──(1)──→ (N) Customer       (RegisteredBy)
- Users ──(1)──→ (N) Promotion      (CreatedBy)
- Users ──(1)──→ (N) Activity_Logs  (UserName)
- Users ──(1)──→ (N) Notifications  (UserName)
- Vehicle ──(N)──→ (M) Promotion    (via Promotion_Vehicle junction)
```

---

## Table Schemas

### 1. Users

**Purpose:** Authentication and role-based access control for all system users.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `UserName` | TEXT | **PRIMARY KEY** NOT NULL | — | Unique login username |
| `Password` | TEXT | NOT NULL | — | bcrypt-hashed password (12 salt rounds) |
| `Role` | TEXT | NOT NULL | `'viewer'` | `'admin'` \| `'staff'` \| `'viewer'` |
| `Email` | TEXT | — | `NULL` | User email address |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Account creation timestamp (ISO 8601) |
| `LastLogin` | TEXT | — | `NULL` | Last successful login timestamp |

**Indexes:** None (PK is automatically indexed)

**Sample Row:**
```json
{
  "UserName": "admin",
  "Password": "$2b$12$JZym.rJ.pFWbPATAN3RTReMAZdNgSlC80zjwZijYd9SoftJG6qwsS",
  "Role": "admin",
  "Email": null,
  "CreatedAt": "2026-06-08 08:17:37",
  "LastLogin": null
}
```

---

### 2. Vehicle

**Purpose:** Track vehicle inventory with status, pricing, and registration details.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `Plate_Number` | TEXT | **PRIMARY KEY** NOT NULL | — | Unique vehicle registration plate (e.g., `RAB-123A`) |
| `Brand` | TEXT | NOT NULL | — | Manufacturer name (e.g., Toyota, Honda) |
| `Model` | TEXT | NOT NULL | — | Model name (e.g., Corolla, Civic) |
| `Year` | INTEGER | NOT NULL | — | Manufacturing year (1900–2030 range validated) |
| `Vehicle_Type` | TEXT | NOT NULL | — | `Sedan` \| `SUV` \| `Truck` \| `Van` \| `Motorcycle` \| `Bus` \| `Convertible` |
| `Purchase_Price` | REAL | NOT NULL | — | Purchase/acquisition price (≥ 0) |
| `Status` | TEXT | NOT NULL | `'Available'` | `Available` \| `Rented` \| `Sold` \| `Maintenance` |
| `RegisteredBy` | TEXT | NOT NULL FK→Users(UserName) | — | User who registered this vehicle |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Record creation timestamp |
| `UpdatedAt` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp |

**Indexes:**
| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `idx_vehicle_status` | `Status` | Fast filtering by vehicle status |
| `idx_vehicle_brand` | `Brand` | Fast search/filter by brand |

**Business Rules:**
- Plate_Number is uppercased on create (validation regex: `^[A-Za-z0-9-]+$`)
- Purchase_Price is in RWF (Rwandan Franc)
- Plate_Number cannot be changed after creation (disabled in edit form)

---

### 3. Customer

**Purpose:** Manage customer relationships and contact information.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `CustomerID` | INTEGER | **PRIMARY KEY** AUTOINCREMENT | — | Unique customer identifier |
| `FirstName` | TEXT | NOT NULL | — | Customer first name (max 100 chars) |
| `LastName` | TEXT | NOT NULL | — | Customer last name (max 100 chars) |
| `Email` | TEXT | NOT NULL | — | Validated email address (unique enforced) |
| `PhoneNumber` | TEXT | NOT NULL | — | Contact phone number |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Record creation timestamp |
| `UpdatedAt` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp |
| `Status` | TEXT | NOT NULL | `'Active'` | `Active` \| `Inactive` \| `Blocked` |
| `RegisteredBy` | TEXT | NOT NULL FK→Users(UserName) | — | User who registered this customer |

**Indexes:**
| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `idx_customer_status` | `Status` | Fast filtering by customer status |
| `idx_customer_email` | `Email` | Fast email lookup and duplicate detection |

**Business Rules:**
- Email must be unique (checked at application level before INSERT)
- FirstName and LastName are trimmed of whitespace before storage
- Customer can be soft-deleted by setting Status to `Inactive` or `Blocked`

---

### 4. Promotion

**Purpose:** Define and manage promotional discount campaigns.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `PromotionID` | INTEGER | **PRIMARY KEY** AUTOINCREMENT | — | Unique promotion identifier |
| `Title` | TEXT | NOT NULL | — | Promotion name/title |
| `Description` | TEXT | — | `NULL` | Detailed description of the promotion |
| `Discount_Type` | TEXT | NOT NULL | — | `free` \| `percentage` \| `FLAT_RATE` \| `CASHBACK` \| `BUY_ONE_GET_ONE` \| `Bundle` \| `amount` |
| `Discount_Value` | REAL | NOT NULL | — | Amount or percentage value (≥ 0) |
| `Start_Date` | TEXT | NOT NULL | — | ISO 8601 start date (`YYYY-MM-DD`) |
| `End_Date` | TEXT | NOT NULL | — | ISO 8601 end date (`YYYY-MM-DD`) |
| `Status` | TEXT | NOT NULL | `'Active'` | `Active` \| `Inactive` \| `Expired` |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Record creation timestamp |
| `UpdatedAt` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp |
| `CreatedBy` | TEXT | NOT NULL FK→Users(UserName) | — | User who created this promotion |

**Indexes:**
| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `idx_promotion_status` | `Status` | Fast filtering by promotion status |
| `idx_promotion_dates` | `Start_Date, End_Date` | Efficient date range queries for active promotions |

**Discount Type Labels:**
| Database Value | Display Label | Description |
|--------------|--------------|-------------|
| `free` | Free | Product/service is free |
| `percentage` | Percentage (%) | Discount as a percentage of price |
| `FLAT_RATE` | Flat Rate ($) | Fixed amount off |
| `CASHBACK` | Cashback | Cash returned after purchase |
| `BUY_ONE_GET_ONE` | BOGO | Buy one, get one free |
| `Bundle` | Bundle | Package deal discount |
| `amount` | Amount ($) | Specific amount discount |

**Business Rules:**
- End_Date must be strictly after Start_Date
- The report query automatically filters to currently active promotions (`datetime('now')` between Start_Date and End_Date)

---

### 5. Promotion_Vehicle

**Purpose:** Many-to-many junction table linking promotions to vehicles.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `PromotionID` | INTEGER | **PRIMARY KEY** NOT NULL FK→Promotion(PromotionID) ON DELETE CASCADE | — | Associated promotion ID |
| `Plate_Number` | TEXT | **PRIMARY KEY** NOT NULL FK→Vehicle(Plate_Number) ON DELETE CASCADE | — | Associated vehicle plate |
| `Performance` | TEXT | — | `NULL` | Performance notes (e.g., Excellent, Good, Average) |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Link creation timestamp |

**Indexes:** None (composite PK is automatically indexed)

**Constraints:**
| Constraint | Detail |
|-----------|--------|
| **Composite PK** | `(PromotionID, Plate_Number)` — each vehicle-promotion pair is unique |
| **Cascade Delete** | Deleting a promotion or vehicle automatically removes all related links |
| **Referential Integrity** | Both PromotionID and Plate_Number must reference existing records |

---

### 6. Activity_Logs

**Purpose:** Comprehensive audit trail for all system actions.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `LogID` | INTEGER | **PRIMARY KEY** AUTOINCREMENT | — | Unique log entry ID |
| `UserName` | TEXT | NOT NULL FK→Users(UserName) | — | User who performed the action |
| `Action` | TEXT | NOT NULL | — | `CREATE` \| `UPDATE` \| `DELETE` \| `LOGIN` \| `LOGOUT` \| `LINK` \| `UNLINK` \| `VIEW_REPORT` |
| `Entity` | TEXT | NOT NULL | — | Affected entity type: `Users` \| `Vehicle` \| `Customer` \| `Promotion` \| `Promotion_Vehicle` \| `Report` |
| `EntityID` | TEXT | — | `NULL` | ID of the affected record (e.g., plate number, customer ID) |
| `Details` | TEXT | — | `NULL` | JSON string with action details and changed values |
| `IPAddress` | TEXT | — | `NULL` | Client IP address that performed the action |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Log entry timestamp |

**Indexes:**
| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `idx_activity_user` | `UserName` | Filter audit trail by user |
| `idx_activity_created` | `CreatedAt` | Sort and filter logs by time |

**Logged Actions:**
| Action | When | Details Captured |
|--------|------|-----------------|
| `CREATE` | Record created | New field values |
| `UPDATE` | Record modified | Changed field values |
| `DELETE` | Record deleted | Original record identifier and name |
| `LOGIN` | User logged in | IP address |
| `LOGOUT` | User logged out | — |
| `LINK` | Vehicle linked to promotion | PromotionID and Plate_Number |
| `UNLINK` | Vehicle removed from promotion | PromotionID and Plate_Number |
| `VIEW_REPORT` | Report generated | Report type |

---

### 7. Notifications

**Purpose:** In-app notification system for user alerts and updates.

| Column | Type | Constraints | Default | Description |
|---------|------|-------------|---------|-------------|
| `NotificationID` | INTEGER | **PRIMARY KEY** AUTOINCREMENT | — | Unique notification ID |
| `UserName` | TEXT | NOT NULL FK→Users(UserName) | — | Target recipient user |
| `Title` | TEXT | NOT NULL | — | Notification title |
| `Message` | TEXT | NOT NULL | — | Notification body text |
| `Type` | TEXT | NOT NULL | `'info'` | `info` \| `success` \| `warning` \| `error` |
| `IsRead` | INTEGER | NOT NULL | `0` | Read status: `0` = unread, `1` = read |
| `CreatedAt` | TEXT | NOT NULL | `datetime('now')` | Notification timestamp |

**Indexes:**
| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `idx_notification_user` | `UserName, IsRead` | Efficiently fetch unread notifications per user |

**Notification Types:**
| Type | Use Case | Example |
|------|----------|---------|
| `info` | General information | "New promotion added" |
| `success` | Successful operation | "Vehicle RAB-123A linked successfully" |
| `warning` | Warning alert | "Promotion ABC is expiring soon" |
| `error` | Error notification | "Failed to process customer update" |

---

## Complete API Reference

### Authentication

Base path: `/api/auth`

#### `POST /api/auth/login`

Authenticate a user and return a session + JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "username": "admin",
    "role": "admin",
    "email": null
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid username or password"
}
```

**Rate Limit:** 10 attempts per 15 minutes

---

#### `POST /api/auth/logout`

End the current user session.

**Headers:** `Authorization: Bearer <token>` or session cookie

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

#### `GET /api/auth/session`

Check the current session status.

**Success Response (200) — Authenticated:**
```json
{
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Success Response (200) — Not Authenticated:**
```json
{
  "user": null
}
```

---

#### `POST /api/auth/register`

Create a new user. **Admin only.**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newstaff",
  "password": "StaffPass123",
  "role": "staff",
  "email": "staff@swiftwheels.com"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully"
}
```

**Error Response (409):**
```json
{
  "error": "Username already exists"
}
```

---

#### `GET /api/auth/users`

List all users. **Admin only.**

**Success Response (200):**
```json
[
  {
    "UserName": "admin",
    "Role": "admin",
    "Email": null,
    "CreatedAt": "2026-06-08 08:17:37",
    "LastLogin": null
  }
]
```

---

#### `POST /api/auth/verify-token`

Verify a JWT token's validity.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

---

### Vehicles

Base path: `/api/vehicles`

#### `GET /api/vehicles`

List all vehicles with pagination and search.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `search` | string | — | Search by plate, brand, model, or type |

**Success Response (200):**
```json
{
  "data": [
    {
      "Plate_Number": "RAB-123A",
      "Brand": "Toyota",
      "Model": "Corolla",
      "Year": 2025,
      "Vehicle_Type": "Sedan",
      "Purchase_Price": 25000,
      "Status": "Available",
      "RegisteredBy": "admin",
      "RegisteredByName": "admin",
      "CreatedAt": "2026-06-08 08:17:37",
      "UpdatedAt": "2026-06-08 08:17:37"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/vehicles/:plate`

Get a single vehicle by plate number.

**Success Response (200):** Vehicle object (same fields as above)

**Error Response (404):**
```json
{
  "error": "Vehicle not found with plate number: RAB-999"
}
```

---

#### `POST /api/vehicles`

Create a new vehicle. **Staff+ required.**

**Request Body:**
```json
{
  "Plate_Number": "RAB-456B",
  "Brand": "Honda",
  "Model": "Civic",
  "Year": 2024,
  "Vehicle_Type": "Sedan",
  "Purchase_Price": 22000,
  "Status": "Available"
}
```

**Success Response (201):**
```json
{
  "message": "Vehicle created successfully",
  "plateNumber": "RAB-456B"
}
```

**Error Response (409):**
```json
{
  "error": "Vehicle with plate number RAB-456B already exists"
}
```

---

#### `PUT /api/vehicles/:plate`

Update an existing vehicle. **Staff+ required.**

**Request Body:** Same as POST (without Plate_Number)

**Success Response (200):**
```json
{
  "message": "Vehicle updated successfully"
}
```

---

#### `DELETE /api/vehicles/:plate`

Delete a vehicle. **Admin only.**

**Success Response (200):**
```json
{
  "message": "Vehicle deleted successfully"
}
```

---

### Customers

Base path: `/api/customers`

#### `GET /api/customers`

List all customers with pagination and search.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `search` | string | — | Search by name, email, or phone |

**Success Response (200):**
```json
{
  "data": [
    {
      "CustomerID": 1,
      "FirstName": "Jean",
      "LastName": "Pierre",
      "Email": "jean@example.com",
      "PhoneNumber": "+250 788 123 456",
      "CreatedAt": "2026-06-08 08:17:37",
      "UpdatedAt": "2026-06-08 08:17:37",
      "Status": "Active",
      "RegisteredBy": "admin",
      "RegisteredByName": "admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/customers/:id`

Get a single customer by ID.

---

#### `POST /api/customers`

Create a new customer. **Staff+ required.**

**Request Body:**
```json
{
  "FirstName": "Jean",
  "LastName": "Pierre",
  "Email": "jean@example.com",
  "PhoneNumber": "+250 788 123 456",
  "Status": "Active"
}
```

---

#### `PUT /api/customers/:id`

Update a customer. **Staff+ required.**

---

#### `DELETE /api/customers/:id`

Delete a customer. **Admin only.**

---

### Promotions

Base path: `/api/promotions`

#### `GET /api/promotions`

List all promotions with pagination and search.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `search` | string | — | Search by title, description, or discount type |

**Success Response (200):**
```json
{
  "data": [
    {
      "PromotionID": 1,
      "Title": "New Year Sale",
      "Description": "Start the year with great savings!",
      "Discount_Type": "percentage",
      "Discount_Value": 15,
      "Start_Date": "2026-01-01",
      "End_Date": "2026-12-31",
      "Status": "Active",
      "CreatedBy": "admin",
      "CreatedByName": "admin",
      "CreatedAt": "2026-06-08 08:17:37",
      "UpdatedAt": "2026-06-08 08:17:37"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/promotions/:id`

Get a single promotion by ID.

---

#### `POST /api/promotions`

Create a new promotion. **Staff+ required.**

**Request Body:**
```json
{
  "Title": "New Year Sale",
  "Description": "Start the year with great savings!",
  "Discount_Type": "percentage",
  "Discount_Value": 15,
  "Start_Date": "2026-01-01",
  "End_Date": "2026-12-31",
  "Status": "Active"
}
```

**Validation:** End_Date must be after Start_Date.

---

#### `PUT /api/promotions/:id`

Update a promotion. **Staff+ required.**

---

#### `DELETE /api/promotions/:id`

Delete a promotion. **Admin only.**

**Notes:** This cascades to delete all related Promotion_Vehicle links.

---

#### `GET /api/promotions/:id/vehicles`

Get all vehicles linked to a promotion.

---

#### `POST /api/promotions/:id/vehicles`

Link a vehicle to a promotion. **Staff+ required.**

**Request Body:**
```json
{
  "Plate_Number": "RAB-123A",
  "Performance": "Excellent"
}
```

**Error Response (409):**
```json
{
  "error": "Vehicle already linked to this promotion"
}
```

---

#### `PUT /api/promotions/:id/vehicles/:plate`

Update performance for a linked vehicle. **Staff+ required.**

**Request Body:**
```json
{
  "Performance": "Good"
}
```

---

#### `DELETE /api/promotions/:id/vehicles/:plate`

Remove a vehicle link from a promotion. **Admin only.**

---

### Reports

Base path: `/api/reports`

#### `GET /api/reports/stats`

Get dashboard statistics.

**Success Response (200):**
```json
{
  "totalVehicles": 10,
  "activeVehicles": 7,
  "rentedVehicles": 2,
  "soldVehicles": 1,
  "totalCustomers": 15,
  "activeCustomers": 12,
  "inactiveCustomers": 2,
  "blockedCustomers": 1,
  "totalPromotions": 5,
  "activePromotions": 3,
  "expiredPromotions": 1,
  "recentActivities": 42,
  "unreadNotifications": 3
}
```

---

#### `GET /api/reports/customer-promotions`

Generate the cross-entity report of active customers with available vehicles and active promotions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page |

**Report Logic:**
```
Customers (Status = 'Active')
  CROSS JOIN Vehicles (Status = 'Available')
    JOIN Promotion_Vehicle ON Plate_Number
      JOIN Promotions (Status = 'Active', Start_Date <= now <= End_Date)
```

**Success Response (200):**
```json
{
  "data": [
    {
      "CustomerName": "Jean Pierre",
      "CustomerEmail": "jean@example.com",
      "CustomerPhone": "+250 788 123 456",
      "VehicleBrand": "Toyota",
      "VehicleModel": "Corolla",
      "VehiclePlate": "RAB-123A",
      "PromotionTitle": "New Year Sale",
      "DiscountValue": 15,
      "DiscountType": "percentage",
      "DiscountTypeLabel": "Percentage",
      "Performance": "Excellent",
      "PromotionStart": "2026-01-01",
      "PromotionEnd": "2026-12-31"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/reports/activity`

Get audit activity logs. **Admin only.**

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page |

---

#### `GET /api/reports/notifications`

Get notifications for the current user.

**Success Response (200):**
```json
[
  {
    "NotificationID": 1,
    "UserName": "admin",
    "Title": "New Customer Registered",
    "Message": "Customer Jean Pierre has been registered successfully.",
    "Type": "info",
    "IsRead": 0,
    "CreatedAt": "2026-06-08 10:00:00"
  }
]
```

---

#### `PUT /api/reports/notifications/:id/read`

Mark a notification as read.

**Success Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

---

### Health Check

#### `GET /api/health`

Check API server status.

**Success Response (200):**
```json
{
  "status": "ok",
  "message": "PMS API is running",
  "timestamp": "2026-06-08T10:00:00.000Z",
  "environment": "development"
}
```

---

## Business Rules & Validation

### Field-Level Validation

| Entity | Field | Rule | Error Message |
|--------|-------|------|---------------|
| **Users** | `UserName` | Required, 3–50 chars, alphanumeric + underscores | `Username is required`, `Username must be 3-50 characters` |
| **Users** | `Password` | Required, min 6 chars | `Password must be at least 6 characters` |
| **Users** | `Role` | One of: `admin`, `staff`, `viewer` | `Invalid role` |
| **Vehicle** | `Plate_Number` | Required, alphanumeric + hyphens only | `Plate number is required` |
| **Vehicle** | `Year` | Integer, 1900–2030 | `Year must be between 1900 and 2030` |
| **Vehicle** | `Purchase_Price` | Float ≥ 0 | `Purchase price must be a positive number` |
| **Vehicle** | `Status` | One of: `Available`, `Rented`, `Sold`, `Maintenance` | `Invalid status` |
| **Customer** | `FirstName` | Required, max 100 chars | `First name is required` |
| **Customer** | `LastName` | Required, max 100 chars | `Last name is required` |
| **Customer** | `Email` | Valid email format, normalized | `Valid email is required` |
| **Customer** | `Status` | One of: `Active`, `Inactive`, `Blocked` | `Invalid status` |
| **Promotion** | `Title` | Required | `Title is required` |
| **Promotion** | `Discount_Type` | One of: `free`, `percentage`, `FLAT_RATE`, `CASHBACK`, `BUY_ONE_GET_ONE`, `Bundle`, `amount` | `Invalid discount type` |
| **Promotion** | `Discount_Value` | Float ≥ 0 | `Discount value must be a positive number` |
| **Promotion** | `Start_Date` | Valid ISO 8601 date | `Start date must be a valid date` |
| **Promotion** | `End_Date` | Valid ISO 8601 date, after Start_Date | `End date must be a valid date` |
| **Promotion** | `Status` | One of: `Active`, `Inactive`, `Expired` | `Invalid status` |
| **Promotion_Vehicle** | `Plate_Number` | Must reference existing vehicle | `Vehicle not found` |
| **Promotion_Vehicle** | `PromotionID` | Must reference existing promotion | `Promotion not found` |

### Business Rules Summary

| Rule | Entity | Description |
|------|--------|-------------|
| Email Uniqueness | Customer | No two customers can share the same email |
| Plate Uniqueness | Vehicle | Plate numbers are globally unique and uppercased |
| Date Ordering | Promotion | End_Date must be strictly after Start_Date |
| Cascade Delete | Promotion_Vehicle | Deleting a Promotion or Vehicle removes all junction links |
| Role Protection | All | Higher roles can perform all actions of lower roles |
| Session + JWT | Auth | Supports both session cookies and Bearer JWT tokens |
| Rate Limiting | Auth | Login endpoint limited to 10 requests per 15 minutes |
| Audit Logging | All | All create, update, delete operations are logged |

---

## Security Model

### Role Hierarchy

```
admin (level 3) ─── Full access ─── Can create, read, update, delete everything
staff (level 2) ─── CRUD access ─── Can create, read, update (no delete)
viewer (level 1) ── Read-only ───── Can only view data
```

### Permission Matrix

| Operation | admin | staff | viewer |
|-----------|-------|-------|--------|
| View records | ✅ | ✅ | ✅ |
| Create records | ✅ | ✅ | ❌ |
| Update records | ✅ | ✅ | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

### Authentication Flow

```
┌──────────┐    POST /api/auth/login     ┌──────────────┐
│  Client  │ ──────────────────────────→  │  Express.js  │
│          │ ←──────────────────────────  │              │
│          │    { token, user }          │  Validate    │
│          │                              │  credentials │
│          │    Subsequent requests:       │  with bcrypt │
│          │    Authorization: Bearer JWT │              │
│          │ ──────────────────────────→  │  Verify JWT  │
│          │    OR session cookie         │  or session  │
└──────────┘                              └──────────────┘
```

### Security Headers (via Helmet)

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `Strict-Transport-Security` | Enabled (production) | Enforce HTTPS |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter (modern recommendation) |
| `Content-Security-Policy` | Disabled (development API) | CSP control |

### Session Configuration

| Setting | Value |
|---------|-------|
| Session Name | `pms_sid` |
| Max Age | 24 hours |
| HTTP Only | `true` |
| Same Site | `lax` |
| Secure | `true` (production only) |

---

## Database Initialization

The database is automatically initialized on the first server start. The initialization sequence:

```
1. Check if pms.db exists on disk
   ├── YES → Load existing database file
   └── NO  → Create new empty SQLite database

2. Enable foreign key constraints: PRAGMA foreign_keys = ON

3. Create all tables (IF NOT EXISTS):
   ├── Users
   ├── Vehicle
   ├── Customer
   ├── Promotion
   ├── Promotion_Vehicle
   ├── Activity_Logs
   └── Notifications

4. Create all performance indexes (IF NOT EXISTS):
   ├── idx_vehicle_status
   ├── idx_vehicle_brand
   ├── idx_customer_status
   ├── idx_customer_email
   ├── idx_promotion_status
   ├── idx_promotion_dates
   ├── idx_activity_user
   ├── idx_activity_created
   └── idx_notification_user

5. Check if any users exist
   ├── 0 users → Seed default admin:
   │   Username: admin (or DEFAULT_ADMIN_USER)
   │   Password: Admin@123 (or DEFAULT_ADMIN_PASSWORD)
   │   Role: admin
   └── > 0 users → Skip seeding

6. Save database to disk

7. Schedule automatic backups
   └── Run initial backup immediately
```

---

## Backup System

### Backup Schedule

| Event | Timing |
|-------|--------|
| Initial backup | Immediately on server start |
| Recurring backup | Every 24 hours (configurable via `BACKUP_INTERVAL_HOURS`) |
| Shutdown backup | On graceful server shutdown |
| Old backup cleanup | Every backup cycle (retention: 7 days, configurable) |

### Backup File Format

```
backups/
├── pms-backup-2026-06-08T10-00-00-000Z.db
├── pms-backup-2026-06-09T10-00-00-000Z.db
└── pms-backup-2026-06-10T10-00-00-000Z.db
```

### Restore Procedure

To restore from a backup:
```bash
# Stop the server
# Copy the backup file to replace the main database
cp backups/pms-backup-2026-06-10T10-00-00-000Z.db pms.db
# Restart the server
npm start
```

---

## Logging System

### Log Files

| File | Level | Location | Max Size | Retention |
|------|-------|----------|----------|-----------|
| `error.log` | `error` only | `backend/logs/error.log` | 5 MB | 5 rotated files |
| `combined.log` | all levels | `backend/logs/combined.log` | 5 MB | 5 rotated files |

### Log Format (JSON)

```json
{
  "level": "info",
  "message": "PMS API Server running on http://localhost:5000",
  "service": "pms-api",
  "timestamp": "2026-06-08 10:00:00"
}
```

### Console Output (Development Only)

In development mode, logs also stream to the console with colorized output. In production, only file logging is active.

---

## Notification System

### How Notifications Work

1. **Creation:** Notifications are created programmatically via `db.createNotification(user, title, message, type)` in the backend
2. **Storage:** Stored in the `Notifications` table with `IsRead = 0`
3. **Retrieval:** Frontend polls `GET /api/reports/notifications` every 30 seconds
4. **Mark as Read:** Frontend calls `PUT /api/reports/notifications/:id/read` when user views a notification
5. **Display:** Sidebar shows unread count badge; dropdown lists recent 20 notifications

### Notification Flow

```
┌─────────────┐    30s poll     ┌──────────────┐
│   Frontend   │ ──────────────→  │   Backend   │
│              │ ←──────────────  │             │
│  Sidebar     │    Notification  │  SELECT ...  │
│  badge +     │    list (max 20) │  WHERE IsRead│
│  dropdown    │                  │  = 0         │
└─────────────┘                  └──────────────┘
```

---

## Audit Trail System

### What Gets Logged

Every `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `LINK`, `UNLINK`, and `VIEW_REPORT` action is automatically recorded in `Activity_Logs` via `db.logActivity()`.

### Sample Audit Entry

```json
{
  "LogID": 42,
  "UserName": "admin",
  "Action": "CREATE",
  "Entity": "Vehicle",
  "EntityID": "RAB-123A",
  "Details": "{\"Brand\":\"Toyota\",\"Model\":\"Corolla\",\"Year\":2025,\"Purchase_Price\":25000}",
  "IPAddress": "::1",
  "CreatedAt": "2026-06-08 10:00:00"
}
```

### Audit In Action (CRUD Sequence)

```
User creates a vehicle:
  LOG: admin CREATE Vehicle RAB-123A {details}

User updates the vehicle:
  LOG: admin UPDATE Vehicle RAB-123A {changed fields}

User deletes the vehicle:
  LOG: admin DELETE Vehicle RAB-123A {original name}
```

---

## Sample SQL Queries

### Dashboard Stats Query

```sql
SELECT
  (SELECT COUNT(*) FROM Vehicle) AS totalVehicles,
  (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Available') AS activeVehicles,
  (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Rented') AS rentedVehicles,
  (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Sold') AS soldVehicles,
  (SELECT COUNT(*) FROM Customer) AS totalCustomers,
  (SELECT COUNT(*) FROM Customer WHERE Status = 'Active') AS activeCustomers,
  (SELECT COUNT(*) FROM Customer WHERE Status = 'Inactive') AS inactiveCustomers,
  (SELECT COUNT(*) FROM Customer WHERE Status = 'Blocked') AS blockedCustomers,
  (SELECT COUNT(*) FROM Promotion) AS totalPromotions,
  (SELECT COUNT(*) FROM Promotion WHERE Status = 'Active') AS activePromotions,
  (SELECT COUNT(*) FROM Promotion WHERE Status = 'Expired') AS expiredPromotions,
  (SELECT COUNT(*) FROM Activity_Logs
    WHERE datetime(CreatedAt) >= datetime('now', '-7 days')) AS recentActivities,
  (SELECT COUNT(*) FROM Notifications WHERE IsRead = 0) AS unreadNotifications;
```

### Customer Promotions Report Query

```sql
SELECT
  c.FirstName || ' ' || c.LastName AS CustomerName,
  c.Email AS CustomerEmail,
  c.PhoneNumber AS CustomerPhone,
  v.Brand AS VehicleBrand,
  v.Model AS VehicleModel,
  v.Plate_Number AS VehiclePlate,
  p.Title AS PromotionTitle,
  p.Discount_Value AS DiscountValue,
  p.Discount_Type AS DiscountType,
  pv.Performance,
  p.Start_Date AS PromotionStart,
  p.End_Date AS PromotionEnd
FROM Customer c
CROSS JOIN Vehicle v
JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Plate_Number
JOIN Promotion p ON pv.PromotionID = p.PromotionID
WHERE c.Status = 'Active'
  AND v.Status = 'Available'
  AND p.Status = 'Active'
  AND datetime(p.Start_Date) <= datetime('now')
  AND datetime(p.End_Date) >= datetime('now')
ORDER BY c.LastName, c.FirstName, v.Brand, v.Model;
```

### Search Vehicles Query (Dynamic)

```sql
SELECT v.*, u.UserName AS RegisteredByName
FROM Vehicle v
JOIN Users u ON v.RegisteredBy = u.UserName
WHERE v.Plate_Number LIKE '%search%'
   OR v.Brand LIKE '%search%'
   OR v.Model LIKE '%search%'
   OR v.Vehicle_Type LIKE '%search%'
ORDER BY v.Plate_Number
LIMIT 20 OFFSET 0;
```

### Get Linked Vehicles for Promotion Query

```sql
SELECT v.*, pv.Performance, pv.CreatedAt AS LinkedAt
FROM Vehicle v
JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Plate_Number
WHERE pv.PromotionID = ?;
```

### Unread Notifications Query

```sql
SELECT *
FROM Notifications
WHERE UserName = ? AND IsRead = 0
ORDER BY CreatedAt DESC
LIMIT 20;
```

---

## Environment Configuration

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | API server port |
| `DB_PATH` | `./pms.db` | SQLite database file path |
| `JWT_SECRET` | (required in production) | Secret key for JWT token signing |
| `SESSION_SECRET` | `fallback-session-secret` | Session encryption secret |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `DEFAULT_ADMIN_USER` | `admin` | Default admin username for seeding |
| `DEFAULT_ADMIN_PASSWORD` | `Admin@123` | Default admin password (change in production!) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Rate limit window |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiry |
| `HTTPS_ENABLED` | `false` | Enable HTTPS |
| `HTTPS_CERT_PATH` | `./certs/cert.pem` | SSL certificate path |
| `HTTPS_KEY_PATH` | `./certs/key.pem` | SSL key path |
| `DB_BACKUP_DIR` | `./backups` | Database backup directory |
| `BACKUP_INTERVAL_HOURS` | `24` | Hours between automatic backups |
| `BACKUP_RETENTION_DAYS` | `7` | Days to retain backups |

### Sample `.env` File

```env
PORT=5000
NODE_ENV=development
DB_PATH=./pms.db
JWT_SECRET=your-super-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=Admin@123
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
JWT_EXPIRES_IN=24h
HTTPS_ENABLED=false
DB_BACKUP_DIR=./backups
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=7
```

---

## Error Handling

### Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "Plate_Number",
      "message": "Plate number is required"
    },
    {
      "field": "Year",
      "message": "Year must be between 1900 and 2030"
    }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning | When |
|------|---------|------|
| `200` | Success | GET, PUT, DELETE successes |
| `201` | Created | POST successes |
| `400` | Bad Request | Validation failures, invalid dates, etc. |
| `401` | Unauthorized | Missing or invalid credentials |
| `403` | Forbidden | Insufficient role permissions |
| `404` | Not Found | Resource not found by ID |
| `409` | Conflict | Duplicate email, plate, or link |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Error | Unexpected server errors |

---

## Frontend–Backend Data Flow

### Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                          │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Login     │  │  Dashboard  │  │  Vehicles   │  │ Customers  │ │
│  │   Page      │  │   Page      │  │   Page      │  │   Page     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │               │        │
│  ┌──────┴────────────────┴────────────────┴───────────────┴──────┐ │
│  │                  API Service (axios)                            │ │
│  │  • Base URL: /api                                               │ │
│  │  • Auth: JWT via Authorization header or session cookie         │ │
│  │  • Request interceptor: attaches token                          │ │
│  │  • Response interceptor: handles 401                            │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ HTTP (localhost:5173 → localhost:5000)
                                │ via Vite proxy or CORS
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Express.js API Server                           │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Auth    │  │ Vehicle  │  │ Customer │  │Promotion │            │
│  │  Routes  │  │ Routes   │  │ Routes   │  │ Routes   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │             │             │                  │
│  ┌────┴──────────────┴─────────────┴─────────────┴─────────────┐   │
│  │                  Middleware Stack                             │   │
│  │  • Helmet (security headers)    • CORS                       │   │
│  │  • Rate Limiting                • Session                    │   │
│  │  • Morgan (HTTP logging)        • Auth (JWT/session)         │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                                │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐   │
│  │                  Database Layer (sql.js)                      │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │
│  │  │  Users   │  │ Vehicle  │  │ Customer │  │  Promotion   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┬───────┘ │   │
│  │                                                     │         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │         │   │
│  │  │Activity  │  │Notificat.│  │Promotion_Vehi│◄─────┘         │   │
│  │  │_Logs     │  │ions      │  │cle (junction)│               │   │
│  │  └──────────┘  └──────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Request/Response Lifecycle

```
1. User interacts with React UI
2. React component calls API service function
3. API service (axios) attaches JWT token (if available)
4. Request sent to Express.js server (via Vite proxy in dev)
5. Server middleware processes:
   a. Helmet sets security headers
   b. Morgan logs the HTTP request
   c. CORS validates the origin
   d. Rate limiter checks request count
   e. Session/JWT auth middleware validates credentials
   f. Route handler processes the request
6. Route handler queries/updates SQLite database via db helpers
7. Business logic/validation applied
8. Activity logged to Activity_Logs (if applicable)
9. Response sent back to frontend
10. React component updates UI with response data
```

### Vite Proxy Configuration (Development)

In development, the frontend dev server proxies API requests to the backend:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

In production, the Express server serves the built React app from `frontend/dist/`.

---

## Quick Reference

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@123` |
| Role | `admin` |

### Startup Commands

```bash
# Backend
cd backend
npm install
npm start          # Production
npm run dev        # Development (with auto-reload)

# Frontend
cd frontend
npm install
npm run dev        # Development server at localhost:5173
npm run build      # Production build to frontend/dist/
```

### Available Scripts (Backend)

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `node server.js` | Production server |
| `dev` | `nodemon server.js` | Development with auto-restart |
| `backup` | Manual backup trigger | Creates a backup immediately |
| `test` | `node test-api.js` | API integration tests |

### Quick Database Commands

```bash
# Manually trigger a backup
cd backend && npm run backup

# View database file size
ls -lh backend/pms.db

# List backup files
ls -lh backend/backups/

# Delete database and reinitialize
rm backend/pms.db && npm start
```

---

> **Document Version:** 1.0  
> **Last Updated:** June 8, 2026  
> **Author:** Deborah Jocia — National Practical Exam 2026  
> **System:** SwiftWheels Enterprises — Promotion & Marketing Subsystem (PMS)
