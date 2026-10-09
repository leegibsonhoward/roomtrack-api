# RoomTrack Authentication Design

## Goal

Allow authenticated employees to access RoomTrack.

RoomTrack is an internal employee application and does not support public user registration.

---

## Roles

### Staff

Permissions:

- View rooms
- View assets
- Create assets
- Update asset conditions

### Admin

Permissions:

- All staff permissions
- Delete assets
- Manage employees

---

## Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
```

---

## Authentication Flow

User submits credentials:

```text
username
password
```

RoomTrack:

```text
find user
verify password
create session
```

---

## Endpoints

POST /auth/login

POST /auth/logout

GET /auth/me

---

## Protected Routes

Authentication required:

- GET /rooms
- GET /rooms/:roomId
- GET /rooms/:roomId/assets
- GET /rooms/:roomId/assets/:assetId
- POST /rooms/:roomId/assets
- PATCH /rooms/:roomId/assets/:assetId
- DELETE /rooms/:roomId/assets/:assetId

Authorization rules:

Staff:
- read
- create
- update

Admin:
- read
- create
- update
- delete
```
