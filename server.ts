import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import { db, UserRole, LeaveStatus, AssetCategory, AssetStatus, LeaveType, initDb, flushDb } from "./src/server/db.js";
import { saasDb, initSaasDb, flushSaasDb } from "./src/server/saas_db.js";
import type { Asset } from "./src/types.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "enterprise-hrms-secret-key-2026";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is initialized for Vercel serverless invocations
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (process.env.VERCEL && !isDbInitialized) {
    try {
      await Promise.all([initDb(), initSaasDb()]);
      isDbInitialized = true;
    } catch (e) {
      console.error("DB Init Error on Vercel:", e);
    }
  }
  next();
});

// Mongo Persistence Middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    if (res.headersSent) return originalSend.call(this, body);
    Promise.all([flushDb(), flushSaasDb()])
      .catch(console.error)
      .finally(() => {
        originalSend.call(this, body);
      });
    return this;
  };
  next();
});

// Express Request Extension Type (JWT Payload)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

// Authentication Middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied. Token missing." });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      firstName: string;
      lastName: string;
    };
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Role Check Middleware
const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
       res.status(403).json({ error: "Forbidden. Insufficient permissions." });
       return;
    }
    next();
  };
};

// ==================================================
// 1. AUTHENTICATION ENDPOINTS
// ==================================================

// Register a new employee (Admin only or default onboarding first time)
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, departmentId, jobTitle } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
       res.status(400).json({ error: "Required fields missing." });
       return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
       res.status(400).json({ error: "Employee email already registered." });
       return;
    }

    // First Admin Rule: If no users registered yet, make first user an admin
    const isFirstUser = db.getUsers().length === 0;
    const finalRole = isFirstUser ? "admin" : (role || "employee");
    const finalJobTitle = isFirstUser && !jobTitle ? "System Administrator" : (jobTitle || "Staff Member");

    const newUser = db.createUser({
      email,
      firstName,
      lastName,
      role: finalRole,
      status: "active",
      departmentId: departmentId || "",
      managerId: "",
      phone: req.body.phone || "",
      emergencyContact: req.body.emergencyContact || "",
      address: req.body.address || "",
      skills: req.body.skills || [],
      projects: req.body.projects || [],
      jobTitle: finalJobTitle,
      dateJoined: new Date().toISOString().split("T")[0],
      avatarUrl: req.body.avatarUrl || "",
      twoFactorEnabled: false,
      notificationPrefs: { leaveStatus: true, assetUpdates: true, announcements: true }
    }, password);

    res.status(201).json({ message: "Registration successful", userId: newUser.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
       res.status(400).json({ error: "Email and password are required." });
       return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
       res.status(400).json({ error: "Invalid email or password." });
       return;
    }

    if (user.status === "suspended") {
       res.status(403).json({ error: "Your account is suspended. Contact HR/IT Admin." });
       return;
    }

    const validPass = bcrypt.compareSync(password, user.passwordHash);
    if (!validPass) {
       res.status(400).json({ error: "Invalid email or password." });
       return;
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return profile without hash
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Logged In Profile
app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id);
    if (!user) {
       res.status(404).json({ error: "User not found" });
       return;
    }
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
app.post("/api/auth/change-password", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
       res.status(400).json({ error: "Current and new passwords are required." });
       return;
    }

    const user = db.getUserById(req.user!.id);
    if (!user) {
       res.status(404).json({ error: "User not found" });
       return;
    }

    const validPass = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!validPass) {
       res.status(400).json({ error: "Current password is incorrect." });
       return;
    }

    db.updateUserPassword(user.id, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simple Reset Password request (Mock simulation)
app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = db.getUserByEmail(email);
    if (!user) {
       res.status(404).json({ error: "No employee account found with this email." });
       return;
    }

    // Reset password to a default
    db.updateUserPassword(user.id, "password123");
    res.json({ message: "Password reset completed. Default password is 'password123'. Please log in and change it immediately." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle 2FA
app.post("/api/auth/2fa/toggle", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id);
    if (!user) {
       res.status(404).json({ error: "User not found" });
       return;
    }
    const updated = db.updateUser(user.id, { twoFactorEnabled: !user.twoFactorEnabled });
    res.json({ enabled: updated.twoFactorEnabled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Notification Preferences
app.put("/api/auth/notifications/prefs", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaveStatus, assetUpdates, announcements } = req.body;
    const user = db.getUserById(req.user!.id);
    if (!user) {
       res.status(404).json({ error: "User not found" });
       return;
    }
    const updated = db.updateUser(user.id, {
      notificationPrefs: {
        leaveStatus: typeof leaveStatus === "boolean" ? leaveStatus : user.notificationPrefs.leaveStatus,
        assetUpdates: typeof assetUpdates === "boolean" ? assetUpdates : user.notificationPrefs.assetUpdates,
        announcements: typeof announcements === "boolean" ? announcements : user.notificationPrefs.announcements,
      }
    });
    res.json(updated.notificationPrefs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 2. EMPLOYEE ENDPOINTS
// ==================================================

// List Employees with Search, Filtering, Pagination
app.get("/api/employees", authenticateToken, (req: Request, res: Response) => {
  try {
    const { search, department, role, status, page, limit } = req.query;
    let employees = db.getUsers();

    // Filter out password hashes
    let list = employees.map(({ passwordHash, ...safeUser }) => safeUser);

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        e =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.jobTitle.toLowerCase().includes(q)
      );
    }

    if (department) {
      list = list.filter(e => e.departmentId === department);
    }

    if (role) {
      list = list.filter(e => e.role === role);
    }

    if (status) {
      list = list.filter(e => e.status === status);
    }

    // Pagination
    const p = parseInt(String(page)) || 1;
    const l = parseInt(String(limit)) || 10;
    const total = list.length;
    const start = (p - 1) * l;
    const paginated = list.slice(start, start + l);

    res.json({
      employees: paginated,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Individual employee profile with leaves, attendance, assets
app.get("/api/employees/:id", authenticateToken, (req: Request, res: Response) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) {
       res.status(404).json({ error: "Employee not found." });
       return;
    }

    const { passwordHash, ...safeUser } = user;
    const leaves = db.getLeavesByUser(user.id);
    const attendance = db.getAttendanceByUser(user.id);
    const assets = db.getAssets().filter(a => a.assignedToUserId === user.id);

    res.json({
      profile: safeUser,
      leaves,
      attendance,
      assets,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Employee (Admin only)
app.post("/api/employees", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, departmentId, jobTitle, managerId, phone, emergencyContact, address, skills, projects, avatarUrl } = req.body;
    
    if (!email || !password || !firstName || !lastName || !role) {
       res.status(400).json({ error: "Fields missing: email, password, firstName, lastName, role are required." });
       return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
       res.status(400).json({ error: "An employee with this email already exists." });
       return;
    }

    const newUser = db.createUser({
      email,
      firstName,
      lastName,
      role,
      status: "active",
      departmentId: departmentId || "",
      managerId: managerId || "",
      phone: phone || "",
      emergencyContact: emergencyContact || "",
      address: address || "",
      skills: Array.isArray(skills) ? skills : [],
      projects: Array.isArray(projects) ? projects : [],
      jobTitle: jobTitle || "Staff Associate",
      dateJoined: new Date().toISOString().split("T")[0],
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      twoFactorEnabled: false,
      notificationPrefs: { leaveStatus: true, assetUpdates: true, announcements: true }
    }, password);

    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Employee details (Admin or User themselves editing their details)
app.put("/api/employees/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Authorization check
    if (req.user!.role !== "admin" && req.user!.id !== id) {
       res.status(403).json({ error: "Access denied. You can only update your own profile." });
       return;
    }

    const existing = db.getUserById(id);
    if (!existing) {
       res.status(404).json({ error: "Employee not found." });
       return;
    }

    // Fields that only admin can change
    const updates = { ...req.body };
    if (req.user!.role !== "admin") {
      delete updates.role;
      delete updates.status;
      delete updates.departmentId;
      delete updates.managerId;
      delete updates.jobTitle;
      delete updates.dateJoined;
    }

    const updated = db.updateUser(id, updates);
    const { passwordHash, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Employee status (Admin only)
app.put("/api/employees/:id/status", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== "active" && status !== "suspended") {
       res.status(400).json({ error: "Invalid status value." });
       return;
    }

    const updated = db.updateUser(req.params.id, { status });
    res.json({ message: `Employee account set to ${status}`, status: updated.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Employee (Admin only)
app.delete("/api/employees/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
       res.status(400).json({ error: "You cannot delete your own admin account." });
       return;
    }

    db.deleteUser(id, req.user!.id, req.user!.email);
    res.json({ message: "Employee deleted successfully from all registers." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 3. DEPARTMENT ENDPOINTS
// ==================================================

// List Departments
app.get("/api/departments", authenticateToken, (req: Request, res: Response) => {
  try {
    const departments = db.getDepartments();
    const employees = db.getUsers();

    // Map departments to include actual employee count and manager details
    const mapped = departments.map(d => {
      const deptEmployees = employees.filter(e => e.departmentId === d.id);
      const manager = employees.find(e => e.id === d.managerId);
      return {
        ...d,
        employeeCount: deptEmployees.length,
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : "Unassigned"
      };
    });

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Department (Admin only)
app.post("/api/departments", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, managerId } = req.body;
    if (!name) {
       res.status(400).json({ error: "Department name is required." });
       return;
    }
    const created = db.createDepartment({
      name,
      description: description || "",
      managerId: managerId || "",
    }, req.user!.id, req.user!.email);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Department (Admin only)
app.put("/api/departments/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateDepartment(req.params.id, req.body, req.user!.id, req.user!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Department (Admin only)
app.delete("/api/departments/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteDepartment(req.params.id, req.user!.id, req.user!.email);
    res.json({ message: "Department deleted and employees unassigned successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 4. LEAVE ENDPOINTS
// ==================================================

// List leaves (Admin/Manager sees all, Employee sees only theirs)
app.get("/api/leaves", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, id } = req.user!;
    let leaves = db.getLeaves();
    const employees = db.getUsers();

    // Map leaves with employee details
    let mapped = leaves.map(l => {
      const emp = employees.find(e => e.id === l.userId);
      return {
        ...l,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
        employeeEmail: emp?.email || "",
        employeeTitle: emp?.jobTitle || ""
      };
    });

    if (role === "employee") {
      mapped = mapped.filter(l => l.userId === id);
    } else if (role === "manager") {
      // Manager can see leaves of users where managerId === current manager id, or their own leaves
      const directReports = employees.filter(e => e.managerId === id).map(e => e.id);
      mapped = mapped.filter(l => l.userId === id || directReports.includes(l.userId));
    }

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Apply for leave (Employee/Any role)
app.post("/api/leaves", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaveType, startDate, endDate, duration, reason, documentUrl } = req.body;
    if (!leaveType || !startDate || !endDate || !duration || !reason) {
       res.status(400).json({ error: "Required fields missing." });
       return;
    }

    const created = db.applyLeave({
      userId: req.user!.id,
      leaveType: leaveType as LeaveType,
      startDate,
      endDate,
      duration: Number(duration),
      reason,
      documentUrl: documentUrl || null,
    });

    // Notify employee
    db.createNotification(
      req.user!.id,
      "Leave Application Submitted",
      `Your request for ${duration} days of ${leaveType} leave starting ${startDate} has been logged.`,
      "leave"
    );

    // Notify manager or admins
    const fullUser = db.getUsers().find(u => u.id === req.user!.id);
    if (fullUser && fullUser.managerId) {
      db.createNotification(
        fullUser.managerId,
        "New Leave Request",
        `${req.user!.firstName} ${req.user!.lastName} requested ${duration} days of ${leaveType} leave.`,
        "leave"
      );
    } else {
      db.getUsers().forEach(u => {
        if (u.role === "admin" || u.role === "manager") {
          db.createNotification(
            u.id,
            "New Leave Request",
            `${req.user!.firstName} ${req.user!.lastName} requested ${duration} days of ${leaveType} leave.`,
            "leave"
          );
        }
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Review leave request (Admin or Manager)
app.post("/api/leaves/:id/review", authenticateToken, requireRole(["admin", "manager"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, managerNotes } = req.body;
    if (!status || !["Approved", "Rejected", "MoreInfo"].includes(status)) {
       res.status(400).json({ error: "Valid status ('Approved', 'Rejected', 'MoreInfo') is required." });
       return;
    }

    const updated = db.updateLeaveStatus(req.params.id, status as LeaveStatus, managerNotes || "", req.user!.id);
    
    // Notify the requesting employee
    db.createNotification(
      updated.userId,
      `Leave Application ${status}`,
      `Your request for ${updated.leaveType} leave has been ${status.toLowerCase()} by ${req.user!.firstName}.${managerNotes ? ' Note: ' + managerNotes : ''}`,
      "leave"
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 5. ATTENDANCE ENDPOINTS
// ==================================================

// Get attendance logs (Admin/Manager sees all, Employee sees only theirs)
app.get("/api/attendance", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, id } = req.user!;
    let logs = db.getAttendance();
    const employees = db.getUsers();

    let mapped = logs.map(l => {
      const emp = employees.find(e => e.id === l.userId);
      return {
        ...l,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
        employeeEmail: emp?.email || "",
        employeeTitle: emp?.jobTitle || ""
      };
    });

    if (role === "employee") {
      mapped = mapped.filter(l => l.userId === id);
    } else if (role === "manager") {
      const reports = employees.filter(e => e.managerId === id).map(e => e.id);
      mapped = mapped.filter(l => l.userId === id || reports.includes(l.userId));
    }

    // Sort by date desc
    mapped.sort((a, b) => b.date.localeCompare(a.date));

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's today log status
app.get("/api/attendance/today", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const logs = db.getAttendanceByUser(req.user!.id);
    const todayLog = logs.find(l => l.date === todayStr);
    res.json(todayLog || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clock In
app.post("/api/attendance/clock-in", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logged = db.clockIn(req.user!.id);
    
    // Create live notification for the employee
    db.createNotification(
      req.user!.id,
      "Shift Check-in Successful",
      `You successfully checked in today at ${new Date(logged.clockIn).toLocaleTimeString()}. Status: ${logged.status}.`,
      "attendance"
    );

    res.json(logged);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Clock Out
app.post("/api/attendance/clock-out", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logged = db.clockOut(req.user!.id);

    // Create live notification for the employee
    db.createNotification(
      req.user!.id,
      "Shift Clock-out Successful",
      `You successfully checked out today at ${logged.clockOut ? new Date(logged.clockOut).toLocaleTimeString() : ''}.`,
      "attendance"
    );

    res.json(logged);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Break Start
app.post("/api/attendance/break-start", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logged = db.startBreak(req.user!.id);
    res.json(logged);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Break End
app.post("/api/attendance/break-end", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logged = db.endBreak(req.user!.id);
    res.json(logged);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


// ==================================================
// 6. ASSET ENDPOINTS
// ==================================================

// List assets with details
app.get("/api/assets", authenticateToken, (req: Request, res: Response) => {
  try {
    const assets = db.getAssets();
    const employees = db.getUsers();

    const mapped = assets.map(a => {
      const assignedUser = a.assignedToUserId ? employees.find(e => e.id === a.assignedToUserId) : null;
      return {
        ...a,
        assignedUserName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Unassigned",
        assignedUserEmail: assignedUser?.email || ""
      };
    });

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Asset (Admin only)
app.post("/api/assets", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, name, category, status, dateAdded, serialNumber, value } = req.body;
    if (!name || !category) {
       res.status(400).json({ error: "Fields missing: name and category are required." });
       return;
    }

    let finalAssetId = assetId;
    if (!finalAssetId) {
      const year = new Date().getFullYear();
      const assets = db.getAssets();
      let exists = true;
      while (exists) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        finalAssetId = `AST-${year}-${rand}`;
        exists = assets.some(a => a.assetId.toUpperCase() === finalAssetId!.toUpperCase());
      }
    } else {
      const assets = db.getAssets();
      const existing = assets.find(a => a.assetId.toUpperCase() === finalAssetId.toUpperCase());
      if (existing) {
         res.status(400).json({ error: "Asset ID already exists in inventory." });
         return;
      }
    }

    const created = db.createAsset({
      assetId: finalAssetId,
      name,
      category: category as AssetCategory,
      assignedToUserId: null,
      status: (status as AssetStatus) || "Available",
      dateAdded: dateAdded || new Date().toISOString().split("T")[0],
      serialNumber,
      value: value !== undefined ? Number(value) : undefined
    }, req.user!.id, req.user!.email, `${req.user!.firstName} ${req.user!.lastName}`);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Asset details (Admin only)
app.put("/api/assets/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateAsset(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Asset status directly (Admin & Manager)
app.put("/api/assets/:id/status", authenticateToken, requireRole(["admin", "manager"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "Status is required." });
      return;
    }

    const asset = db.getAssets().find(a => a.id === req.params.id);
    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    if (status === "Assigned" && !asset.assignedToUserId) {
      res.status(400).json({ error: "Cannot mark asset as 'Assigned' without an active holder assignment. Please use 'Assign Holder' instead." });
      return;
    }

    const updates: Partial<Asset> = { status: status as AssetStatus };
    if (status === "Available") {
      updates.assignedToUserId = null;
      updates.dateAssigned = null;
    }

    const updated = db.updateAsset(req.params.id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Quick update asset status/location/assignee via QR scan (Admin & Manager)
app.put("/api/assets/:id/quick-update", authenticateToken, requireRole(["admin", "manager"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, location, notes, assignedToUserId } = req.body;
    const assets = db.getAssets();
    const asset = assets.find(a => a.id === req.params.id);
    if (!asset) {
      res.status(404).json({ error: "Asset not found." });
      return;
    }

    const updates: Partial<Asset> = {};
    const previousStatus = asset.status;
    const previousAssigneeId = asset.assignedToUserId;

    if (status) updates.status = status as AssetStatus;
    if (location !== undefined) updates.location = location;

    // Handle assignee changes dynamically if provided
    if (assignedToUserId !== undefined && assignedToUserId !== previousAssigneeId) {
      updates.assignedToUserId = assignedToUserId || null;
      if (assignedToUserId) {
        updates.status = "Assigned";
        updates.dateAssigned = new Date().toISOString().split("T")[0];
      } else {
        updates.status = "Available";
        updates.lastReturned = new Date().toISOString().split("T")[0];
      }
    }

    const updated = db.updateAsset(req.params.id, updates);

    // Build history action & log
    let historyAction = "QR Scan Quick Update";
    if (status && status !== previousStatus) {
      historyAction = `Status Change: ${previousStatus} ➜ ${status}`;
    } else if (location && location !== asset.location) {
      historyAction = "Location Relocation";
    }

    const historyNotes = [
      location ? `Location: ${location}` : null,
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join(" | ") || "Updated via QR Scanner";

    const currentHistory = updated.history || [];
    currentHistory.push({
      id: `h-${Date.now()}`,
      action: historyAction,
      userId: req.user!.id,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      date: new Date().toISOString().split("T")[0],
      notes: historyNotes
    });

    db.updateAsset(req.params.id, { history: currentHistory });

    // Send in-app notification if ownership shifted
    if (assignedToUserId !== undefined && assignedToUserId !== previousAssigneeId) {
      if (assignedToUserId) {
        db.createNotification(
          assignedToUserId,
          "Asset Assigned via QR Update",
          `The IT department has assigned asset ${updated.name} (${updated.category}) to you via quick-scan update.`,
          "asset"
        );
      } else if (previousAssigneeId) {
        db.createNotification(
          previousAssigneeId,
          "Asset Reclaimed via QR Update",
          `Your assigned asset ${updated.name} has been returned to stock inventory via quick-scan update.`,
          "asset"
        );
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Asset to Employee (Admin only)
app.post("/api/assets/:id/assign", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, notes } = req.body;
    if (!userId) {
       res.status(400).json({ error: "Employee selection is required." });
       return;
    }
    const updated = db.assignAsset(req.params.id, userId, notes || "", req.user!.id, req.user!.email);

    // Create a live notification for the assigned employee
    db.createNotification(
      userId,
      "New IT Asset Assigned",
      `The IT department has assigned a hardware asset to you: ${updated.name} (${updated.category}). Please verify receipt in your hardware panel.`,
      "asset"
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Return Asset back to inventory (Admin only)
app.post("/api/assets/:id/return", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    // Keep track of the owner before returning
    const assetToReturn = db.getAssets().find(a => a.id === req.params.id);
    const prevOwnerId = assetToReturn ? assetToReturn.assignedToUserId : null;

    const updated = db.returnAsset(req.params.id, notes || "", req.user!.id, req.user!.email);

    if (prevOwnerId) {
      db.createNotification(
        prevOwnerId,
        "IT Asset Returned",
        `Your assigned asset ${updated.name} was successfully checked back into corporate inventory.`,
        "asset"
      );
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Unassign Asset (Admin only)
app.post("/api/assets/:id/unassign", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const assetToReturn = db.getAssets().find(a => a.id === req.params.id);
    const prevOwnerId = assetToReturn ? assetToReturn.assignedToUserId : null;

    const updated = db.returnAsset(req.params.id, "Unassigned / Reclaimed to Stock", req.user!.id, req.user!.email);

    if (prevOwnerId) {
      db.createNotification(
        prevOwnerId,
        "IT Asset Returned",
        `Your assigned asset ${updated.name} was successfully checked back into corporate inventory.`,
        "asset"
      );
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Send Asset for Maintenance (Admin only)
app.post("/api/assets/:id/maintenance", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const assetToRepair = db.getAssets().find(a => a.id === req.params.id);
    const prevOwnerId = assetToRepair ? assetToRepair.assignedToUserId : null;

    const updated = db.maintenanceAsset(req.params.id, notes || "", req.user!.id, req.user!.email);

    if (prevOwnerId) {
      db.createNotification(
        prevOwnerId,
        "IT Asset Sent to Maintenance",
        `Your assigned asset ${updated.name} has been sent for repair/maintenance. Repair notes: ${notes || 'No description provided'}.`,
        "asset"
      );
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Asset (Admin only)
app.delete("/api/assets/:id", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteAsset(req.params.id, req.user!.id, req.user!.email);
    res.json({ message: "Asset removed permanently." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================================================
// MAINTENANCE TICKETS API
// ==================================================

// Get all maintenance tickets
app.get("/api/maintenance-tickets", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = db.getMaintenanceTickets();
    res.json(tickets);
  } catch (err: any) {
    console.error(`[Error: GET /api/maintenance-tickets] Unexpected error retrieving maintenance tickets:`, {
      route: req.originalUrl,
      userId: req.user?.id,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "An internal server error occurred while retrieving maintenance tickets." });
  }
});

// Create a maintenance ticket (Any authenticated user)
app.post("/api/maintenance-tickets", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, assetName, severity, description } = req.body;
    if (!assetId || !assetName || !severity || !description) {
      console.warn(`[Validation Error: POST /api/maintenance-tickets] Missing required fields:`, {
        route: req.originalUrl,
        userId: req.user?.id,
        payload: req.body
      });
      res.status(400).json({ error: "Missing required fields: assetId, assetName, severity, and description are required." });
      return;
    }

    const newTicket = db.createMaintenanceTicket({
      assetId,
      assetName,
      reportedByUserId: req.user!.id,
      reportedByName: `${req.user!.firstName} ${req.user!.lastName}`,
      severity,
      description
    });

    res.status(201).json(newTicket);
  } catch (err: any) {
    console.error(`[Error: POST /api/maintenance-tickets] Unexpected error creating maintenance ticket:`, {
      route: req.originalUrl,
      userId: req.user?.id,
      payload: req.body,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "An internal server error occurred while processing your ticket." });
  }
});

// Resolve a maintenance ticket (Admin only)
app.post("/api/maintenance-tickets/:ticketId/resolve", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resolutionNotes } = req.body;
    if (!resolutionNotes) {
      console.warn(`[Validation Error: POST /api/maintenance-tickets/${req.params.ticketId}/resolve] Missing resolutionNotes:`, {
        route: req.originalUrl,
        userId: req.user?.id,
        params: req.params,
        payload: req.body
      });
      res.status(400).json({ error: "Resolution notes are required." });
      return;
    }

    const resolved = db.resolveMaintenanceTicket(
      req.params.ticketId,
      resolutionNotes,
      req.user!.id,
      `${req.user!.firstName} ${req.user!.lastName}`
    );

    res.json(resolved);
  } catch (err: any) {
    console.error(`[Error: POST /api/maintenance-tickets/${req.params.ticketId}/resolve] Unexpected error resolving maintenance ticket:`, {
      route: req.originalUrl,
      userId: req.user?.id,
      params: req.params,
      payload: req.body,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: "An internal server error occurred while resolving the ticket." });
  }
});



// ==================================================
// 7. NOTIFICATIONS
// ==================================================

// Get Notifications for Logged In User
app.get("/api/notifications", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getNotifications(req.user!.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Notification as read
app.post("/api/notifications/:id/read", authenticateToken, (req: Request, res: Response) => {
  try {
    db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear/Read All notifications
app.post("/api/notifications/clear", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.clearNotifications(req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 8. SYSTEM SETTINGS
// ==================================================

// Get System Settings
app.get("/api/settings", authenticateToken, (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update System Settings (Admin only)
app.put("/api/settings", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body, req.user!.id, req.user!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger System Backup (Admin only)
app.post("/api/settings/backup", authenticateToken, requireRole(["admin"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = db.createBackupSnapshot(req.user!.id, req.user!.email);
    res.status(201).json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 9. AUDIT LOGS & SYSTEM STATS
// ==================================================

// Get System Stats (Dashboard statistics)
app.get("/api/admin/system-stats", authenticateToken, (req: Request, res: Response) => {
  try {
    const employees = db.getUsers();
    const assets = db.getAssets();
    const leaves = db.getLeaves();
    const attendance = db.getAttendance();

    const totalEmployees = employees.length;
    const suspendedEmployees = employees.filter(e => e.status === "suspended").length;
    const activeEmployees = totalEmployees - suspendedEmployees;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = attendance.filter(a => a.date === todayStr);
    const presentToday = todayLogs.filter(a => a.status === "Present" || a.status === "Late").length;
    
    // On Leave today (active leave spans today)
    const onLeaveToday = leaves.filter(l => {
      if (l.status !== "Approved") return false;
      const start = new Date(l.startDate).getTime();
      const end = new Date(l.endDate).getTime();
      const today = new Date(todayStr).getTime();
      return today >= start && today <= end;
    }).length;

    const totalAssets = assets.length;
    const assignedAssets = assets.filter(a => a.status === "Assigned").length;
    const maintenanceAssets = assets.filter(a => a.status === "Maintenance").length;

    const pendingLeaves = leaves.filter(l => l.status === "Pending").length;

    // Last 5 logs
    const recentLogs = db.getAuditLogs().slice(0, 10);

    res.json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        suspended: suspendedEmployees,
        presentToday,
        onLeaveToday
      },
      assets: {
        total: totalAssets,
        assigned: assignedAssets,
        maintenance: maintenanceAssets,
        available: totalAssets - assignedAssets - maintenanceAssets
      },
      leaves: {
        pendingCount: pendingLeaves
      },
      recentLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List All Audit Logs (Admin only)
app.get("/api/admin/audit-logs", authenticateToken, requireRole(["admin"]), (req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// 10. HR COPILOT CHATBOT ENDPOINT
// ==================================================

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "worksphere-hrms"
        }
      }
    });
  }
  return aiClient;
};

app.post("/api/chat", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const userId = req.user!.id;
    const user = db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const departments = db.getDepartments();
    const dept = departments.find(d => d.id === user.departmentId);
    const departmentName = dept ? dept.name : "Unassigned";

    const leaves = db.getLeavesByUser(userId);
    const assets = db.getAssets().filter(a => a.assignedToUserId === userId);
    const settings = db.getSettings();

    const admins = db.getUsers().filter(u => u.role === "admin");
    const adminContactName = admins.length > 0 ? `${admins[0].firstName} ${admins[0].lastName}` : "the System Administrator";
    const adminContactEmail = admins.length > 0 ? admins[0].email : "admin@company.com";

    // Prepare rich company and user context for the model
    const systemInstruction = `You are the Acme HR Copilot, an advanced AI Assistant for Acme Enterprise Solutions' HRMS portal.
Your job is to assist employees with their HR queries, policy checks, leave balances, and assigned assets.

Current Context:
- Current Date/Time: ${new Date().toISOString()}
- Logged-in Employee: ${user.firstName} ${user.lastName} (Job Title: ${user.jobTitle}, Email: ${user.email}, Role: ${user.role})
- Department: ${departmentName}
- Skills: ${user.skills.join(", ") || "None"}
- Projects: ${user.projects.join(", ") || "None"}

Employee's Leave Balance & History:
- Approved/Pending Leaves: ${JSON.stringify(leaves.map(l => ({ type: l.leaveType, start: l.startDate, end: l.endDate, status: l.status, reason: l.reason })))}
- Leave Policy (Annual Allowance): ${JSON.stringify(settings.leavePolicy)}

Employee's Assigned Assets:
- Assets: ${JSON.stringify(assets.map(a => ({ name: a.name, category: a.category, assetId: a.assetId, status: a.status })))}

Company Holidays:
- Holidays: ${JSON.stringify(settings.holidays)}

Company General Policies:
- Name: ${settings.companyName}
- Standard Work Hours: ${settings.baseWorkHours} hours per day
- Regular Check-in Time: ${settings.checkInTime}
- Grace Period: ${settings.gracePeriodMinutes} minutes

Behavior Guidelines:
- Be highly professional, helpful, polite, and reassuring.
- When asked about leaves, calculate used leaves and compare them to the allowances.
- Keep answers concise and direct. Use bullet points or small formatting where appropriate.
- Refer to the user by their first name: ${user.firstName}.
- If you can't find specific information, suggest contacting ${adminContactName} (System Administrator) at ${adminContactEmail}.
`;

    // Try to call Gemini API
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...(history || []).map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I was unable to generate a response. Please try again.";
      res.json({ text: replyText });
    } catch (apiErr: any) {
      console.warn("Gemini API call failed, using high-quality local HR assistant fallback. Error:", apiErr.message);
      
      // High-quality deterministic fallback for clean local preview if key is not configured yet
      let replyText = "";
      const msgLower = message.toLowerCase();
      
      if (msgLower.includes("leave") || msgLower.includes("vacation") || msgLower.includes("sick")) {
        const approvedCount = leaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + l.duration, 0);
        const pendingCount = leaves.filter(l => l.status === "Pending").reduce((acc, l) => acc + l.duration, 0);
        replyText = `Hello **${user.firstName}**! Based on your records, here is your leave overview:
• **Approved Leaves taken:** ${approvedCount} days.
• **Pending Leave requests:** ${pendingCount} days.
• **Annual Allowance:** ${settings.leavePolicy.Annual} days.

Would you like help preparing or drafting a new leave application?`;
      } else if (msgLower.includes("asset") || msgLower.includes("laptop") || msgLower.includes("hardware") || msgLower.includes("computer")) {
        if (assets.length === 0) {
          replyText = `Hi **${user.firstName}**, you do not have any IT hardware assets currently assigned to you. If you need a workstation or monitor, please submit a request to ${adminContactName} in People Operations at ${adminContactEmail}.`;
        } else {
          replyText = `Hello **${user.firstName}**, here are the IT assets currently assigned to your roster:
${assets.map((a, i) => `${i + 1}. **${a.name}** (Category: ${a.category}, ID: \`${a.assetId}\`)`).join("\n")}

All assets are under active compliance warranty. Please let me know if you need to report any hardware issue or stickiness.`;
        }
      } else if (msgLower.includes("holiday") || msgLower.includes("christmas") || msgLower.includes("thanksgiving")) {
        replyText = `Hi **${user.firstName}**, here is the corporate holiday calendar for this year at **${settings.companyName}**:
${settings.holidays.map(h => `• **${h.name}**: ${h.date}`).join("\n")}

Enjoy your time off! Let me know if you have any questions about holiday accruals.`;
      } else if (msgLower.includes("policy") || msgLower.includes("hours") || msgLower.includes("check")) {
        replyText = `Hello **${user.firstName}**, here are some core corporate policies for **${settings.companyName}**:
• **Standard Daily Shifts:** ${settings.baseWorkHours} hours.
• **Official Check-in Time:** ${settings.checkInTime} AM.
• **Late Check-in Grace Period:** ${settings.gracePeriodMinutes} minutes.

All employees clock in and out using the **Shift Logs** tab. Let me know if you need any assistance with clocking issues!`;
      } else {
        replyText = `Hello **${user.firstName}**! I am your Acme HR Copilot. 

*(Simulation Note: GEMINI_API_KEY environment variable is not set. Showing interactive fallback answers.)*

I am fully synchronized with your employee profile:
• **Job Title:** ${user.jobTitle}
• **Department:** ${departmentName}
• **My Assets:** ${assets.length} items
• **My Leaves:** ${leaves.length} requests logged

Ask me about your leave balances, assigned laptops/monitors, company holidays, or check-in policies!`;
      }

      res.json({ text: replyText });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// SAAS ENTERPRISE WORKFORCE SYSTEM ENDPOINTS
// ==================================================

// Helper to get active tenant from header or default
const getTenantId = (req: Request): string => {
  return (req.headers["x-tenant-id"] as string) || "t-acme";
};

// Tenants list & creation
app.get("/api/saas/tenants", (req: Request, res: Response) => {
  res.json(saasDb.getTenants());
});

app.post("/api/saas/tenants", (req: Request, res: Response) => {
  try {
    const { name, subdomain, brandingColor, plan } = req.body;
    if (!name || !subdomain) {
      res.status(400).json({ error: "Tenant name and subdomain are required." });
      return;
    }
    const newTenant = saasDb.createTenant({
      name,
      subdomain,
      brandingColor: brandingColor || "#6366f1",
      plan: plan || "standard"
    });
    res.status(201).json(newTenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Workflows list & creation
app.get("/api/saas/workflows", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(saasDb.getWorkflows(tenantId));
});

app.post("/api/saas/workflows", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { name, triggerType, nodes, isActive } = req.body;
    if (!name || !triggerType || !nodes) {
      res.status(400).json({ error: "Name, triggerType, and nodes are required." });
      return;
    }
    const newWf = saasDb.createWorkflow(tenantId, {
      name,
      triggerType,
      nodes,
      isActive: isActive !== false
    });
    res.status(201).json(newWf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employee Lifecycles
app.get("/api/saas/lifecycle", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { userId } = req.query;
  res.json(saasDb.getLifecycleSteps(tenantId, userId as string));
});

app.post("/api/saas/lifecycle", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { userId, userName, type, stepName, dueDate, notes } = req.body;
    if (!userId || !userName || !type || !stepName) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const newStep = saasDb.createLifecycleStep(tenantId, {
      userId,
      userName,
      type,
      stepName,
      isCompleted: false,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      notes: notes || ""
    });
    res.status(201).json(newStep);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/saas/lifecycle/:id/toggle", (req: Request, res: Response) => {
  try {
    const updated = saasDb.toggleLifecycleStep(req.params.id);
    if (!updated) {
      res.status(404).json({ error: "Lifecycle step not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Procurement Requests
app.get("/api/saas/procurement", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(saasDb.getProcurements(tenantId));
});

app.post("/api/saas/procurement", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { name, category, quantity, estimatedCost, vendor, requestedBy } = req.body;
    if (!name || !category || !quantity || !estimatedCost) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }
    const newItem = saasDb.createProcurement(tenantId, {
      name,
      category,
      quantity: Number(quantity),
      estimatedCost: Number(estimatedCost),
      vendor: vendor || "Global Supplies",
      requestedBy: requestedBy || "Operations Team"
    });
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/saas/procurement/:id/status", (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = saasDb.updateProcurementStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: "Procurement request not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Service Desk Ticketing System
app.get("/api/saas/tickets", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(saasDb.getTickets(tenantId));
});

app.post("/api/saas/tickets", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { title, description, category, priority, createdByUserId, createdByName, assignedToUserId, assignedToName, slaLimitHours, internalNotes } = req.body;
    if (!title || !description || !category || !priority) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const limit = Number(slaLimitHours) || 24;
    const slaDeadline = new Date(Date.now() + limit * 3600 * 1000).toISOString();
    
    const newTkt = saasDb.createTicket(tenantId, {
      title,
      description,
      category,
      priority,
      createdByUserId: createdByUserId || "u-anon",
      createdByName: createdByName || "Anonymous Staff",
      assignedToUserId: assignedToUserId || null,
      assignedToName: assignedToName || null,
      slaDeadline,
      internalNotes: internalNotes || ""
    });
    res.status(201).json(newTkt);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/saas/tickets/:id/comments", (req: Request, res: Response) => {
  try {
    const { authorName, content } = req.body;
    if (!authorName || !content) {
      res.status(400).json({ error: "Author name and content are required." });
      return;
    }
    const updated = saasDb.addTicketComment(req.params.id, authorName, content);
    if (!updated) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/saas/tickets/:id/status", (req: Request, res: Response) => {
  try {
    const { status, satisfactionRating } = req.body;
    const updated = saasDb.updateTicketStatus(req.params.id, status, satisfactionRating);
    if (!updated) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Document Vault
app.get("/api/saas/documents", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { userId } = req.query;
  res.json(saasDb.getDocuments(tenantId, userId as string));
});

app.post("/api/saas/documents", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { userId, title, category, securityClass, fileSize, expiryDate } = req.body;
    if (!userId || !title || !category || !securityClass) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const newDoc = saasDb.createDocument(tenantId, {
      userId,
      title,
      category,
      securityClass,
      fileSize: fileSize || "1.5 MB",
      version: 1,
      expiryDate
    });
    res.status(201).json(newDoc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/saas/documents/:id/sign", (req: Request, res: Response) => {
  try {
    const { signatureData } = req.body;
    if (!signatureData) {
      res.status(400).json({ error: "Signature data is required." });
      return;
    }
    const updated = saasDb.signDocument(req.params.id, signatureData);
    if (!updated) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Peer Appreciations
app.get("/api/saas/appreciations", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  res.json(saasDb.getAppreciations(tenantId));
});

app.post("/api/saas/appreciations", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { senderId, senderName, receiverId, receiverName, badgeType, message } = req.body;
    if (!senderId || !receiverId || !badgeType || !message) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const newApp = saasDb.createAppreciation(tenantId, {
      senderId,
      senderName: senderName || "Anonymous Sender",
      receiverId,
      receiverName: receiverName || "Co-worker",
      badgeType,
      message
    });
    res.status(201).json(newApp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Geofence & Biometric Anomalies
app.get("/api/saas/anomalies", (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  const { userId } = req.query;
  res.json(saasDb.getAnomalies(tenantId, userId as string));
});

app.post("/api/saas/anomalies", (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { userId, userName, date, type, details } = req.body;
    if (!userId || !type || !details) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const newAnomaly = saasDb.createAnomaly(tenantId, {
      userId,
      userName: userName || "Employee",
      date: date || new Date().toISOString().split("T")[0],
      type,
      details
    });
    res.status(201).json(newAnomaly);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/saas/anomalies/:id/resolve", (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = saasDb.resolveAnomaly(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: "Anomaly report not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// VITE AND STATIC ASSETS INTEGRATION
// ==================================================

async function startServer() {
  console.log("Initializing databases from MongoDB/Local...");
  await Promise.all([initDb(), initSaasDb()]);
  console.log("Databases initialized.");

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use custom since we want to serve app.html
    });
    app.use(vite.middlewares);
    
    // Add SPA fallback for dev mode
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        const template = await fs.promises.readFile(path.resolve(process.cwd(), "app.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "app.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise HRMS Server running at http://0.0.0.0:${PORT}`);
  });
}

// Only start the server if we are NOT on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
