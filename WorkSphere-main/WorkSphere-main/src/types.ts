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
  employeeCount?: number;
  managerName?: string;
  code?: string;
  budget?: number;
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
  assetId: string;
  name: string;
  category: AssetCategory;
  assignedToUserId: string | null;
  status: AssetStatus;
  dateAdded: string;
  dateAssigned: string | null;
  lastReturned: string | null;
  history: AssetHistory[];
  assignedUserName?: string;
  assignedUserEmail?: string;
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
  duration: number;
  status: LeaveStatus;
  reason: string;
  managerNotes: string | null;
  documentUrl: string | null;
  dateSubmitted: string;
  employeeName?: string;
  employeeEmail?: string;
  employeeTitle?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMs: number;
  totalWorkMs: number;
  status: AttendanceStatus;
  lateArrivalMinutes: number;
  employeeName?: string;
  employeeEmail?: string;
  employeeTitle?: string;
}

export interface Notification {
  id: string;
  userId: string;
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
  checkInTime: string;
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

export interface DashboardStats {
  employees: {
    total: number;
    active: number;
    suspended: number;
    presentToday: number;
    onLeaveToday: number;
  };
  assets: {
    total: number;
    assigned: number;
    maintenance: number;
    available: number;
  };
  leaves: {
    pendingCount: number;
  };
  recentLogs: AuditLog[];
}
