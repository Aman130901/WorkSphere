import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Calendar,
  Search,
  Filter,
  BarChart2,
  TrendingUp,
  Loader2,
  Award
} from "lucide-react";
import { api } from "../utils/api";
import { Attendance, User } from "../types";

interface AttendanceViewProps {
  currentUser: User;
  isDarkMode: boolean;
}

export default function AttendanceView({ currentUser, isDarkMode }: AttendanceViewProps) {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search parameters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userTodayLog, setUserTodayLog] = useState<Attendance | null>(null);

  // Statistics counters
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    earlyExit: 0,
    avgHours: 0
  });

  useEffect(() => {
    fetchLogs();
    fetchTodayStatus();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Attendance[]>("/attendance");
      setLogs(data);
      calculateStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance registry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const today = await api.get<Attendance | null>("/attendance/today");
      setUserTodayLog(today);
    } catch (err) {
      console.error("Failed to fetch today's log", err);
    }
  };

  const calculateStats = (data: Attendance[]) => {
    // Only compile stats for current user
    const userLogs = data.filter(l => l.userId === currentUser.id);
    const present = userLogs.filter(l => l.status === "Present" || l.status === "Late").length;
    const late = userLogs.filter(l => l.status === "Late").length;
    const earlyExit = userLogs.filter(l => l.status === "EarlyExit").length;

    // Average hours calculation
    const fullyCompleted = userLogs.filter(l => l.clockOut);
    let totalWorkHours = 0;
    fullyCompleted.forEach(l => {
      totalWorkHours += l.totalWorkMs / (1000 * 60 * 60);
    });
    const avgHours = fullyCompleted.length > 0 ? totalWorkHours / fullyCompleted.length : 0;

    setStats({
      present,
      late,
      earlyExit,
      avgHours
    });
  };

  const handleClockAction = async (action: "clock-in" | "clock-out" | "break-start" | "break-end") => {
    try {
      setError(null);
      const res = await api.post<Attendance>(`/attendance/${action}`);
      setUserTodayLog(res);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || "Clocking request failed.");
    }
  };

  const formatHours = (ms: number): string => {
    if (!ms || isNaN(ms)) return "0.0h";
    const h = ms / (1000 * 60 * 60);
    return `${h.toFixed(1)}h`;
  };

  const formatTime = (isoString: string | null): string => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Filter logs list based on user search query and status filter
  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      l.date.includes(search);
    const matchesStatus = statusFilter === "" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Shift Logs & Attendance</h1>
        <p className="text-xs text-stone-500 font-semibold mt-1">Clock In/Out, record lunch breaks, monitor late arrivals, and export compliance sheets.</p>
      </div>

      {/* CLOCK IN/OUT WORKSPACE WIDGET AND STATS COUNTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COMPONENT: LIVE TIMER & SHIFT ACTION CONTROLLER */}
        <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-center flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="block text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-1">Interactive Shift Clock</span>
            <p className="text-xs text-stone-500">Corporate Standard Time</p>
            <h3 className="text-3xl font-mono font-bold mt-3 mb-4 text-orange-600 dark:text-orange-400">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </h3>
            <p className="text-[11px] text-stone-400 font-medium">Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-2 mt-4">
            {!userTodayLog && (
              <button
                onClick={() => handleClockAction("clock-in")}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/15"
                id="attendance-clock-in"
              >
                <Clock className="h-4 w-4" />
                <span>Clock In Shift Today</span>
              </button>
            )}

            {userTodayLog && !userTodayLog.clockOut && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {userTodayLog.breakStart && !userTodayLog.breakEnd ? (
                    <button
                      onClick={() => handleClockAction("break-end")}
                      className="py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-red-600/30"
                      id="attendance-resume"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Resume Working</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClockAction("break-start")}
                      className="py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-1.5"
                      id="attendance-break"
                    >
                      <Coffee className="h-4 w-4" />
                      <span>Take Break</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleClockAction("clock-out")}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-1.5"
                    id="attendance-clock-out"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Clock Out</span>
                  </button>
                </div>

                <div className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded text-[10px] text-stone-500 text-left font-semibold space-y-1">
                  <p className="flex justify-between"><span>Clocked In:</span> <span className="font-bold text-stone-800 dark:text-stone-300">{formatTime(userTodayLog.clockIn)}</span></p>
                  {userTodayLog.breakStart && (
                    <p className="flex justify-between"><span>Break:</span> <span className="font-bold">{formatTime(userTodayLog.breakStart)} {userTodayLog.breakEnd ? `to ${formatTime(userTodayLog.breakEnd)}` : "(Active)"}</span></p>
                  )}
                </div>
              </div>
            )}

            {userTodayLog?.clockOut && (
              <div className="p-4 bg-emerald-50 dark:bg-stone-950/60 border border-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p>Your shift logs are successfully recorded today!</p>
                <p className="text-[10px] text-stone-400 mt-1 font-semibold">In: {formatTime(userTodayLog.clockIn)} | Out: {formatTime(userTodayLog.clockOut)}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT STATS CARDS BLOCK */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              title: "Days Clocked Present",
              value: stats.present,
              desc: "Approved active records on directory",
              icon: CheckCircle2,
              color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-l-emerald-500"
            },
            {
              title: "Late Arrivals",
              value: stats.late,
              desc: "Flagged entries beyond grace parameter",
              icon: AlertCircle,
              color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-l-amber-500"
            },
            {
              title: "Early Shift Exits",
              value: stats.earlyExit,
              desc: "Departures completed before 8h bounds",
              icon: Clock,
              color: "text-red-500 bg-red-50 dark:bg-red-950/40 border-l-red-500"
            },
            {
              title: "Avg Productive Hours",
              value: `${stats.avgHours.toFixed(1)}h`,
              desc: "Daily completed duration average",
              icon: BarChart2,
              color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-l-orange-500"
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className={`p-4 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 border-l-4 ${item.color} shadow-sm flex flex-col justify-between`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-extrabold">{item.title}</span>
                  <Icon className="h-4 w-4 text-stone-400" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold">{item.value}</p>
                  <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-tight">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SEARCH AND HISTORIC LOGS LIST */}
      <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        
        {/* TABLE FILTER PANEL */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-stone-500 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Attendance Log History Ledger</span>
          </span>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative text-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search date or employee..."
                className="pl-8 pr-3 py-1.5 w-full sm:w-48 rounded border dark:bg-stone-950 dark:border-stone-800 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-1.5 px-2 text-xs rounded border dark:bg-stone-950 dark:border-stone-800 font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="EarlyExit">Early Exit Only</option>
            </select>
          </div>
        </div>

        {/* LOGS LIST TABLE */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-stone-500 font-medium mt-2">Loading shift log database...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-950 text-stone-400 border-b border-stone-200 dark:border-stone-800 font-semibold uppercase tracking-wider">
                  <th className="p-4 font-extrabold">Employee</th>
                  <th className="p-4 font-extrabold">Date</th>
                  <th className="p-4 font-extrabold">Clock In</th>
                  <th className="p-4 font-extrabold">Clock Out</th>
                  <th className="p-4 font-extrabold">Total Break</th>
                  <th className="p-4 font-extrabold">Total Work</th>
                  <th className="p-4 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-stone-100 dark:border-stone-900 hover:bg-stone-50/50 dark:hover:bg-stone-950/60 transition-colors">
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      {log.employeeName || currentUser.firstName + " " + currentUser.lastName}
                    </td>
                    <td className="p-4 font-medium text-stone-500">{log.date}</td>
                    <td className="p-4 font-bold text-stone-700 dark:text-stone-300">{formatTime(log.clockIn)}</td>
                    <td className="p-4 text-stone-800 dark:text-stone-400">{formatTime(log.clockOut)}</td>
                    <td className="p-4 text-stone-400">{(log.totalBreakMs / 60000).toFixed(0)} mins</td>
                    <td className="p-4 font-bold text-orange-600 dark:text-orange-400">{formatHours(log.totalWorkMs)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        log.status === "Present"
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                          : log.status === "Late"
                          ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                          : "text-red-600 bg-red-50 dark:bg-red-950/40"
                      }`}>
                        {log.status} {log.lateArrivalMinutes > 0 && `(+${log.lateArrivalMinutes}m)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-stone-400">No attendance logs match the active parameters.</div>
        )}
      </div>

    </div>
  );
}
