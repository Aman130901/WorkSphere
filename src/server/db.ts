import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.resolve(process.cwd(), "db.json");

// Helper types
export type UserRole = "admin" | "manager" | "employee";
export type UserStatus = "active" | "suspended";
export type AssetCategory = "Laptop" | "Desktop" | "Monitor" | "Keyboard" | "Mouse" | "Phone" | "ID Card" | "Software License";
export type AssetStatus = "Available" | "Assigned" | "Maintenance" | "Retired";
export type LeaveType = "Annual" | "Sick" | "Maternity" | "Paternity" | "Unpaid" | "Casual";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "MoreInfo";
export type AttendanceStatus = "Present" | "Late" | "EarlyExit" | "OnLeave" | "Absent";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  departmentId: string;
  managerId: string;
  phone: string;
  emergencyContact: string;
  address: string;
  dateOfBirth?: string;
  skills: string[];
  projects: string[];
  jobTitle: string;
  dateJoined: string;
  avatarUrl: string;
  twoFactorEnabled: boolean;
  notificationPrefs: {
    leaveStatus: boolean;
    assetUpdates: boolean;
    announcements: boolean;
  };
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string;
}

export interface AssetHistory {
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  date: string;
  notes: string;
}

export interface Asset {
  id: string;
  assetId: string; // SKU e.g. AST-2026-001
  name: string;
  category: AssetCategory;
  assignedToUserId: string | null;
  status: AssetStatus;
  dateAdded: string;
  dateAssigned: string | null;
  lastReturned: string | null;
  history: AssetHistory[];
  serialNumber?: string;
  value?: number;
  location?: string;
}

export interface Leave {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  duration: number; // in days
  status: LeaveStatus;
  reason: string;
  managerNotes: string | null;
  documentUrl: string | null;
  dateSubmitted: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO String
  clockOut: string | null; // ISO String
  breakStart: string | null; // ISO String
  breakEnd: string | null; // ISO String
  totalBreakMs: number;
  totalWorkMs: number;
  status: AttendanceStatus;
  lateArrivalMinutes: number;
}

export interface Notification {
  id: string;
  userId: string; // user ID, or "all" for system announcement
  title: string;
  content: string;
  type: "leave" | "asset" | "attendance" | "profile" | "system";
  read: boolean;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  companyName: string;
  baseWorkHours: number;
  checkInTime: string; // e.g. "09:00"
  gracePeriodMinutes: number;
  leavePolicy: {
    Annual: number;
    Sick: number;
    Casual: number;
    Maternity: number;
    Paternity: number;
    Unpaid: number;
  };
  holidays: { name: string; date: string }[];
  officeLocation: string;
  dutyDays: string[];
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  forcedPasswordRotationDays: number;
  twoFactorRequired: boolean;
  loginAttemptLimit: number;
  backups: { id: string; name: string; date: string; size: string; status: string }[];
}

export interface DatabaseSchema {
  users: User[];
  departments: Department[];
  assets: Asset[];
  leaves: Leave[];
  attendance: Attendance[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  maintenanceTickets?: MaintenanceTicket[];
}

export interface MaintenanceTicket {
  ticketId: string;
  assetId: string;
  assetName: string;
  reportedByUserId: string;
  reportedByName: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  status: "Pending" | "Resolved";
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: "Acme Enterprise Solutions",
  baseWorkHours: 8,
  checkInTime: "09:00",
  gracePeriodMinutes: 30,
  leavePolicy: {
    Annual: 20,
    Sick: 10,
    Casual: 7,
    Maternity: 90,
    Paternity: 14,
    Unpaid: 30,
  },
  holidays: [
    { name: "New Year's Day", date: "2026-01-01" },
    { name: "Memorial Day", date: "2026-05-25" },
    { name: "Independence Day", date: "2026-07-04" },
    { name: "Labor Day", date: "2026-09-07" },
    { name: "Thanksgiving", date: "2026-11-26" },
    { name: "Christmas Day", date: "2026-12-25" },
  ],
  officeLocation: "San Francisco HQ (Building 3)",
  dutyDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  forcedPasswordRotationDays: 90,
  twoFactorRequired: false,
  loginAttemptLimit: 5,
  backups: [],
};

import { loadState, saveState } from "./mongo.js";

let dbState: DatabaseSchema | null = null;
export let isDbDirty = false;

export async function initDb() {
  dbState = await loadState('main_db', generateInitialData());
}

export async function flushDb() {
  if (isDbDirty && dbState) {
    await saveState('main_db', dbState);
    isDbDirty = false;
  }
}

function readDb(): DatabaseSchema {
  if (!dbState) {
    const initial = generateInitialData();
    dbState = initial;
    return initial;
  }
  return dbState;
}

function writeDb(data: DatabaseSchema) {
  dbState = data;
  isDbDirty = true;
}

function generateInitialData(): DatabaseSchema {
  return {
    users: [],
    departments: [],
    assets: [],
    leaves: [],
    attendance: [],
    notifications: [],
    auditLogs: [],
    settings: DEFAULT_SETTINGS,
    maintenanceTickets: [],
  };
}

export const db = {
  getUsers: (): User[] => readDb().users,
  getUserById: (id: string): User | undefined => readDb().users.find(u => u.id === id),
  getUserByEmail: (email: string): User | undefined => readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  
  createUser: (user: Omit<User, "id" | "passwordHash">, passwordPlain: string): User => {
    const fullDb = readDb();
    const id = `usr-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    
    const newUser: User = {
      ...user,
      id,
      passwordHash,
    };
    fullDb.users.push(newUser);
    writeDb(fullDb);
    db.logAudit(newUser.id, newUser.email, "Create Employee", `Created employee account for ${newUser.firstName} ${newUser.lastName}`);
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>): User => {
    const fullDb = readDb();
    const index = fullDb.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    // Protect password hash update through this general helper
    if ("passwordHash" in updates) delete updates.passwordHash;

    const updatedUser = {
      ...fullDb.users[index],
      ...updates,
    };
    fullDb.users[index] = updatedUser;
    writeDb(fullDb);
    db.logAudit(id, updatedUser.email, "Update Profile", `Updated user profile/settings`);
    return updatedUser;
  },

  updateUserPassword: (id: string, passwordPlain: string) => {
    const fullDb = readDb();
    const index = fullDb.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");

    const salt = bcrypt.genSaltSync(10);
    fullDb.users[index].passwordHash = bcrypt.hashSync(passwordPlain, salt);
    writeDb(fullDb);
    db.logAudit(id, fullDb.users[index].email, "Change Password", `Updated password securely`);
  },

  deleteUser: (id: string, operatorId?: string, operatorEmail?: string) => {
    const fullDb = readDb();
    const user = fullDb.users.find(u => u.id === id);
    if (!user) throw new Error("User not found");
    fullDb.users = fullDb.users.filter(u => u.id !== id);
    // Unassign their assets
    fullDb.assets = fullDb.assets.map(a => {
      if (a.assignedToUserId === id) {
        a.assignedToUserId = null;
        a.status = "Available";
        a.history.push({
          id: `h-${Date.now()}`,
          action: "Returned",
          userId: null,
          userName: "System",
          date: new Date().toISOString().split("T")[0],
          notes: `Auto-returned as user ${user.firstName} ${user.lastName} was deleted.`
        });
      }
      return a;
    });
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Delete Employee", `Deleted employee account of ${user.firstName} ${user.lastName} (${user.email})`);
  },

  getDepartments: (): Department[] => readDb().departments,
  createDepartment: (dept: Omit<Department, "id">, operatorId?: string, operatorEmail?: string): Department => {
    const fullDb = readDb();
    const id = `dept-${Date.now()}`;
    const newDept = { ...dept, id };
    fullDb.departments.push(newDept);
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Create Department", `Created department: ${newDept.name}`);
    return newDept;
  },
  updateDepartment: (id: string, updates: Partial<Department>, operatorId?: string, operatorEmail?: string): Department => {
    const fullDb = readDb();
    const index = fullDb.departments.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Department not found");
    const updated = { ...fullDb.departments[index], ...updates };
    fullDb.departments[index] = updated;
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Update Department", `Updated department: ${updated.name}`);
    return updated;
  },
  deleteDepartment: (id: string, operatorId?: string, operatorEmail?: string) => {
    const fullDb = readDb();
    const dept = fullDb.departments.find(d => d.id === id);
    if (!dept) throw new Error("Department not found");
    fullDb.departments = fullDb.departments.filter(d => d.id !== id);
    // Reassign department ID for affected users to a default or blank
    fullDb.users = fullDb.users.map(u => {
      if (u.departmentId === id) u.departmentId = "";
      return u;
    });
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Delete Department", `Deleted department: ${dept.name}`);
  },

  getAssets: (): Asset[] => readDb().assets,
  createAsset: (asset: Omit<Asset, "id" | "history" | "lastReturned" | "dateAssigned">, operatorId?: string, operatorEmail?: string, operatorName?: string): Asset => {
    const fullDb = readDb();
    const id = `ast-${Date.now()}`;
    const newAsset: Asset = {
      ...asset,
      id,
      dateAssigned: null,
      lastReturned: null,
      history: [
        {
          id: `h-${Date.now()}`,
          action: "Purchased",
          userId: operatorId || "system",
          userName: operatorName || "System Admin",
          date: asset.dateAdded,
          notes: "Added to inventory"
        }
      ]
    };
    fullDb.assets.push(newAsset);
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Create Asset", `Added asset: ${newAsset.name} (${newAsset.assetId})`);
    return newAsset;
  },
  updateAsset: (id: string, updates: Partial<Asset>): Asset => {
    const fullDb = readDb();
    const index = fullDb.assets.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Asset not found");
    const updated = { ...fullDb.assets[index], ...updates };
    fullDb.assets[index] = updated;
    writeDb(fullDb);
    return updated;
  },
  assignAsset: (id: string, userId: string, notes: string, operatorId?: string, operatorEmail?: string): Asset => {
    const fullDb = readDb();
    const assetIndex = fullDb.assets.findIndex(a => a.id === id);
    const user = fullDb.users.find(u => u.id === userId);
    if (assetIndex === -1) throw new Error("Asset not found");
    if (!user) throw new Error("User not found");

    const asset = fullDb.assets[assetIndex];
    asset.assignedToUserId = userId;
    asset.status = "Assigned";
    asset.dateAssigned = new Date().toISOString().split("T")[0];
    asset.history.push({
      id: `h-${Date.now()}`,
      action: "Assigned",
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      date: asset.dateAssigned,
      notes: notes || "Assigned by Administrator"
    });

    fullDb.assets[assetIndex] = asset;
    
    // Add active notification for employee
    fullDb.notifications.push({
      id: `notif-${Date.now()}`,
      userId,
      title: "Asset Assigned",
      content: `Asset ${asset.name} (${asset.assetId}) has been assigned to you.`,
      type: "asset",
      read: false,
      date: new Date().toISOString()
    });

    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Assign Asset", `Assigned ${asset.name} to ${user.firstName} ${user.lastName}`);
    return asset;
  },
  returnAsset: (id: string, notes: string, operatorId?: string, operatorEmail?: string): Asset => {
    const fullDb = readDb();
    const assetIndex = fullDb.assets.findIndex(a => a.id === id);
    if (assetIndex === -1) throw new Error("Asset not found");

    const asset = fullDb.assets[assetIndex];
    const previousUserId = asset.assignedToUserId;
    const user = previousUserId ? fullDb.users.find(u => u.id === previousUserId) : null;

    asset.assignedToUserId = null;
    asset.status = "Available";
    asset.lastReturned = new Date().toISOString().split("T")[0];
    asset.history.push({
      id: `h-${Date.now()}`,
      action: "Returned",
      userId: previousUserId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      date: asset.lastReturned,
      notes: notes || "Returned back to hardware inventory"
    });

    fullDb.assets[assetIndex] = asset;

    if (previousUserId) {
      fullDb.notifications.push({
        id: `notif-${Date.now()}`,
        userId: previousUserId,
        title: "Asset Returned",
        content: `Asset ${asset.name} (${asset.assetId}) has been successfully returned.`,
        type: "asset",
        read: false,
        date: new Date().toISOString()
      });
    }

    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Return Asset", `Returned ${asset.name} from ${user ? user.firstName + " " + user.lastName : "user"}`);
    return asset;
  },
  maintenanceAsset: (id: string, notes: string, operatorId?: string, operatorEmail?: string): Asset => {
    const fullDb = readDb();
    const assetIndex = fullDb.assets.findIndex(a => a.id === id);
    if (assetIndex === -1) throw new Error("Asset not found");
    
    const asset = fullDb.assets[assetIndex];
    asset.status = "Maintenance";
    asset.assignedToUserId = null; // force unassign if any
    asset.history.push({
      id: `h-${Date.now()}`,
      action: "Marked Under Maintenance",
      userId: null,
      userName: "Admin",
      date: new Date().toISOString().split("T")[0],
      notes: notes || "Sent for hardware diagnostics / repair"
    });

    fullDb.assets[assetIndex] = asset;
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Asset Maintenance", `Marked ${asset.name} under maintenance`);
    return asset;
  },
  deleteAsset: (id: string, operatorId?: string, operatorEmail?: string) => {
    const fullDb = readDb();
    const asset = fullDb.assets.find(a => a.id === id);
    if (!asset) throw new Error("Asset not found");
    fullDb.assets = fullDb.assets.filter(a => a.id !== id);
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Delete Asset", `Permanently removed asset: ${asset.name} (${asset.assetId})`);
  },

  getLeaves: (): Leave[] => readDb().leaves,
  getLeavesByUser: (userId: string): Leave[] => readDb().leaves.filter(l => l.userId === userId),
  applyLeave: (leave: Omit<Leave, "id" | "status" | "managerNotes" | "dateSubmitted">): Leave => {
    const fullDb = readDb();
    const id = `lv-${Date.now()}`;
    const user = fullDb.users.find(u => u.id === leave.userId);
    const newLeave: Leave = {
      ...leave,
      id,
      status: "Pending",
      managerNotes: null,
      dateSubmitted: new Date().toISOString(),
    };
    fullDb.leaves.push(newLeave);

    // Notify manager or admin
    const managerId = user?.managerId || "usr-admin";
    fullDb.notifications.push({
      id: `notif-${Date.now()}`,
      userId: managerId,
      title: "New Leave Request Submitted",
      content: `${user ? user.firstName + " " + user.lastName : "An employee"} requested ${leave.duration} day(s) of ${leave.leaveType} leave starting ${leave.startDate}.`,
      type: "leave",
      read: false,
      date: new Date().toISOString()
    });

    writeDb(fullDb);
    db.logAudit(leave.userId, user?.email || "employee@company.com", "Apply Leave", `Requested ${leave.duration} day(s) of ${leave.leaveType} leave`);
    return newLeave;
  },
  updateLeaveStatus: (id: string, status: LeaveStatus, managerNotes: string, managerId: string): Leave => {
    const fullDb = readDb();
    const leaveIndex = fullDb.leaves.findIndex(l => l.id === id);
    if (leaveIndex === -1) throw new Error("Leave request not found");
    
    const leave = fullDb.leaves[leaveIndex];
    leave.status = status;
    leave.managerNotes = managerNotes;
    fullDb.leaves[leaveIndex] = leave;

    const requester = fullDb.users.find(u => u.id === leave.userId);
    const manager = fullDb.users.find(u => u.id === managerId);

    // Notify employee
    fullDb.notifications.push({
      id: `notif-${Date.now()}`,
      userId: leave.userId,
      title: `Leave Request ${status}`,
      content: `Your leave request for ${leave.duration} day(s) of ${leave.leaveType} has been ${status}. Notes: ${managerNotes || "None"}`,
      type: "leave",
      read: false,
      date: new Date().toISOString()
    });

    writeDb(fullDb);
    db.logAudit(managerId, manager?.email || "manager@company.com", "Review Leave", `Set leave status for request ${id} to ${status}`);
    return leave;
  },

  getAttendance: (): Attendance[] => readDb().attendance,
  getAttendanceByUser: (userId: string): Attendance[] => readDb().attendance.filter(a => a.userId === userId),
  clockIn: (userId: string): Attendance => {
    const fullDb = readDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const existing = fullDb.attendance.find(a => a.userId === userId && a.date === todayStr);
    if (existing) {
      throw new Error("Already clocked in today!");
    }

    const clockInTime = new Date();
    const settings = fullDb.settings;
    
    // Check if late (based on settings checkInTime "09:00" and gracePeriod e.g. 30 mins)
    const [targetH, targetM] = settings.checkInTime.split(":").map(Number);
    const targetTime = new Date();
    targetTime.setHours(targetH, targetM + settings.gracePeriodMinutes, 0, 0);

    let lateArrivalMinutes = 0;
    let status: AttendanceStatus = "Present";

    if (clockInTime.getTime() > targetTime.getTime()) {
      status = "Late";
      lateArrivalMinutes = Math.floor((clockInTime.getTime() - targetTime.getTime()) / 60000);
    }

    const newAttendance: Attendance = {
      id: `att-${userId}-${todayStr}`,
      userId,
      date: todayStr,
      clockIn: clockInTime.toISOString(),
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalBreakMs: 0,
      totalWorkMs: 0,
      status,
      lateArrivalMinutes
    };

    fullDb.attendance.push(newAttendance);
    writeDb(fullDb);
    return newAttendance;
  },
  clockOut: (userId: string): Attendance => {
    const fullDb = readDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const index = fullDb.attendance.findIndex(a => a.userId === userId && a.date === todayStr);
    if (index === -1) {
      throw new Error("You must Clock In first today!");
    }

    const att = fullDb.attendance[index];
    if (att.clockOut) {
      throw new Error("Already clocked out today!");
    }

    const clockOutTime = new Date();
    att.clockOut = clockOutTime.toISOString();

    // If active break, end it
    if (att.breakStart && !att.breakEnd) {
      att.breakEnd = clockOutTime.toISOString();
      att.totalBreakMs += new Date(att.breakEnd).getTime() - new Date(att.breakStart).getTime();
    }

    // Work calculation
    const inTime = new Date(att.clockIn).getTime();
    const outTime = clockOutTime.getTime();
    const durationMs = outTime - inTime;
    att.totalWorkMs = durationMs - att.totalBreakMs;

    // Check early exit (e.g. before 17:00 / 8 hours)
    const hoursWorked = att.totalWorkMs / (1000 * 60 * 60);
    if (hoursWorked < fullDb.settings.baseWorkHours && att.status !== "Late") {
      att.status = "EarlyExit";
    }

    fullDb.attendance[index] = att;
    writeDb(fullDb);
    return att;
  },
  startBreak: (userId: string): Attendance => {
    const fullDb = readDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const index = fullDb.attendance.findIndex(a => a.userId === userId && a.date === todayStr);
    if (index === -1) throw new Error("Not clocked in today!");

    const att = fullDb.attendance[index];
    if (att.clockOut) throw new Error("Already clocked out today!");
    if (att.breakStart && !att.breakEnd) throw new Error("Already on break!");

    att.breakStart = new Date().toISOString();
    att.breakEnd = null;

    fullDb.attendance[index] = att;
    writeDb(fullDb);
    return att;
  },
  endBreak: (userId: string): Attendance => {
    const fullDb = readDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const index = fullDb.attendance.findIndex(a => a.userId === userId && a.date === todayStr);
    if (index === -1) throw new Error("Not clocked in today!");

    const att = fullDb.attendance[index];
    if (!att.breakStart || att.breakEnd) throw new Error("You are not on a break!");

    att.breakEnd = new Date().toISOString();
    att.totalBreakMs += new Date(att.breakEnd).getTime() - new Date(att.breakStart).getTime();

    fullDb.attendance[index] = att;
    writeDb(fullDb);
    return att;
  },

  getNotifications: (userId: string): Notification[] => {
    return readDb().notifications.filter(n => n.userId === userId || n.userId === "all");
  },
  createNotification: (userId: string, title: string, content: string, type: "leave" | "asset" | "attendance" | "profile" | "system"): Notification => {
    const fullDb = readDb();
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title,
      content,
      type,
      read: false,
      date: new Date().toISOString()
    };
    fullDb.notifications.unshift(notif);
    // limit notifications list size to avoid bloated JSON
    if (fullDb.notifications.length > 300) {
      fullDb.notifications = fullDb.notifications.slice(0, 300);
    }
    writeDb(fullDb);
    return notif;
  },
  markNotificationRead: (id: string) => {
    const fullDb = readDb();
    const index = fullDb.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      fullDb.notifications[index].read = true;
      writeDb(fullDb);
    }
  },
  clearNotifications: (userId: string) => {
    const fullDb = readDb();
    fullDb.notifications = fullDb.notifications.map(n => {
      if (n.userId === userId || n.userId === "all") {
        n.read = true;
      }
      return n;
    });
    writeDb(fullDb);
  },

  getAuditLogs: (): AuditLog[] => readDb().auditLogs,
  logAudit: (userId: string, email: string, action: string, details: string) => {
    const fullDb = readDb();
    fullDb.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId,
      email,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    // keep audit logs at max 500
    if (fullDb.auditLogs.length > 500) {
      fullDb.auditLogs = fullDb.auditLogs.slice(0, 500);
    }
    writeDb(fullDb);
  },

  getSettings: (): SystemSettings => readDb().settings,
  updateSettings: (updates: Partial<SystemSettings>, operatorId?: string, operatorEmail?: string): SystemSettings => {
    const fullDb = readDb();
    fullDb.settings = {
      ...fullDb.settings,
      ...updates,
    };
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Update System Settings", "Updated company preferences and leave policies");
    return fullDb.settings;
  },
  createBackupSnapshot: (operatorId?: string, operatorEmail?: string) => {
    const fullDb = readDb();
    const id = `bak-${Date.now()}`;
    const newBackup = {
      id,
      name: `snapshot_${new Date().toISOString().replace(/[:.]/g, "-")}_recovery.bak`,
      date: new Date().toISOString(),
      size: `${(Math.random() * 5 + 2).toFixed(2)} MB`,
      status: "Successful"
    };
    if (!fullDb.settings.backups) {
      fullDb.settings.backups = [];
    }
    fullDb.settings.backups = [newBackup, ...fullDb.settings.backups];
    writeDb(fullDb);
    db.logAudit(operatorId || "system", operatorEmail || "system@worksphere.com", "Database Backup", `Created system backup: ${newBackup.name}`);
    return newBackup;
  },

  getMaintenanceTickets: (): MaintenanceTicket[] => readDb().maintenanceTickets || [],
  
  createMaintenanceTicket: (ticket: Omit<MaintenanceTicket, "ticketId" | "createdAt" | "updatedAt" | "status">): MaintenanceTicket => {
    const fullDb = readDb();
    const ticketId = `TKT-${Date.now()}`;
    const newTicket: MaintenanceTicket = {
      ...ticket,
      ticketId,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!fullDb.maintenanceTickets) {
      fullDb.maintenanceTickets = [];
    }
    fullDb.maintenanceTickets.push(newTicket);

    // Update the related asset
    const assetIndex = fullDb.assets.findIndex(a => a.id === ticket.assetId);
    if (assetIndex !== -1) {
      fullDb.assets[assetIndex].status = "Maintenance";
      fullDb.assets[assetIndex].history.push({
        id: `h-${Date.now()}`,
        action: "Maintenance",
        userId: ticket.reportedByUserId,
        userName: ticket.reportedByName,
        date: new Date().toISOString().split("T")[0],
        notes: `Ticket filed: ${ticket.description}`
      });
    }

    writeDb(fullDb);
    db.logAudit(ticket.reportedByUserId, ticket.reportedByName, "Report Asset Damage", `Filed damage ticket ${ticketId} for ${ticket.assetName}`);
    return newTicket;
  },

  resolveMaintenanceTicket: (ticketId: string, resolutionNotes: string, resolvedByUserId: string, resolvedByName: string): MaintenanceTicket => {
    const fullDb = readDb();
    if (!fullDb.maintenanceTickets) {
      fullDb.maintenanceTickets = [];
    }
    const index = fullDb.maintenanceTickets.findIndex(t => t.ticketId === ticketId);
    if (index === -1) throw new Error("Ticket not found");

    const ticket = fullDb.maintenanceTickets[index];
    ticket.status = "Resolved";
    ticket.resolutionNotes = resolutionNotes;
    ticket.resolvedBy = resolvedByName;
    ticket.resolvedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    // Restore related asset status
    const assetIndex = fullDb.assets.findIndex(a => a.id === ticket.assetId);
    if (assetIndex !== -1) {
      const asset = fullDb.assets[assetIndex];
      asset.status = asset.assignedToUserId ? "Assigned" : "Available";
      asset.history.push({
        id: `h-${Date.now()}`,
        action: "Maintenance Resolved",
        userId: resolvedByUserId,
        userName: resolvedByName,
        date: new Date().toISOString().split("T")[0],
        notes: `Ticket resolved: ${resolutionNotes}`
      });
    }

    writeDb(fullDb);
    db.logAudit(resolvedByUserId, resolvedByName, "Resolve Asset Ticket", `Resolved damage ticket ${ticketId}`);
    return ticket;
  }
};
