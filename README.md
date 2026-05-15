# Leave Management System

A full-stack leave management platform built for teams of all sizes. Handles everything from employee leave applications to admin-level policy management, with role-based access, real-time notifications, and a clean modern UI.

---

## Tech Stack

**Backend** — Node.js, Express 5, TypeScript, PostgreSQL, Redis, JWT, Nodemailer / Resend

**Frontend** — React 19, TypeScript, Redux Toolkit, Tailwind CSS, Recharts, FullCalendar, Radix UI

---

## Highlights

### Authentication & Security
- Email + OTP two-factor login flow
- HttpOnly cookie-based JWT sessions — no tokens exposed to JavaScript
- Password setup via invitation link (time-limited, single-use token)
- Forgot password and reset password flow
- Change password from profile
- Auth middleware fetches fresh user state from DB on every request — role changes take effect immediately without requiring re-login

### Role-Based Access Control
- Fully dynamic permission system — every role's access to every page and action (view / edit / delete) is configurable from the UI
- Admin, Manager, and Employee roles out of the box — custom roles can be created
- Page-level and action-level guards on every backend route
- Frontend routing automatically adjusts based on the logged-in user's permissions
- Admins are blocked from employee-facing routes; employees are blocked from management routes

### Employee Management
- Employee directory with search and profile pages
- Invite employees by email — they receive a setup link to create their password
- Bulk employee upload via file
- Edit employee details, role, manager assignment, department, and leave policy
- Delete employee with safe cascading (nullifies references, deletes only their own records)
- Reassign leave policy per employee
- Reset an employee's leave balance manually

### Leave Application & Approval
- Apply for leave with date range, leave type, and reason
- Working days calculated automatically — weekends and public holidays excluded
- Half-day leave support
- Leave balance validated before submission
- Applied leave goes to the employee's direct manager for approval
- If no manager is assigned, escalates to admin
- Manager can approve or reject with a comment
- Employee can cancel a pending leave
- Email notifications sent to both parties on every status change

### Manager Tools
- Approval queue — view all pending leave requests from direct reports
- Team calendar — see who's on leave across the team by month
- Team balance summary — overview of every team member's remaining leave
- Leave trend chart — visualize leave patterns by type over time
- Team member profile view with full leave history and balance
- Org chart — interactive hierarchy view of the team structure

### Admin Dashboard
- Company-wide leave statistics and charts
- Global leave records — view, filter, and manage all leaves across the organization
- Export leave data to PDF
- Full org tree visualization
- Admin dashboard stats: headcount, pending approvals, leave distribution

### Leave Policy Management
- Create and manage multiple leave policies (e.g. probation, standard, senior)
- Define rules per policy — each leave type gets its own allocation, carry-forward rules, and caps
- Assign policies to individual employees
- Leave types are fully manageable — create, edit, delete

### Holidays
- Manage company-wide public holidays
- Holidays are automatically excluded from working day calculations when applying leave
- Holiday calendar visible to all employees

### Notifications
- In-app notification bell with unread count badge
- Notifications for leave applied, approved, and rejected
- Mark all as read

### Command Palette
- `Cmd+K` / `Ctrl+K` to open a spotlight-style search
- Search navigation pages and employee profiles from anywhere in the app
- Full keyboard navigation — arrow keys, Enter to select, Escape to close

### Performance
- Redis caching on all frequently-read endpoints (leave types, holidays, balance, dashboard, policies, org chart) with appropriate TTLs
- In-memory permission cache — role permissions cached per request cycle, invalidated immediately when changed
- Debounced employee search — API only fires after user stops typing
- Parallel DB queries using `Promise.all` wherever possible
- Paginated responses on all list endpoints

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, roles, permissions, cache
│   │   ├── routes/            # Express routers
│   │   ├── config/            # DB and Redis setup
│   │   └── utils/             # Helpers (email, working days, cache, auth)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/         # Employee-facing pages
│   │   │   ├── management/    # Admin-facing pages
│   │   │   ├── common/        # Shared components (ProtectedRoute, Toast, CommandPalette)
│   │   │   ├── layout/        # MainLayout, Sidebar, Navbar
│   │   │   └── modals/        # All modal components
│   │   ├── api/               # Axios instance and API call functions
│   │   ├── store/             # Redux store and slices
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Frontend helpers
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (optional — falls back to in-memory mock for local dev)

### Backend

```bash
cd backend
cp .env.example .env      # fill in your DB, Redis, JWT, and email config
npm install
npm run migrate           # sets up DB tables
npm run dev               # starts dev server on port 5000
```

Required environment variables:

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
NODE_ENV=development
EMAIL_FROM=
RESEND_API_KEY=          # or configure SMTP via nodemailer
FRONTEND_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env     # set REACT_APP_API_URL=http://localhost:5000
npm install
npm start                # starts on port 3000
```

---

## Key Flows

**New employee onboarding** — Admin sends invite → employee receives email with setup link → sets password → logs in → OTP sent to email → verified → lands on dashboard.

**Applying for leave** — Employee picks dates → system calculates working days excluding weekends and holidays → checks balance → submits → manager gets email notification → manager approves/rejects → employee gets notified.

**Permission management** — Admin opens Permissions page → selects a role → toggles view/edit/delete per page → saves → changes take effect immediately for all users of that role.