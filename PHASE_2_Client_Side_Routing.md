# PHASE 2: Client-Side Routing

## Objectives
Implement hash-based client-side routing using JavaScript.

## Implemented Features

### 1. Global Variable
- `let currentUser = null;`
- Stores the currently logged-in user session.

### 2. navigateTo(hash)
- Updates `window.location.hash`
- Used for SPA navigation.

### 3. handleRouting()
- Reads current hash (e.g., `#/login`)
- Hides all `.page` elements
- Shows the correct page based on route
- Redirects unauthenticated users from protected routes
- Blocks non-admin users from admin routes

### 4. Protected Routes
- `#/profile`
- `#/employees`
- `#/departments`
- `#/accounts`
- `#/requests`

### 5. Admin Routes
- `#/employees`
- `#/departments`
- `#/accounts`

### 6. Event Listener
- `window.addEventListener("hashchange", handleRouting)`

### 7. Default Route
- If URL hash is empty → automatically sets to `#/`

## Test Cases

- Typing `#/register` in the URL shows Register page.
- Typing `#/profile` while logged out redirects to `#/login`.
- Non-admin user blocked from admin routes.
- Admin user allowed access to admin routes.

## Result
Phase 2 successfully implemented client-side routing with access control.