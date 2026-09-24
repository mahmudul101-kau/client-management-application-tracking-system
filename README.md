# Client Management & Application Tracking System

A modern client management and application tracking system built with **React, Vite, Tailwind CSS, Google Sheets, and Google Apps Script**.

The system is designed to manage client information, application statuses, payments, categories, branding, and printable client documents through a simple and professional dashboard.

---

## 🚀 Version

**Current Release:** `v1.0.0`

**Release Status:** Stable

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

### 📋 Application Tracking

- Application status management
- Add, edit, and manage application statuses
- Active / inactive status control
- Automatic Application Status IDs
- Application progress tracking

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
- Secure password hashing
- Password verification through Google Apps Script
- Manual dashboard lock
- Automatic inactivity lock
- Session-based dashboard access

### 🎨 Branding & Customization

- Custom application title
- Custom slogan
- Custom logo
- English / Bengali language support
- Dark / Light mode
- Font customization
- Responsive user interface

### 🖨️ Client Print & PDF

- Professional client print preview
- Client details printing
- Browser-based Print / Save as PDF
- A4 print layout
- Electronic document generation notice
- Print information is generated from connected client records

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

The application supports automatic database initialization and database structure verification.

Existing records are preserved during normal application updates and database initialization.

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
