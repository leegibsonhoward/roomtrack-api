# RoomTrack API

RoomTrack is a REST API for tracking room assets and determining whether a room has all required assets in good condition.

The API tracks individual assets, their condition, and room requirements. RoomTrack identifies missing and damaged assets and determines whether a room is complete.

## Features

- Room inventory tracking
- Individual asset tracking
- SQLite persistence
- Production room provisioning
- Automatic standard asset provisioning
- Create, retrieve, update, and delete assets
- Track asset condition as good or damaged
- Detect missing required assets
- Detect damaged assets
- Calculate room completion status
- Session-based authentication
- Role-based authorization
- Automatic database initialization
- Automated unit and API integration tests
- Bruno collection for manual API testing

## Requirements

- Node.js
- npm

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/leegibsonhoward/roomtrack-api
```
or if using SSH:
```bash
git clone git@github.com:leegibsonhoward/roomtrack-api.git
```
```bash
cd roomtrack-api
npm install
```

### Running RoomTrack

Create a `.env` file using `.env.example` as a template.

Example:

```env
PORT=3000
DB_PATH=roomtrack.db
SESSION_SECRET=replace-with-secure-random-secret
```

#### First-Time Setup

A new database is automatically initialized with production rooms and standard room assets.

Before logging in, create an administrator account:

```bash
npm run create-user
```

Example:

```text
Username: admin
Password: ********
Role (admin/staff): admin
```

> A newly initialized database contains provisioned rooms and standard room assets, but no user accounts. An administrator account must be created before logging in.  

Start the development server:

```bash
npm run dev
```

Start the server normally:

```bash
npm start
```

By default, the API runs at:

```text
http://localhost:3000
```

## Database

RoomTrack uses SQLite for persistent storage.

By default, RoomTrack stores data in:

```text
roomtrack.db
```

Database files are excluded from Git.

The database path can be changed using the `DB_PATH` environment variable.

For example, the automated API tests use an isolated in-memory SQLite database instead of the development database.

#### Database Initialization

When RoomTrack starts with a new database, the application automatically creates the required database tables.

RoomTrack provisions production rooms automatically and seeds each room with its standard asset inventory.

Provisioning is idempotent and can be safely executed multiple times without creating duplicate rooms or duplicate assets.

## Room Requirements

RoomTrack evaluates each room against its standard room requirements.

The resulting room status includes:

### `missingAssets`

Contains required assets that are not present in sufficient quantity.

For example:

```json
{
  "type": "nightstand",
  "required": 2,
  "actual": 1,
  "missing": 1
}
```

### `damagedAssets`

Contains required assets that are present but have a condition of `damaged`.

### `isComplete`

`isComplete` is `true` when all required assets:

- Are present
- Meet the required quantities
- Are in good condition

Otherwise, `isComplete` is `false`.

A complete room therefore has:

```json
{
  "missingAssets": [],
  "damagedAssets": [],
  "isComplete": true
}
```

## Asset Conditions

RoomTrack currently supports two asset conditions:

```text
good
damaged
```

New assets are created with the default condition:

```text
good
```

### Authentication

RoomTrack uses session-based authentication.

Protected routes require a valid authenticated session.

Authentication endpoints:

```http
POST /auth/login
GET  /auth/me
POST /auth/logout
```

RoomTrack supports the following roles:

- admin
- staff

Administrator accounts can perform all supported operations.

Staff accounts can view rooms and assets and update inventory information but cannot delete assets.

## API Endpoints

### Status

```http
GET /status
```

Returns the current API status.

### List Rooms

```http
GET /rooms
```

Returns all rooms.

### Get Room

```http
GET /rooms/:roomId
```

Returns a specific room and its current room requirement status.

### List Room Assets

```http
GET /rooms/:roomId/assets
```

Returns the assets belonging to a specific room.

### Get Asset

```http
GET /rooms/:roomId/assets/:assetId
```

Returns a specific asset belonging to a room.

### Create Asset

```http
POST /rooms/:roomId/assets
```

Example request body:

```json
{
  "type": "chair"
}
```

New assets are created with a condition of `good`.

### Update Asset Condition

```http
PATCH /rooms/:roomId/assets/:assetId
```

Example request body:

```json
{
  "condition": "damaged"
}
```

Valid conditions are:

```text
good
damaged
```

### Delete Asset

```http
DELETE /rooms/:roomId/assets/:assetId
```

Deletes an asset from the room.

## API Responses

Successful responses generally use the following structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error responses generally use:

```json
{
  "success": false,
  "message": "Error message"
}
```

RoomTrack uses HTTP status codes including:

- 200 for successful retrieval, updates, and deletion
- 201 for successful asset creation
- 400 for invalid input
- 401 for authentication failures
- 403 for authorization failures
- 404 when a requested resource does not exist

## Testing

Run the automated test suite with:

```bash
npm test
```

RoomTrack includes unit tests for room requirement logic and integration tests for the SQLite-backed API.

Automated testing covers:

- Complete rooms
- Missing required assets
- Damaged assets
- Asset quantity requirements
- Room retrieval
- Asset creation
- Asset retrieval
- Asset condition updates
- Asset deletion
- Invalid IDs
- Missing rooms
- Missing assets
- Invalid asset types
- Invalid asset conditions
- User authentication
- Session management
- Authorization rules
- Room provisioning
- Asset provisioning

API integration tests use an isolated in-memory SQLite database and do not modify the normal `roomtrack.db` development database.

## Bruno

RoomTrack includes a Bruno collection for manually testing and exploring the API.

The collection is organized as:

```text
RoomTrack API
├── Status
│   └── Status
├── Rooms
│   ├── List Rooms
│   └── Get Room
└── Assets
    ├── List Room Assets
    ├── Get Asset
    ├── Create Asset
    ├── Update Asset Condition
    └── Delete Asset
```

Start RoomTrack before sending requests from Bruno:

```bash
npm run dev
```

## Project Structure

```text
roomtrack-api/
├── src/
│   ├── auth/
│   ├── db/
│   ├── app.js
│   ├── server.js
│   ├── provisionRooms.js
│   ├── provisionRoomAssets.js
│   ├── generateRooms.js
│   ├── standardRoomRequirements.js
│   └── checkRoomRequirements.js
├── scripts/
│   ├── createUser.js
│   └── readPassword.js
├── test/
├── docs/
├── bruno/
├── .env.example
├── package.json
└── README.md
```

The project also contains a Bruno collection for manual API testing and documentation for deployment, backup, and recovery.  

The project also contains the Bruno API collection used for manual regression testing.

## Development Notes

RoomTrack provisions production rooms and their standard asset inventory automatically during initialization.

Room provisioning and asset provisioning are idempotent and can safely be executed multiple times without creating duplicate records.

Potential future improvements include:

- Structured application logging
- Additional automated test coverage
- Frontend user interface
- Additional reporting and compliance features
- Additional API functionality as requirements evolve

### Documentation

Additional documentation is available:

- docs/deployment.md
- docs/production-checklist.md
- docs/backup-and-recovery.md

## Version

RoomTrack v0.8.0