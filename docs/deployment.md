# Deployment Guide

## Overview

This document describes how to deploy and operate RoomTrack in a production environment.

---

# Requirements

## Software

- Node.js 22 or later
- npm
- Git

## Environment Variables

RoomTrack requires a `.env` file.

Example:

```env
PORT=3000
DB_PATH=roomtrack.db
SESSION_SECRET=replace-with-a-secure-random-secret
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd roomtrack-api
```

Install dependencies:

```bash
npm install
```

---

# Database Initialization

RoomTrack automatically initializes the database schema during startup and user provisioning.

No manual database setup is required.

---

# Create Initial Administrator

Before first use, create an administrator account:

```bash
npm run create-user
```

Example:

```text
Username: admin
Password: ********
Role (admin/staff): admin
```

Verify the account is created successfully before continuing.

---

# Starting the Application

Start the API:

```bash
npm start
```

The application should start successfully and connect to the configured database.

---

# Health Check

Verify the application is running:

```http
GET /status
```

Expected response:

```json
{
  "success": true,
  "status": "ok"
}
```

---

# Verification Checklist

After deployment:

- [ ] Application starts successfully
- [ ] Health endpoint responds
- [ ] Admin account can log in
- [ ] Logout works correctly
- [ ] Staff permissions work correctly
- [ ] Admin permissions work correctly
- [ ] Rooms can be viewed
- [ ] Assets can be created
- [ ] Assets can be updated
- [ ] Asset deletion is restricted to administrators

---

# Application Updates

Pull the latest changes:

```bash
git pull
```

Install any new dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Restart the application:

```bash
npm start
```

---

# Security Checklist

- [ ] SESSION_SECRET configured
- [ ] .env file excluded from source control
- [ ] Helmet enabled
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] JSON request limits enabled

---

# Backup and Recovery

See:

```text
docs/backup-and-recovery.md
```

for database backup and restoration procedures.

---

# Troubleshooting

## Application Fails to Start

Verify:

- Node.js version is supported
- `.env` file exists
- `SESSION_SECRET` is configured

## Login Fails

Verify:

- User account exists
- Account is active
- Password is correct

## Database Issues

Verify:

- `DB_PATH` points to the correct database
- File permissions allow read/write access
- Database file exists

---

# Recommended Production Setup

For production deployments:

- Enable HTTPS
- Back up the database regularly
- Store backups off-server
- Monitor application logs
- Test restoration procedures periodically