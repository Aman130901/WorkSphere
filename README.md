# WorkSphere — Enterprise HRMS, Asset & Leave Management System

An industrial-grade, full-stack Human Resource Management System (HRMS) built with React, Vite, Express, TypeScript, and Tailwind CSS. The system provides secure role-based access control, real-time live polling notification feeds, interactive shift tracking, company-wide equipment lifecycle auditing, and an intelligent AI HR Copilot powered by the Gemini API.

---

## 🚀 Core Features & Architectural Modules

The platform is designed around strict corporate structures with two distinct execution pathways based on roles: **Admins/Managers** and **Employees (Staff)**.

### 1. 🔐 Authenticated Access & Self-Service
* **Role-Based Routing**: Dynamic dashboard options and views based on security levels (`admin`, `manager`, `employee`).
* **Session Persistence**: Secure JSON Web Token (JWT)-based API transactions with client-side recovery.
* **Employee Self-Service (ESS)**: 
  * Contact and emergency SOS coordinate updates.
  * Professional Career Canvas: Tag core technical skills and corporate project assignments.
  * Simulated Multi-Factor Authentication (MFA) setup.
  * Real-Time Alerts Routing: Granular controls to toggle notification topics.

### 2. 📡 Real-Time Notifications Feed (Live Polling)
* Real-time notifications synced across the server and client.
* **Smart Triggers**:
  * *Leave Applications*: Request submittals alert designated managers; status approvals/rejections immediately alert requesting staff.
  * *IT Asset Lifecycle*: Employees are notified when corporate hardware is assigned, returned, or dispatched for maintenance.
  * *Attendance Check-Ins*: Immediate feedback logs for verified shifts.
* Optimized long-polling backend updates to reflect status flags without screen refreshes.

### 3. ⏱️ Advanced Shift & Attendance Tracking
* Interactive clocking dashboard supporting **Clock-In**, **Clock-Out**, and **Break Intervals**.
* **Punctuality & Core Hour Coefficients**:
  * Admin-configurable grace periods (e.g., 15 minutes before marking late).
  * Standard shift duration thresholds (early departure flagging).
  * Standard office coordinate and geographic HQ bounding settings.

### 4. 📅 Integrated Leave & Balance Management
* Dynamic calendar-driven request submittals with automatic duration calculations.
* Dual-role balance logs representing Sick, Paid (PTO), and Unpaid allowances.
* Review portals enabling Managers and Admins to approve, reject, or comment with audit notes.

### 5. 💻 IT Equipment & Asset Auditing
* **Central Inventory Register**: Comprehensive status views (Available, Assigned, Under Maintenance).
* **Corporate Lifecycle Actions**: Check in/out hardware, assign items to specific personnel, or flag equipment for repair.
* Automatic assignment alert logs notifying personnel of new corporate hardware.

### 6. 📊 Analytics, Reports & Structure
* **Dynamic Bento Graphs**: Visual telemetry reporting total staff, pending approvals, late rates, and hardware utilization.
* **Department Rosters**: View and group personnel list metrics based on engineering, sales, product, or support categories.
* Fully searchable employee list directory.

### 7. 🤖 Intelligent HR Copilot (Gemini API)
* Integrated AI assistant powered by the server-side **Gemini SDK** (`@google/genai`).
* **Context-Aware HR Specialist**: Responds intelligently to questions regarding corporate leave policies, hardware configurations, duty days, and general assistance, matching the system's live dataset context.

---

## 🛠️ Technology Stack & Stack Integrity

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance Single-Page Application (SPA) layout, fast builds |
| **Animations** | Motion (`motion/react`) | Fluid card transitions and micro-interactions |
| **Styling** | Tailwind CSS | Utility-first, responsive grid, consistent dark/light visual layouts |
| **Icons** | Lucide React | High-contrast, scalable vector typography icons |
| **Backend** | Express, Node.js | Robust REST API endpoints, JWT token-based authentication |
| **Database** | File-based JSON Database | Local persistence layer mirroring standard SQL/NoSQL structures |
| **AI Specialist** | `@google/genai` | Intelligent context-grounded copilot conversation stream |

---

## 📦 Directory Structure

```text
├── server.ts              # Express API Server, Middleware, & Routes
├── src/
│   ├── main.tsx           # Client Bootstrapper
│   ├── App.tsx            # Navigation, Main Shell Layout, & Session Hydration
│   ├── types.ts           # Shared TypeScript Enums & System Interfaces
│   ├── utils/
│   │   └── api.ts         # Central Axios Client with JWT Authorization headers
│   ├── server/
│   │   └── db.ts          # JSON File DB Controller with CRUD and alert-triggering models
│   └── components/
│       ├── LandingPage.tsx   # Entry screen with display visuals and direct demo logins
│       ├── AuthPage.tsx      # Dual login/registration forms with security verification
│       ├── DashboardView.tsx # General status metric summaries
│       ├── EmployeeView.tsx  # Interactive directory & personnel profiles
│       ├── LeaveView.tsx     # Calendar balance requests and approvals
│       ├── AttendanceView.tsx# Chronometer shift tracker
│       ├── AssetView.tsx     # Corporate hardware audit records
│       ├── DepartmentView.tsx# Subdivision structures & rosters
│       ├── ReportsView.tsx   # Bento analytics dashboards
│       ├── SettingsView.tsx  # Admin policies & Employee Self-Service
│       └── HRCopilot.tsx     # Contextual AI Chat companion
```

---

## 🔧 Installation & Local Setup

### 1. Configure Secrets
Ensure you have a `.env` file at the project root with your Gemini API key (this remains strictly server-side):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The server will boot on **port 3000** and bind to `0.0.0.0` (reverse-proxied automatically for seamless live previewing).

### 4. Production Compilation
```bash
npm run build
npm start
```
The compilation bundles the client-side files into `/dist` and compiles `server.ts` into a single self-contained CommonJS `/dist/server.cjs` file using `esbuild` to optimize cold starts and eliminate relative path issues.
# WorkSphere
