# API Reference - Sistem Manajemen Asprak

**Document Type**: API Documentation  
**Last Updated**: March 16, 2026  
**API Version**: 1.0.0  
**Status**: Production

---

## 📑 Quick Navigation

- [Base URL & Authentication](#base-url--authentication)
- [Error Handling](#error-handling)
- [Asprak Endpoints](#asprak-endpoints)
- [Jadwal Endpoints](#jadwal-endpoints)
- [Pelanggaran Endpoints](#pelanggaran-endpoints)
- [Plotting Endpoints](#plotting-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [System Endpoints](#system-endpoints)

---

## 🌐 Base URL & Authentication

### Base URL

```
http://localhost:3000/api    (Development)
https://api.asprak.lab/api   (Production)
```

### Authentication

All endpoints (except public ones) require JWT authentication token in header:

```
Authorization: Bearer <JWT_TOKEN>
```

**How to get a token**:

1. Login at `POST /auth/login`
2. Receive JWT token in response
3. Include token in all subsequent requests

**Token expires**: 24 hours (configurable)

---

## ⚠️ Error Handling

### Error Response Format

All errors follow this standard format:

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning      | When                                                         |
| ---- | ------------ | ------------------------------------------------------------ |
| 200  | OK           | Request successful                                           |
| 201  | Created      | Resource created successfully                                |
| 400  | Bad Request  | Invalid parameters or malformed request                      |
| 401  | Unauthorized | Missing or invalid authentication token                      |
| 403  | Forbidden    | Authenticated but not authorized for this action             |
| 404  | Not Found    | Resource does not exist                                      |
| 409  | Conflict     | Operation conflicts with existing data (e.g., duplicate NIM) |
| 500  | Server Error | Internal server error                                        |

### Example Error Response

```json
{
  "ok": false,
  "error": "NIM sudah terdaftar di sistem"
}
```

---

## 👥 Asprak Endpoints

### GET /api/asprak

Retrieve all asprak or asprak for a specific term.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB, ASPRAK_KOOR  
**Endpoint Type**: HTTP GET

#### Query Parameters

| Parameter | Type   | Required | Default | Description                 |
| --------- | ------ | -------- | ------- | --------------------------- |
| `action`  | string | No       | -       | Action modifier (see below) |
| `term`    | string | No       | -       | Academic term (YYYY/[1,2])  |

#### Action Modifiers

| Action     | Description                                           |
| ---------- | ----------------------------------------------------- |
| (none)     | Get all asprak (for current term)                     |
| `plotting` | Get asprak with their assignments (for plotting page) |
| `codes`    | Get list of existing asprak codes                     |
| `terms`    | Get available academic terms                          |

#### Request Examples

```bash
# Get all asprak
curl -X GET "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get asprak for specific term
curl -X GET "http://localhost:3000/api/asprak?term=2024/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get asprak with assignments (for plotting)
curl -X GET "http://localhost:3000/api/asprak?action=plotting&term=2024/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get available terms
curl -X GET "http://localhost:3000/api/asprak?action=terms" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Format

```json
{
  "ok": true,
  "data": [
    {
      "id": "asprak-uuid",
      "nim": "12345678",
      "nama_lengkap": "John Doe",
      "kode_asprak": "JD2024001",
      "angkatan": "2024",
      "no_hp": "081234567890",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Response with Plotting Action

```json
{
  "ok": true,
  "data": [
    {
      "id": "asprak-uuid",
      "nim": "12345678",
      "nama_lengkap": "John Doe",
      "kode_asprak": "JD2024001",
      "assignments": [
        {
          "praktikum_id": "praktikum-uuid",
          "mk_nama": "Database Systems",
          "mk_singkat": "DB"
        }
      ]
    }
  ]
}
```

---

### POST /api/asprak

Create, update, or perform bulk operations on asprak.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB (not ASPRAK_KOOR)  
**Endpoint Type**: HTTP POST

#### Request Body

```json
{
  "action": "upsert|view|bulk-import|update-assignments|check-nim|generate-code",
  "data": {}
}
```

#### Actions

##### Action: `upsert`

Create or update a single asprak record.

**Required Fields**:

- `nim`: Nomor Identitas Mahasiswa (must be unique)
- `nama_lengkap`: Full name
- `angkatan`: Year (e.g., "2024")

**Optional Fields**:

- `no_hp`: Phone number
- `kode_asprak`: Code (auto-generated if not provided)

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upsert",
    "data": {
      "nim": "12345678",
      "nama_lengkap": "John Doe",
      "angkatan": "2024",
      "no_hp": "081234567890"
    }
  }'
```

**Response**:

```json
{
  "ok": true,
  "data": {
    "asprakId": "asprak-uuid"
  }
}
```

##### Action: `view`

Get assignments for a specific asprak.

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "view",
    "asprakId": "asprak-uuid"
  }'
```

**Response**:

```json
{
  "ok": true,
  "data": [
    {
      "praktikum_id": "praktikum-uuid",
      "mk_nama": "Database Systems",
      "tahun_ajaran": "2024/1"
    }
  ]
}
```

##### Action: `bulk-import`

Import multiple asprak from CSV data.

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk-import",
    "rows": [
      {
        "nim": "12345678",
        "nama_lengkap": "John Doe",
        "angkatan": "2024"
      },
      {
        "nim": "87654321",
        "nama_lengkap": "Jane Smith",
        "angkatan": "2024"
      }
    ]
  }'
```

**Response**:

```json
{
  "ok": true,
  "data": {
    "created": 2,
    "updated": 0,
    "failed": 0
  }
}
```

##### Action: `update-assignments`

Update praktikum assignments for an asprak.

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update-assignments",
    "asprakId": "asprak-uuid",
    "term": "2024/1",
    "praktikumIds": ["praktikum-uuid-1", "praktikum-uuid-2"],
    "newKode": "JD2024001",
    "nim": "12345678",
    "forceOverride": false
  }'
```

##### Action: `check-nim`

Check if NIM already exists in database.

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check-nim",
    "nim": "12345678"
  }'
```

**Response**:

```json
{
  "ok": true,
  "data": {
    "exists": false
  }
}
```

##### Action: `generate-code`

Generate unique asprak code.

```bash
curl -X POST "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate-code",
    "name": "John Doe",
    "forceOverride": false
  }'
```

**Response**:

```json
{
  "ok": true,
  "data": {
    "code": "JD2024001"
  }
}
```

---

### DELETE /api/asprak

Delete a specific asprak record.

**Authentication**: Required  
**Authorization**: ADMIN only  
**Endpoint Type**: HTTP DELETE

#### Request Body

```json
{
  "id": "asprak-uuid"
}
```

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/asprak" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "asprak-uuid"
  }'
```

#### Response

```json
{
  "ok": true,
  "data": null
}
```

---

## 📅 Jadwal (Schedule) Endpoints

### GET /api/jadwal

Retrieve schedules.

**Authentication**: Optional  
**Authorization**: None (public for some actions)  
**Endpoint Type**: HTTP GET

#### Query Parameters

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| `action`  | string | Action modifier          |
| `term`    | string | Academic term            |
| `limit`   | number | Limit for 'today' action |

#### Actions

| Action              | Description                  |
| ------------------- | ---------------------------- |
| (none)              | Get all jadwal               |
| `terms`             | Get available terms          |
| `by-term`           | Get jadwal for specific term |
| `today`             | Get today's schedule         |
| `validation`        | Get schedule for validation  |
| `pengganti`         | Get replacement schedules    |
| `pengganti-by-term` | Get replacement for term     |

#### Request Examples

```bash
# Get all schedules
curl "http://localhost:3000/api/jadwal"

# Get today's schedule (limit 5)
curl "http://localhost:3000/api/jadwal?action=today&limit=5"

# Get schedules for term
curl "http://localhost:3000/api/jadwal?action=by-term&term=2024/1"
```

#### Response Format

```json
{
  "ok": true,
  "data": [
    {
      "id": "jadwal-uuid",
      "hari": "Monday",
      "jam_mulai": "08:00",
      "jam_akhir": "10:00",
      "ruangan": "Lab A",
      "mk_singkat": "DB",
      "mk_nama": "Database Systems",
      "modul": 1,
      "tahun_ajaran": "2024/1"
    }
  ]
}
```

---

### POST /api/jadwal

Create or import schedules.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB  
**Endpoint Type**: HTTP POST

#### Request Body

```json
{
  "action": "upsert-pengganti|bulk-import",
  "data": {}
}
```

#### Example: Bulk Import

```bash
curl -X POST "http://localhost:3000/api/jadwal" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk-import",
    "data": [
      {
        "hari": "Monday",
        "jam_mulai": "08:00",
        "jam_akhir": "10:00",
        "ruangan": "Lab A",
        "mk_singkat": "DB",
        "modul": 1,
        "tahun_ajaran": "2024/1"
      }
    ]
  }'
```

---

### PUT /api/jadwal

Update a schedule.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB  
**Endpoint Type**: HTTP PUT

#### Request Body

```json
{
  "id": "jadwal-uuid",
  "hari": "Monday",
  "jam_mulai": "08:00",
  "jam_akhir": "10:00",
  "ruangan": "Lab A",
  "mk_singkat": "DB"
}
```

---

### DELETE /api/jadwal

Delete a schedule.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB  
**Endpoint Type**: HTTP DELETE

#### Query Parameters

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| `action`  | string | `by-term` or `delete-pengganti`      |
| `id`      | string | Record ID (for non-term deletion)    |
| `term`    | string | Academic term (for `by-term` action) |

---

## ⚠️ Pelanggaran (Violation) Endpoints

### GET /api/pelanggaran

Retrieve violations.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB, ASPRAK_KOOR  
**Endpoint Type**: HTTP GET

#### Query Parameters

| Parameter     | Type    | Description                           |
| ------------- | ------- | ------------------------------------- |
| `action`      | string  | Action modifier                       |
| `idPraktikum` | string  | Filter by praktikum                   |
| `tahunAjaran` | string  | Filter by academic term               |
| `userId`      | string  | Filter by user (for koor)             |
| `isKoor`      | boolean | Check if user is coordinator          |
| `modul`       | number  | Filter by module                      |
| `minCount`    | number  | Minimum violation count (for summary) |

#### Actions

| Action              | Description                          |
| ------------------- | ------------------------------------ |
| `counts`            | Get violation counts by praktikum    |
| `praktikum-list`    | Get praktikum list for coordinator   |
| `summary`           | Get violation summary with filtering |
| `finalized-modules` | Get finalized modules for praktikum  |

#### Request Example

```bash
# Get all violations
curl "http://localhost:3000/api/pelanggaran" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get violations summary for a term
curl "http://localhost:3000/api/pelanggaran?action=summary&tahunAjaran=2024/1&minCount=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get violations for specific praktikum
curl "http://localhost:3000/api/pelanggaran?idPraktikum=praktikum-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Format

```json
{
  "ok": true,
  "data": [
    {
      "id": "pelanggaran-uuid",
      "id_asprak": "asprak-uuid",
      "asprak_nama": "John Doe",
      "id_jadwal": "jadwal-uuid",
      "jenis": "Tidak Hadir",
      "modul": 1,
      "is_finalized": false,
      "created_by": "user-uuid",
      "created_at": "2024-03-16T10:00:00Z"
    }
  ]
}
```

---

### POST /api/pelanggaran

Create or manage violations.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB, ASPRAK_KOOR (for finalize)  
**Endpoint Type**: HTTP POST

#### Actions

##### Action: `finalize`

Finalize all violations for a praktikum (immutable).

```bash
curl -X POST "http://localhost:3000/api/pelanggaran" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "finalize",
    "id_praktikum": "praktikum-uuid"
  }'
```

##### Action: `unfinalize`

Reset finalization (ADMIN ONLY - for correction).

```bash
curl -X POST "http://localhost:3000/api/pelanggaran" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "unfinalize",
    "id_praktikum": "praktikum-uuid"
  }'
```

##### Default: Create Violation(s)

```bash
# Single violation
curl -X POST "http://localhost:3000/api/pelanggaran" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_asprak": "asprak-uuid",
    "id_jadwal": "jadwal-uuid",
    "jenis": "Tidak Hadir",
    "modul": 1
  }'

# Multiple violations (same violation type for multiple asprak)
curl -X POST "http://localhost:3000/api/pelanggaran" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_asprak": ["asprak-uuid-1", "asprak-uuid-2"],
    "id_jadwal": "jadwal-uuid",
    "jenis": "Terlambat",
    "modul": 1
  }'
```

#### Violation Types

- `Tidak Hadir` - Absent
- `Terlambat` - Late
- `Tidak Lengkap` - Incomplete
- `Lainnya` - Other

---

### DELETE /api/pelanggaran

Delete a violation.

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB, ASPRAK_KOOR  
**Endpoint Type**: HTTP DELETE

#### Query Parameters

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `id`      | string | Yes      | Violation ID |

```bash
curl -X DELETE "http://localhost:3000/api/pelanggaran?id=pelanggaran-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Plotting Endpoints

### POST /api/plotting

Validate and save plotting (assignments).

**Authentication**: Required  
**Authorization**: ADMIN, ASLAB  
**Endpoint Type**: HTTP POST

#### Actions

##### Action: `validate-import`

Validate plotting data before saving.

```bash
curl -X POST "http://localhost:3000/api/plotting" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate-import",
    "term": "2024/1",
    "rows": [
      {
        "kode_asprak": "JD2024001",
        "mk_singkat": "DB"
      }
    ]
  }'
```

##### Action: `save-plotting`

Save validated assignments to database.

```bash
curl -X POST "http://localhost:3000/api/plotting" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "save-plotting",
    "assignments": [
      {
        "asprak_id": "asprak-uuid",
        "praktikum_id": "praktikum-uuid"
      }
    ]
  }'
```

---

## 🔌 Admin Endpoints

### GET /api/admin/users

List all users with roles.

**Authentication**: Required  
**Authorization**: ADMIN only  
**Endpoint Type**: HTTP GET

#### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "ADMIN",
      "nama_lengkap": "Admin Name",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/users

Create a new user.

**Authentication**: Required  
**Authorization**: ADMIN only  
**Endpoint Type**: HTTP POST

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "nama_lengkap": "User Name",
  "role": "ADMIN|ASLAB|ASPRAK_KOOR",
  "praktikum_ids": ["praktikum-uuid-1", "praktikum-uuid-2"]
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "koor@example.com",
    "password": "SecurePass123!",
    "nama_lengkap": "Koordinator Asprak",
    "role": "ASPRAK_KOOR",
    "praktikum_ids": ["praktikum-uuid-1"]
  }'
```

#### Response

```json
{
  "ok": true,
  "data": {
    "id": "user-uuid"
  }
}
```

---

## 🔧 System Endpoints

### GET /api/system/maintenance

Check if system is in maintenance mode.

**Authentication**: Not required (public)  
**Endpoint Type**: HTTP GET

#### Response

```json
{
  "ok": true,
  "isMaintenance": false
}
```

---

### POST /api/system/maintenance

Toggle maintenance mode.

**Authentication**: Required  
**Authorization**: ADMIN only  
**Endpoint Type**: HTTP POST

#### Request Body

```json
{
  "active": true|false
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/system/maintenance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "active": true
  }'
```

---

## 🔗 Related Documents

- [Architecture Document](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [Development Guide](./DEVELOPMENT.md)

---

**Last Updated**: March 16, 2026  
**API Status**: Production Ready  
**Support**: See [Troubleshooting](./TROUBLESHOOTING.md)
