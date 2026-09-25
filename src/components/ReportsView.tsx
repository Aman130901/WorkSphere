import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Activity,
  ArrowUpRight,
  Clock,
  Loader2,
  Lock
} from "lucide-react";
import { api } from "../utils/api";
import { AuditLog, User } from "../types";
import { generateCSV, downloadCSV } from "../utils/csvExport";

interface ReportsViewProps {
  currentUser: User;
  isDarkMode: boolean;
}

export default function ReportsView({ currentUser, isDarkMode }: ReportsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // Export action states
  const [exportingType, setExportingType] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AuditLog[]>("/admin/audit-logs");
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load corporate audit ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportType: string) => {
    setExportingType(reportType);
    try {
      if (reportType === "Attendance_Roster_Q2") {
        // REPORT A: Shift Attendance & Punctuality Sheets
        const attendanceData = await api.get<any[]>("/attendance");
        let employees: any[] = [];
        try {
          const empResponse = await api.get<{ employees: any[] }>("/employees?limit=200");
          employees = empResponse.employees || [];
        } catch (e) {
          console.warn("Failed to fetch employees list for name mapping:", e);
        }

        const headers = ["Employee Name", "Date", "Clock In", "Clock Out", "Hours Worked", "Late / On Time"];
        const rows = attendanceData.map(log => {
          let name = log.employeeName;
          if (!name && log.userId) {
            const matchedEmp = employees.find(e => e.id === log.userId);
            if (matchedEmp) {
              name = `${matchedEmp.firstName} ${matchedEmp.lastName}`;
            }
          }
          if (!name) name = `Employee #${log.userId}`;

          const clockInTime = log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
          const clockOutTime = log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
          const hoursWorked = log.totalWorkMs ? (log.totalWorkMs / (1000 * 60 * 60)).toFixed(2) + " hrs" : "In Progress";
          const arrivalStatus = log.lateArrivalMinutes > 0 ? `Late (+${log.lateArrivalMinutes}m)` : "On Time";

          return [
            name,
            log.date,
            clockInTime,
            clockOutTime,
            hoursWorked,
            arrivalStatus
          ];
        });

        const csvContent = generateCSV(headers, rows);
        const dateStr = new Date().toISOString().split("T")[0];
        downloadCSV(`attendance-register-${dateStr}.csv`, csvContent);

      } else if (reportType === "Leave_Allocations_2026") {
        // REPORT B: Leave Calendar Balances Summary
        const leavesData = await api.get<any[]>("/leaves");
        const empResponse = await api.get<{ employees: any[] }>("/employees?limit=200");
        const employees = empResponse.employees || [];

        const headers = ["Employee Name", "Leave Type", "Approved Days Used", "Remaining Balance", "Employee Status"];
        const defaultAllocations: Record<string, number> = {
          Annual: 20,
          Sick: 10,
          Casual: 7,
          Maternity: 90,
          Paternity: 14,
          Unpaid: 30
        };

        const rows: any[][] = [];
        employees.forEach(emp => {
          const empName = `${emp.firstName} ${emp.lastName}`;
          const empStatus = emp.status;

          Object.entries(defaultAllocations).forEach(([leaveType, allocated]) => {
            const approvedLeaves = leavesData.filter(
              l => l.userId === emp.id && l.leaveType === leaveType && l.status === "Approved"
            );
            const approvedDaysUsed = approvedLeaves.reduce((sum, l) => sum + l.duration, 0);
            const remainingBalance = allocated - approvedDaysUsed;

            rows.push([
              empName,
              leaveType,
              approvedDaysUsed,
              remainingBalance,
              empStatus
            ]);
          });
        });

        const csvContent = generateCSV(headers, rows);
        const dateStr = new Date().toISOString().split("T")[0];
        downloadCSV(`leave-balances-summary-${dateStr}.csv`, csvContent);

      } else if (reportType === "Corporate_Hardware_Laptops") {
        // REPORT C: Hardware Asset Inventory Ledger
        const assetsData = await api.get<any[]>("/assets");
        let employees: any[] = [];
        try {
          const empResponse = await api.get<{ employees: any[] }>("/employees?limit=200");
          employees = empResponse.employees || [];
        } catch (e) {
          console.warn("Failed to fetch employees list for asset assignments:", e);
        }

        const headers = ["Asset ID", "Asset Name", "Category", "Serial Number", "Assigned Employee", "Status", "Date Added"];
        const rows = assetsData.map(ast => {
          let assignedName = "Unassigned";
          if (ast.assignedToUserId) {
            const matchedEmp = employees.find(e => e.id === ast.assignedToUserId);
            if (matchedEmp) {
              assignedName = `${matchedEmp.firstName} ${matchedEmp.lastName}`;
            } else {
              assignedName = `Employee #${ast.assignedToUserId}`;
            }
          }

          return [
            ast.assetId || ast.id || "",
            ast.name || "",
            ast.category || "",
            ast.serialNumber || "N/A",
            assignedName,
            ast.status || "Available",
            ast.dateAdded ? new Date(ast.dateAdded).toLocaleDateString() : "N/A"
          ];
        });

        const csvContent = generateCSV(headers, rows);
        const dateStr = new Date().toISOString().split("T")[0];
        downloadCSV(`hardware-inventory-ledger-${dateStr}.csv`, csvContent);
      }
    } catch (error: any) {
      console.error("Failed to generate CSV export:", error);
      alert("Error generating export: " + (error.message || error));
    } finally {
      setExportingType(null);
    }
  };

  // Filters logic
  const filteredLogs = logs.filter(lg => {
    const matchesSearch =
      lg.email.toLowerCase().includes(search.toLowerCase()) ||
      lg.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "" || lg.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (currentUser.role !== "admin") {
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <Lock className="h-12 w-12 mx-auto text-amber-500 animate-bounce" />
        <h2 className="text-xl font-extrabold">Privileged Access Parameter Enforced</h2>
        <p className="text-xs text-stone-500 leading-relaxed font-semibold">
          Corporate governance parameters and systemic audit logs are exclusively accessible by system administrators. Reach out to your local system admin if you require a compliance sheet export.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Compliance Reports & Audit Ledger</h1>
        <p className="text-xs text-stone-500 font-semibold mt-1">Audit security logs, download payroll summaries, compile hardware inventories, and export sheets.</p>
      </div>

      {/* QUICK DOWNLOAD COMPLIANCE TEMPLATES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Shift Attendance & Punctuality Sheets",
            desc: "Active duty rosters, check-in timestamps, lates, and total hours metrics.",
            icon: Clock,
            type: "Attendance_Roster_Q2"
          },
          {
            title: "Leave Calendar Balances Summary",
            desc: "Approved annual balances, casual balances, sick note attachments, and remaining quotas.",
            icon: Calendar,
            type: "Leave_Allocations_2026"
          },
          {
            title: "Hardware Asset Inventory Ledger",
            desc: "Asset allocations, serial numbers, warranty values, and repair/maintenance tickets.",
            icon: Layers,
            type: "Corporate_Hardware_Laptops"
          }
        ].map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <div key={idx} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-2">
                <div className="p-2 w-10 h-10 rounded-lg bg-orange-50/60 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold">{rep.title}</h3>
                <p className="text-stone-500 leading-relaxed font-semibold">{rep.desc}</p>
              </div>

              <button
                disabled={exportingType !== null}
                onClick={() => handleDownload(rep.type)}
                className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-lg font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
              >
                {exportingType === rep.type ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download CSV Register</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* SYSTEM-WIDE AUDIT TIMELINE TABLE */}
      <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        
        {/* Table Header Filter controls */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-stone-500 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span>Corporate Governance Security Audit Trails</span>
          </span>

          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="pl-8 pr-3 py-1.5 w-full sm:w-48 rounded border dark:bg-stone-950 dark:border-stone-800 focus:outline-none"
              />
            </div>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="p-1.5 rounded border dark:bg-stone-950 dark:border-stone-800 font-semibold"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE_EMPLOYEE">CREATE EMPLOYEE</option>
              <option value="UPDATE_EMPLOYEE">UPDATE EMPLOYEE</option>
              <option value="UPDATE_LEAVE">UPDATE LEAVE</option>
              <option value="CREATE_ASSET">CREATE ASSET</option>
              <option value="ASSIGN_ASSET">ASSIGN ASSET</option>
            </select>
          </div>
        </div>

        {/* Audit logs table list */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-stone-500 font-medium mt-2">Connecting to audit database...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-950 text-stone-400 border-b border-stone-200 dark:border-stone-800 font-semibold uppercase tracking-wider">
                  <th className="p-4 font-extrabold">Audit ID</th>
                  <th className="p-4 font-extrabold">Operator Email</th>
                  <th className="p-4 font-extrabold">Security Action</th>
                  <th className="p-4 font-extrabold">System parameters (Details)</th>
                  <th className="p-4 font-extrabold">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-stone-100 dark:border-stone-900 hover:bg-stone-50/50 dark:hover:bg-stone-950/60 transition-colors">
                    <td className="p-4 font-mono text-stone-400 text-[10px]">{log.id}</td>
                    <td className="p-4 font-bold text-stone-700 dark:text-stone-300">{log.email}</td>
                    <td className="p-4">
                      <span className="p-1 px-2.5 rounded bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[9px] font-extrabold tracking-wide uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500 font-medium max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-4 text-stone-400 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-400">No security audit logs found matching criteria.</div>
        )}

      </div>

    </div>
  );
}
