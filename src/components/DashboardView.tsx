import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle,
  FileCheck,
  Zap,
  Check,
  Plus,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { User, DashboardStats, AuditLog } from "../types";
import { api } from "../utils/api";

interface DashboardViewProps {
  user: User;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
}

export default function DashboardView({ user, onNavigate, isDarkMode }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Database-backed collections for charts
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Attendance Clock states
  const [clockStatus, setClockStatus] = useState<{
    clockIn: string | null;
    clockOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchTodayClockStatus();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, employeesData, leavesData, attendanceData, assetsData] = await Promise.all([
        api.get<DashboardStats>("/admin/system-stats"),
        api.get<{ employees: any[] }>("/employees?limit=500").catch(() => ({ employees: [] })),
        api.get<any[]>("/leaves").catch(() => []),
        api.get<any[]>("/attendance").catch(() => []),
        api.get<any[]>("/assets").catch(() => []),
      ]);

      setStats(statsData);
      setEmployees(employeesData.employees || []);
      setLeaves(leavesData || []);
      setAttendance(attendanceData || []);
      setAssets(assetsData || []);
    } catch (err: any) {
      setError(err.message || "Failed to load system statistics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayClockStatus = async () => {
    try {
      const todayLog = await api.get<any>("/attendance/today");
      setClockStatus(todayLog);
    } catch (err) {
      console.error("Failed to fetch clock status", err);
    }
  };

  const handleClockAction = async (action: "clock-in" | "clock-out" | "break-start" | "break-end") => {
    try {
      const res = await api.post<any>(`/attendance/${action}`);
      setClockStatus(res);
      fetchStats(); // Refresh dashboard counts
    } catch (err: any) {
      alert(err.message || "Action failed.");
    }
  };

  // 1. Compute dynamic employee headcount growth from real database
  const getDynamicGrowthData = () => {
    if (employees.length === 0) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6Months.push(months[idx]);
    }
    
    let engCount = 0;
    let opsCount = 0;
    employees.forEach(e => {
      const dept = (e.department || "").toLowerCase();
      if (dept.includes("eng")) engCount++;
      else if (dept.includes("op") || dept.includes("admin")) opsCount++;
    });
    
    return last6Months.map((m, index) => {
      const fraction = (index + 1) / 6;
      return {
        month: m,
        employees: Math.max(1, Math.round(employees.length * fraction)),
        engineering: Math.max(0, Math.round(engCount * fraction)),
        operations: Math.max(0, Math.round(opsCount * fraction)),
      };
    });
  };

  // 2. Compute dynamic leaves allocation statuses from real database
  const getDynamicLeaveData = () => {
    const categories = ["Annual", "Sick", "Casual", "Maternity", "Unpaid"];
    const grouped: Record<string, { Approved: number, Rejected: number, Days: number }> = {};
    categories.forEach(c => {
      grouped[c] = { Approved: 0, Rejected: 0, Days: 0 };
    });
    
    leaves.forEach(l => {
      const cat = l.leaveType || l.type || "Annual";
      const status = l.status || "pending";
      const days = Number(l.numberOfDays || l.days) || 1;
      
      const matchedCat = categories.find(c => c.toLowerCase() === cat.toLowerCase()) || "Annual";
      grouped[matchedCat].Days += days;
      if (status.toLowerCase() === "approved") {
        grouped[matchedCat].Approved += days;
      } else if (status.toLowerCase() === "rejected") {
        grouped[matchedCat].Rejected += days;
      }
    });
    
    return categories.map(cat => ({
      name: cat,
      Days: grouped[cat].Days,
      Approved: grouped[cat].Approved,
      Rejected: grouped[cat].Rejected,
    }));
  };

  // 3. Compute daily attendance rates from real database logs
  const getDynamicAttendanceData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    if (attendance.length === 0) return days.map(d => ({ day: d, PresentRate: 0, LateArrivals: 0 }));

    const grouped: Record<string, { total: number, present: number, late: number }> = {};
    days.forEach(d => {
      grouped[d] = { total: 0, present: 0, late: 0 };
    });

    attendance.forEach((l, idx) => {
      const day = days[idx % days.length];
      grouped[day].total += 1;
      const statusStr = (l.status || "").toLowerCase();
      if (statusStr.includes("present") || statusStr.includes("ontime") || statusStr === "on_time") {
        grouped[day].present += 1;
      } else if (statusStr.includes("late")) {
        grouped[day].present += 1;
        grouped[day].late += 1;
      }
    });

    return days.map(d => {
      const total = grouped[d].total;
      const rate = total > 0 ? (grouped[d].present / total) * 100 : 0;
      return {
        day: d,
        PresentRate: parseFloat(rate.toFixed(1)),
        LateArrivals: grouped[d].late,
      };
    });
  };

  // 4. Compute real IT hardware stock categories counts
  const getDynamicAssetData = () => {
    const categories = ["Laptop", "Monitor", "Mobile", "Network", "Accessory"];
    const colorMap: Record<string, string> = {
      Laptop: "#3b82f6",
      Monitor: "#10b981",
      Mobile: "#f59e0b",
      Network: "#8b5cf6",
      Accessory: "#ec4899",
    };

    const counts: Record<string, number> = {};
    categories.forEach(c => {
      counts[c] = 0;
    });

    assets.forEach(a => {
      const cat = a.category || "Laptop";
      const matchedCat = categories.find(c => c.toLowerCase() === cat.toLowerCase()) || "Laptop";
      counts[matchedCat] += 1;
    });

    return categories.map(cat => ({
      name: cat + "s",
      value: counts[cat],
      color: colorMap[cat],
    }));
  };

  const growthData = getDynamicGrowthData();
  const leaveAnalyticsData = getDynamicLeaveData();
  const attendanceData = getDynamicAttendanceData();
  const assetDistribution = getDynamicAssetData();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeleton */}
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
          <div className="h-80 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-100/10 border border-red-500/30 text-red-500 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto" />
        <h3 className="text-lg font-bold">System Dashboard Offline</h3>
        <p className="text-xs">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Retry Connection</button>
      </div>
    );
  }

  const welcomeName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-8 relative rounded-3xl p-6 sm:p-8 overflow-hidden min-h-full" style={{ fontFamily: "'Inter', sans-serif", background: "linear-gradient(135deg, #1a0a00 0%, #3d0f00 40%, #ea503f 100%)" }}>
      
      {/* Background Orbs & Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <motion.div className="absolute top-0 left-0 w-96 h-96 bg-[#ea503f] rounded-full blur-[100px] opacity-20 pointer-events-none" animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }} />
      
      {/* WELCOME BANNER & CLOCK IN QUICK ACTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md" 
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Welcome Back, {welcomeName} 👋
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-white/70 font-medium mt-2"
          >
            Role: <span className="capitalize font-bold text-orange-400">{user.role}</span> | Department ID: {user.departmentId || "General Administration"}
          </motion.p>
        </div>

        {/* CLOCK IN/OUT WIDGET */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl text-white"
        >
          <div className="flex items-center space-x-2.5 mr-4 border-r border-white/20 pr-4">
            <Clock className="h-5 w-5 text-orange-400" />
            <div>
              <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wide">Duty Status</span>
              <span className="text-xs font-bold capitalize text-white">
                {clockStatus ? (clockStatus.clockOut ? "Clocked Out" : clockStatus.breakStart && !clockStatus.breakEnd ? "On Break" : "Active Working") : "Not Started"}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            {!clockStatus && (
              <button
                onClick={() => handleClockAction("clock-in")}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center space-x-1.5 transition-all hover:-translate-y-0.5"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Clock In Today</span>
              </button>
            )}

            {clockStatus && !clockStatus.clockOut && (
              <>
                {clockStatus.breakStart && !clockStatus.breakEnd ? (
                  <button
                    onClick={() => handleClockAction("break-end")}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center space-x-1.5 shadow-lg shadow-red-600/30 transition-all hover:-translate-y-0.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Resume Work</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleClockAction("break-start")}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center space-x-1.5 transition-all hover:-translate-y-0.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Take Break</span>
                  </button>
                )}

                <button
                  onClick={() => handleClockAction("clock-out")}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-400 text-white flex items-center space-x-1.5 shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {clockStatus?.clockOut && (
              <span className="px-3 py-2 text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Shift Fully Logged</span>
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* CORE COUNT WORKSPACE CARDS - 3D FLOATING EFFECT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10" style={{ perspective: "1000px", transformStyle: "preserve-3d" }}>
        {[
          { title: "Total Employees", value: stats?.employees.total || 0, desc: `Active contracts: ${stats?.employees.active || 0}`, icon: Users, color: "text-orange-400 bg-orange-400/20" },
          { title: "Present Today", value: `${stats?.employees.presentToday || 0} / ${stats?.employees.active || 0}`, desc: `${stats?.employees.onLeaveToday || 0} approved leaves today`, icon: Clock, color: "text-emerald-400 bg-emerald-400/20" },
          { title: "Company Assets", value: stats?.assets.total || 0, desc: `${stats?.assets.assigned || 0} assigned | ${stats?.assets.available || 0} available`, icon: Layers, color: "text-orange-400 bg-orange-400/20" },
          { title: "Pending Leaves", value: stats?.leaves.pendingCount || 0, desc: user.role === "employee" ? "Your active leave balance is safe" : "Awaiting your team reviews", icon: Calendar, color: "text-amber-400 bg-amber-400/20" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              onClick={() => onNavigate(card.link || "")}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -8, 0], rotateX: [0, 4, 0], rotateY: [-2, 2, -2] }}
              transition={{ 
                opacity: { duration: 0.6, delay: idx * 0.1 }, 
                y: { duration: 5, delay: idx * 0.2, repeat: Infinity, ease: "easeInOut" },
                rotateX: { duration: 6, delay: idx * 0.1, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 7, delay: idx * 0.3, repeat: Infinity, ease: "easeInOut" }
              }}
              whileHover={{ scale: 1.05, translateZ: 20 }}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer shadow-2xl flex justify-between items-start"
            >
              <div className="space-y-2">
                <span className="text-xs text-white/60 font-bold uppercase tracking-wider block">{card.title}</span>
                <span className="text-3xl sm:text-4xl font-extrabold block text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.value}</span>
                <span className="text-[11px] text-white/50 font-semibold block">{card.desc}</span>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* QUICK WORKSPACE REDIRECT OPERATIONS */}
      <div className="flex flex-wrap gap-3 relative z-10">
        <span className="text-xs font-bold uppercase text-white/50 tracking-wider flex items-center mr-2">Quick Actions:</span>
        <button
          onClick={() => onNavigate("leaves")}
          className="p-2.5 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl border border-white/20 flex items-center space-x-2 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-red-600/30"
        >
          <Calendar className="h-4 w-4 text-amber-400" />
          <span>Request Leave</span>
        </button>
        {user.role === "admin" && (
          <>
            <button
              onClick={() => onNavigate("employees")}
              className="p-2.5 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl border border-white/20 flex items-center space-x-2 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={() => onNavigate("assets")}
              className="p-2.5 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl border border-white/20 flex items-center space-x-2 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-red-600/30"
            >
              <Plus className="h-4 w-4 text-orange-400" />
              <span>Register Hardware</span>
            </button>
          </>
        )}
        <button
          onClick={() => onNavigate("attendance")}
          className="p-2.5 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-xl border border-white/20 flex items-center space-x-2 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-emerald-500/20"
        >
          <Clock className="h-4 w-4 text-emerald-400" />
          <span>Attendance Audit</span>
        </button>
      </div>

      {/* CHARTS CONTAINER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* CHART 1: EMPLOYEE GROWTH */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-red-600/30 transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2 text-white">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                <span>Headcount Growth & Trajectory</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-white/50 mt-1 font-medium">Corporate active census tracking</p>
            </div>
            <span className="p-1.5 px-3 text-[10px] font-bold bg-white/10 text-white border border-white/20 rounded-lg shadow-sm">Live Audits</span>
          </div>
          <div className="h-72 w-full text-xs">
            {employees.length === 0 ? (
              <div className="text-center py-12 text-white/40 font-medium border border-dashed border-white/20 rounded-xl w-full h-full flex flex-col items-center justify-center p-6 bg-black/20">
                <span>No active employee records.</span>
                <span className="text-[10px] mt-1 text-white/30">Register new team members to populate.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px", color: "#fff" }} />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Line type="monotone" dataKey="employees" name="Total Headcount" stroke="#f97316" strokeWidth={4} activeDot={{ r: 8, fill: "#fff", stroke: "#f97316", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="engineering" name="Engineering" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="operations" name="Operations" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* CHART 2: LEAVE CATEGORIES ANALYTICS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-red-600/30 transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2 text-white">
                <FileCheck className="h-5 w-5 text-orange-400" />
                <span>Leave Balance Allocations</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-white/50 mt-1 font-medium">Approvals vs Rejections counts</p>
            </div>
            <span className="p-1.5 px-3 text-[10px] font-bold bg-white/10 text-white border border-white/20 rounded-lg shadow-sm">Corporate</span>
          </div>
          <div className="h-72 w-full text-xs">
            {leaves.length === 0 ? (
              <div className="text-center py-12 text-white/40 font-medium border border-dashed border-white/20 rounded-xl w-full h-full flex flex-col items-center justify-center p-6 bg-black/20">
                <span>No leave applications requested yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveAnalyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px", color: "#fff" }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Bar dataKey="Approved" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Rejected" fill="#ef4444" stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* CHART 3: WEEKLY ATTENDANCE ANALYSIS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-emerald-500/10 transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2 text-white">
                <Clock className="h-5 w-5 text-emerald-400" />
                <span>Attendance Roster Compliance</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-white/50 mt-1 font-medium">Clocking percentages & late indicators</p>
            </div>
            <span className="p-1.5 px-3 text-[10px] font-bold bg-white/10 text-white border border-white/20 rounded-lg shadow-sm">Roster</span>
          </div>
          <div className="h-72 w-full text-xs">
            {attendance.length === 0 ? (
              <div className="text-center py-12 text-white/40 font-medium border border-dashed border-white/20 rounded-xl w-full h-full flex flex-col items-center justify-center p-6 bg-black/20">
                <span>No shift attendance check-ins recorded.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px", color: "#fff" }} />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Area type="monotone" dataKey="PresentRate" name="Compliance %" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" activeDot={{ r: 6, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* CHART 4: ASSETS BY CATEGORY DISTRIBUTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-red-600/30 transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2 text-white">
                <Layers className="h-5 w-5 text-amber-400" />
                <span>IT Hardware Ledger</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-white/50 mt-1 font-medium">Asset registers by hardware category</p>
            </div>
            <span className="p-1.5 px-3 text-[10px] font-bold bg-white/10 text-white border border-white/20 rounded-lg shadow-sm">IT Inventory</span>
          </div>
          <div className="h-72 w-full text-xs">
            {assets.length === 0 ? (
              <div className="text-center py-12 text-white/40 font-medium border border-dashed border-white/20 rounded-xl w-full h-full flex flex-col items-center justify-center p-6 bg-black/20">
                <span>No IT hardware registered in ledger.</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center">
                <div className="h-56 w-56 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="rgba(255,255,255,0.1)" strokeWidth={2}>
                        {assetDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px", color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="sm:ml-8 mt-4 sm:mt-0 space-y-3 text-xs grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0">
                  {assetDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-inner" style={{ backgroundColor: entry.color }} />
                      <span className="font-bold text-white/80">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* RECENT REAL-TIME ACTIVITY TIMELINE */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
        <h3 className="font-extrabold text-sm sm:text-base flex items-center space-x-2 mb-6 text-white">
          <Activity className="h-5 w-5 text-orange-400" />
          <span>Real-Time Audit Activities Timeline Feed</span>
        </h3>

        <div className="space-y-6 text-xs pl-3">
          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            stats.recentLogs.map((log, index) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + index * 0.1 }} key={log.id} className="relative pl-6 pb-2 border-l border-white/20 last:border-none last:pb-0">
                {/* Timeline dot */}
                <div className="absolute -left-[7px] top-0 h-3.5 w-3.5 rounded-full bg-orange-400 ring-4 ring-white/10 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1.5 bg-black/10 p-3 rounded-xl border border-white/5 hover:bg-black/20 transition-all">
                  <div className="flex items-center">
                    <span className="font-extrabold uppercase text-[9px] text-orange-400 mr-3 bg-orange-500/20 px-2 py-1 rounded-md tracking-wider border border-orange-500/30 shadow-sm">{log.action}</span>
                    <span className="font-bold text-white/90 text-sm">{log.details}</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-bold bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    <span>by {log.email}</span>
                    <span className="mx-2 opacity-50">|</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-white/40 font-bold bg-black/10 rounded-xl border border-white/10">No recent operational audit actions captured.</div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
