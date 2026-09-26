# Client Management & Application Tracking System

A modern client management and application tracking system built with **React, Vite, Tailwind CSS, Google Sheets, and Google Apps Script**.

The system is designed to manage client information, application statuses, payments, categories, branding, security, and printable client documents through a simple and professional dashboard.

---

## 🚀 Version

**Current Release:** `v1.0.3`

**Release Status:** Stable

**Release:** Backend Performance Optimization

---

## ✨ Features

### 👥 Client Management

- Add new clients
- Edit client information
- Delete client records
- Automatic Client ID generation
- International phone number support
- Client category management
- Client notes
- Client details view
- Smart client search
- Advanced filtering
- Created date tracking

### 📋 Application Tracking

- Application status management
- Add, edit, and manage application statuses
- Active / inactive status control
- Automatic Application Status IDs
- Application progress tracking
- Application statuses stored in Google Sheets

### 💰 Payment Management

- Total Amount
- Paid Amount
- Due Amount
- Automatic due calculation
- PAID / PARTIAL / UNPAID payment status
- Configurable currency
- Custom currency symbol

### 📊 Dashboard

The dashboard provides an overview of:

- Total Clients
- Expected Amount
- Total Paid Amount
- Total Due Amount
- Application Status statistics
- Payment Status statistics

### 🗂️ Category Management

- Create categories
- Edit categories
- Activate / deactivate categories
- Automatic Category IDs
- Historical client data preservation

### 🔐 Dashboard Security

- First-time setup system
- Dashboard password protection
- Salted SHA-256 password hashing
- Password verification through Google Apps Script
- Manual dashboard lock
- Automatic 10-minute inactivity lock
- Device-specific failed-login protection
- Five failed attempts trigger a one-hour device lockout
- Dashboard remains inaccessible until initial setup is completed
- Dashboard session state is kept separate from setup completion state

> **Security note:** The current release uses the existing frontend Dashboard Lock plus Apps Script password verification. A future release may add a dedicated backend session/token authorization layer for stronger direct API protection.

### 🎨 Branding & Customization

- Custom application title
- Custom slogan
- Custom logo
- English / Bengali language support
- Dark / Light mode
- Font customization
- Responsive user interface
- Branding persisted in Google Sheets

### 🖨️ Client Print & PDF

- Professional client print preview
- Client details printing
- Browser-based Print / Save as PDF
- A4 print layout
- Electronic document generation notice
- Print information generated from connected client records
- No third-party PDF library required

### ℹ️ About This App

The application includes an About section containing developer information:

**Name:** Mahmudul Hasan Manik  
**Status:** Student at King Abdulaziz University, KSA  
**Email:** mmanik@stu.kau.edu.sa

---

## 🗄️ Database

The application uses **Google Sheets as the primary database** with **Google Apps Script** acting as the backend/API layer.

### Main Sheets

- `Clients`
- `Categories`
- `ApplicationStatuses`
- `Settings`
- `DashboardSecurity`

The application supports:

- Automatic database initialization
- Database structure verification
- Idempotent setup
- Preservation of existing records during initialization
- Optimized read operations for faster data loading

### Database Source of Truth

The Google Sheet remains the persistent source of truth. The frontend does not require Firebase or another database service.

---

## 🆕 First-Time Setup

When the application has not been configured yet, it does not open directly to the Dashboard.

The setup flow is:

```text
First App Open
      ↓
Welcome Screen
      ↓
Google Sheets / Apps Script Connection
      ↓
Connection Test
      ↓
Database Initialization / Verification
      ↓
Create Dashboard Password
      ↓
Setup Completed
      ↓
Dashboard
```

After setup is completed:

- A fresh application session opens the Lock Page.
- Correct password verification opens the Dashboard.
- Browser reload during an active Dashboard session restores the Dashboard.
- Manual Lock returns to the Lock Page.
- Ten minutes of inactivity automatically locks the Dashboard.

Setup completion and Dashboard unlock/session state are intentionally separate.

---

## ⚙️ Local Development

### Requirements

- Node.js
- npm
- Google account for Google Sheets / Apps Script
- A configured Google Apps Script Web App

### Install Dependencies

After opening the project in VS Code:

```bash
npm install
```

### Configure the Apps Script URL

Create a local `.env` file based on `.env.example`:

```env
VITE_GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec
```

Use the deployed **`/exec`** Web App URL, not the Apps Script `/dev` URL.

Do not commit personal `.env` files or private configuration to GitHub.

### Start Development Server

```bash
npm run dev
```

The Vite development server will provide a local URL such as:

```text
http://localhost:5173
```

### Stop Development Server

Press:

```text
Ctrl + C
```

If the terminal does not respond, use VS Code's **Kill Terminal** option.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## ☁️ Vercel Deployment

The project can be deployed to Vercel directly from GitHub.

### Recommended Vercel Configuration

- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

Add the following Environment Variable:

```text
VITE_GOOGLE_SHEETS_WEB_APP_URL
```

Use your own Google Apps Script `/exec` URL.

Because variables prefixed with `VITE_` are available to the browser, the Apps Script Web App URL should not be treated as a secret.

### Multiple Deployments / Users

The same source repository can be used for multiple Vercel deployments or domains.

For independent databases, each deployment/user should configure their own:

- Google Sheet
- Google Apps Script Web App
- `VITE_GOOGLE_SHEETS_WEB_APP_URL`

This keeps each user's database separate while using the same application source code.

---

## 🛠️ Technology Stack

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Google Sheets**
- **Google Apps Script**
- **JavaScript / HTML / CSS**

---

## 🚀 v1.0.3 — Backend Performance Optimization

This release focuses on improving Google Apps Script and Google Sheets data-loading performance without changing the application's overall architecture.

### Performance Improvements

- Removed unnecessary `ScriptLock` usage from read-only requests.
- Kept `ScriptLock` protection for write/mutation operations.
- Added request-scoped Google Sheets context.
- Reduced repeated sheet lookups.
- Optimized `getAll` using batched sheet reads.
- Reduced unnecessary Google Apps Script spreadsheet operations.
- Optimized date formatting.
- Improved initial Dashboard data synchronization.
- Password verification and initial data loading are performed in parallel where safe.
- Dashboard remains locked until both authentication and real database synchronization succeed.

### Result

The optimized release significantly reduces new-device unlock and initial Dashboard loading time compared with the previous sequential implementation.

The application continues to load real Google Sheets data before entering the Dashboard and does not rely on demo/sample records when a database is configured.

---

## 🌙 Theme System

The application supports:

- Light Mode
- Dark Mode
- System preference detection
- Persistent user theme preference

Dark mode uses a class-based Tailwind CSS v4 configuration.

---

## 🌐 Language Support

The application currently supports:

- English
- বাংলা (Bengali)

The interface, dashboard, settings, lock screen, setup flow, and print labels support localization.

---

## 🔄 Application Architecture

```text
┌─────────────────────────────┐
│        React Frontend       │
│       Vite + TypeScript     │
└──────────────┬──────────────┘
               │
               │ API Requests
               ▼
┌─────────────────────────────┐
│      Google Apps Script     │
│          Backend/API        │
└──────────────┬──────────────┘
               │
               │ Read / Write
               ▼
┌─────────────────────────────┐
│        Google Sheets        │
│         Database            │
└─────────────────────────────┘
```

---

## 🔒 Data & Password Handling

- Dashboard passwords are not stored as plaintext.
- Passwords use a salted SHA-256 hash system.
- The password hash and salt are stored in the existing Settings sheet.
- Password hash and salt are not returned by public branding/status responses.
- Existing Google Sheets data is preserved during normal initialization.
- No Firebase is required for the current architecture.

---

## 📦 Release History

### v1.0.3 — Backend Performance Optimization
- Optimized Apps Script read/write request handling.
- Improved Google Sheets data loading.
- Improved new-device authentication and Dashboard startup performance.
- Preserved existing security and application features.

### v1.0.2 — Security & Stability Update
- Streamlined Dashboard Lock Page.
- Improved device-specific login protection.
- Improved startup and authentication stability.
- Preserved First-Time Setup and database configuration.

### v1.0.1 — Dependency & Build Fix
- Dependency compatibility and production build improvements.

### v1.0.0 — Initial Stable Release
- Initial Client Management & Application Tracking System release.

---

## 📄 License

Check the repository license file for the applicable terms of use and distribution.
