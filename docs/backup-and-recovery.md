# Backup and Recovery

## Purpose

This document describes how to back up and restore the RoomTrack database and recover administrative access if required.

## Database Location

Default database:

```text
roomtrack.db
```

Production deployments may override the location using:

```env
DB_PATH=<database-path>
```

## Backup Procedure

### Manual Backup

Stop the RoomTrack application.

Create a copy of the database:

#### Linux/macOS

```bash
cp roomtrack.db backups/roomtrack-YYYY-MM-DD.db
```

#### Windows

```cmd
copy roomtrack.db backups\roomtrack-YYYY-MM-DD.db
```

Store backups in a secure location.

## Recovery Procedure

### Restore From Backup

Stop the RoomTrack application.

Replace the database:

#### Linux/macOS

```bash
cp backups/roomtrack-YYYY-MM-DD.db roomtrack.db
```

#### Windows

```cmd
copy backups\roomtrack-YYYY-MM-DD.db roomtrack.db
```

Start the application normally.

Verify:

- Login works
- Rooms can be viewed
- Assets can be viewed
- Room provisioning data is present
- Standard assets are present
- Admin functionality works

## Admin Account Recovery

If no administrator accounts are available, a new administrator account can be created using the user provisioning script.  

Create a new administrator account:

```bash
npm run create-user
```

Example:

```text
Username: admin
Password: ********
Role (admin/staff): admin
```

Verify the new account can:

- Log in
- Access protected routes
- Perform administrator actions

Verify the account is visible in the users table and persists after restarting the application.

## Backup Recommendations

### Minimum Recommendation

- Daily database backup
- Retain backups for 30 days
- Verify restoration quarterly

### Larger Deployments

- Nightly automated backups
- Off-server backup storage
- Documented recovery testing

## Recovery Validation Checklist

After restoring a backup:

- [ ] Application starts successfully
- [ ] Login works
- [ ] Rooms are visible
- [ ] Assets are visible
- [ ] Staff permissions work
- [ ] Admin permissions work
- [ ] Recent data is present