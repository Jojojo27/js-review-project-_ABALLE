# PHASE 4: Data Persistence with localStorage

✨

## Objectives
Implement persistent storage for `window.db` using localStorage so all data remains after refresh.

## Implemented Features

### 1. STORAGE_KEY
- Uses a single storage key:
  - `STORAGE_KEY = 'ipt_demo_v1'`

### 2. loadFromStorage()
- Reads:
  - `localStorage[STORAGE_KEY]`
- Parses JSON into `window.db`
- If missing or corrupt:
  - Seeds database with:
    - One admin account:
      - `admin@example.com`
      - `Password123!`
      - `verified: true`
    - Two departments:
      - Engineering
      - HR

### 3. saveToStorage()
- Saves the entire database:
  - `JSON.stringify(window.db)`
- Writes to:
  - `localStorage[STORAGE_KEY]`

### 4. Initialization
- On app start:
  - `loadFromStorage()` is called during init
- Ensures `window.db` always exists and is valid.

### 5. Save After Any Data Change
After any create/update/delete operation, the system calls:
- `saveToStorage()`

This includes:
- Registration (new account added)
- Email verification (verified updated)
- Admin CRUD operations:
  - Employees
  - Accounts
  - Departments
  - Requests

## Testing Checklist
- Refresh page → admin and departments should still exist
- Add a department → refresh → department remains
- Add an employee → refresh → employee remains
- Register a user → verify → login → refresh → user remains
- Create a request → refresh → request remains  