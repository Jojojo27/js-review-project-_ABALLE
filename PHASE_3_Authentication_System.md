# PHASE 3: Authentication System

✨

## Objectives
Implement a complete client-side authentication system using JavaScript and localStorage.

## Implemented Features

### 1. Database Structure (window.db)
- Uses a simulated database:
  - `window.db.accounts = []`
- Saved in localStorage:
  - `localStorage.fs_db`

### 2. Registration
- Form fields:
  - First Name
  - Last Name
  - Email
  - Password (minimum 6 characters)
- On submit:
  - Checks if email already exists in `window.db.accounts`
  - If not, saves a new account with:
    - `{ verified: false }`
  - Stores email to:
    - `localStorage.unverified_email`
  - Navigates to:
    - `#/verify-email`

### 3. Email Verification (Simulated)
- Displays message:
  - “Verification sent to [email]”
- Button:
  - “✅ Simulate Email Verification”
- On click:
  - Finds account using `localStorage.unverified_email`
  - Sets:
    - `verified: true`
  - Saves updated database
  - Navigates to:
    - `#/login`

### 4. Login System
- Form fields:
  - Email
  - Password
- On submit:
  - Finds matching account where:
    - email matches
    - password matches
    - `verified === true`
  - If valid:
    - Saves token:
      - `localStorage.auth_token = email`
    - Calls:
      - `setAuthState(true, user)`
    - Navigates to:
      - `#/profile`
  - If invalid:
    - Shows login error message

### 5. Auth State Management
- Function:
  - `setAuthState(isAuth, user)`
- Responsibilities:
  - Updates `currentUser`
  - Toggles body classes:
    - `body.authenticated`
    - `body.not-authenticated`
    - `body.is-admin` (if Admin)
  - Updates navbar username
  - Updates profile display (name, email, role)

### 6. Logout
- On clicking Logout:
  - Removes:
    - `localStorage.auth_token`
  - Calls:
    - `setAuthState(false)`
  - Navigates to:
    - `#/`

### 7. Route Protection
- Redirects unauthenticated users away from protected pages:
  - `#/profile`
  - `#/employees`
  - `#/accounts`
  - `#/departments`
  - `#/requests`
- Blocks non-admin users from admin routes:
  - `#/employees`
  - `#/accounts`
  - `#/departments`

## Default Demo Accounts

### Admin Account
- Email: `admin@example.com`
- Password: `Password123!`
- Role: Admin
- Verified: true

### User Account
- Email: `user@example.com`
- Password: `user123`
- Role: User
- Verified: true

## Testing Checklist
- Register new account → redirects to `#/verify-email`
- Click simulate verification → redirects to `#/login`
- Login with verified account → redirects to `#/profile`
- Try protected route without login → redirects to `#/login`
- Login as User and try `#/employees` → blocked (Admin only)