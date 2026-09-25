import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building,
  Users,
  Calendar,
  Clock,
  Layers,
  FileText,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Activity,
  User as UserIcon,
  ShieldCheck,
  Award,
  AlertCircle,
  CheckCircle,
  Cpu
} from "lucide-react";

import AuthPage from "./components/AuthPage";
import DashboardView from "./components/DashboardView";
import EmployeeView from "./components/EmployeeView";
import LeaveView from "./components/LeaveView";
import AttendanceView from "./components/AttendanceView";
import AssetView from "./components/AssetView";
import DepartmentView from "./components/DepartmentView";
import ReportsView from "./components/ReportsView";
import SettingsView from "./components/SettingsView";
import EnterpriseSaaSView from "./components/EnterpriseSaaSView";
import HRCopilot from "./components/HRCopilot";
import { api } from "./utils/api";
import { User, Notification } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<"auth" | "app">("auth");
  const [activeView, setActiveView] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const addToast = (msg: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    let type: "success" | "error" | "info" = "info";
    const lowerMsg = msg.toLowerCase();
    
    if (
      lowerMsg.includes("success") || 
      lowerMsg.includes("approved") || 
      lowerMsg.includes("completed") ||
      lowerMsg.includes("saved")
    ) {
      type = "success";
    } else if (
      lowerMsg.includes("fail") || 
      lowerMsg.includes("error") || 
      lowerMsg.includes("reject") || 
      lowerMsg.includes("must") ||
      lowerMsg.includes("expired")
    ) {
      type = "error";
    }

    setToasts(prev => [...prev, { id, message: msg, type }]);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    // Elegant window.alert override to avoid browser blockages
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      addToast(msg);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Layout UI states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Live notifications feed from database
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async (currentToken?: string) => {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    try {
      const data = await api.get<Notification[]>("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch live notifications:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications(token);
      const interval = setInterval(() => {
        fetchNotifications(token);
      }, 8000); // Poll every 8 seconds for real-time responsiveness
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    // Theme preference hydration
    const theme = localStorage.getItem("acme_theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    // Hydrate authentication session via API verification
    const initAuth = async () => {
      const savedToken = localStorage.getItem("acme_token");
      if (savedToken) {
        try {
          api.setToken(savedToken);
          // Actual backend verification
          const validatedUser = await api.get<User>("/auth/me");
          setUser(validatedUser);
          setToken(savedToken);
          localStorage.setItem("acme_user", JSON.stringify(validatedUser));
          setCurrentScreen("app");
          // Immediately fetch notifications with the validated token
          api.get<Notification[]>("/notifications").then(data => {
            setNotifications(data);
          }).catch(console.error);
        } catch (err) {
          console.error("Failed to restore secure session:", err);
          setUser(null);
          setToken(null);
          api.clearToken();
        }
      }
      setLoadingSession(false);
    };

    initAuth();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("acme_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("acme_theme", "light");
    }
  };

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    localStorage.setItem("acme_user", JSON.stringify(loggedInUser));
    localStorage.setItem("acme_token", sessionToken);
    api.setToken(sessionToken); // Ensure token is updated in the API instance
    setCurrentScreen("app");
    setActiveView("dashboard");
    fetchNotifications(sessionToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("acme_user");
    localStorage.removeItem("acme_token");
    api.setToken("");
    setCurrentScreen("auth");
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.post("/notifications/clear", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const handleDemoLogin = () => {
    setCurrentScreen("auth");
  };

  const getViewTitle = () => {
    switch (activeView) {
      case "dashboard": return "Corporate Overview";
      case "employees": return "Employee Registers";
      case "leaves": return "Leave Calendars";
      case "attendance": return "Shift Log Auditing";
      case "assets": return "IT Hardware Ledger";
      case "departments": return "Corporate Subdivisions";
      case "reports": return "Compliance Reports";
      case "settings": return "System parameters";
      default: return "Enterprise Portal";
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${isDarkMode ? "bg-craft-cream-dark text-stone-100" : "bg-craft-cream text-craft-ink"}`}>
      
      {loadingSession ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 animate-pulse">Initializing Security Session...</p>
          </div>
        </div>
      ) : (
        <>


      {/* SCREEN 2: AUTHENTICATION CONTAINER */}
      {currentScreen === "auth" && (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => window.location.href = "/index.html"}
          isDarkMode={isDarkMode}
        />
      )}

      {/* SCREEN 3: LOGGED-IN HRMS PLATFORM WORKSPACE SHELL */}
      {currentScreen === "app" && user && (
        <div className="flex h-screen overflow-hidden">
          
          {/* DESKTOP SIDEBAR PANEL */}
          <aside className="hidden md:flex flex-col w-64 border-r border-white/10 flex-shrink-0 z-30 bg-[#0a0a0a] text-white">
            
            {/* Branding header */}
            <div className="p-6 border-b border-white/10 flex items-center bg-white/5">
              <span className="font-extrabold text-2xl tracking-tighter text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                WorkSphere
              </span>
            </div>

            {/* Logged in mini employee card */}
            <div className="p-4 mx-3 my-4 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3 text-xs shadow-inner">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover bg-black border border-white/20" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-extrabold border border-stone-700">
                  {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <p className="font-bold text-white leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-stone-400 mt-0.5 truncate">{user.jobTitle}</p>
                <div className="flex items-center space-x-1 mt-1 text-[9px] text-orange-400 font-extrabold uppercase">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{user.role}</span>
                </div>
              </div>
            </div>

            {/* Navigation links stack */}
            <nav className="flex-1 px-4 space-y-1 text-xs py-2 overflow-y-auto overflow-x-hidden">
              {[
                { id: "dashboard", label: "Dashboard Hub", icon: Activity },
                { id: "employees", label: "Employee Directory", icon: Users },
                { id: "leaves", label: "Leave Calendar", icon: Calendar },
                { id: "attendance", label: "Shift Logs", icon: Clock },
                { id: "assets", label: "IT Hardware Stock", icon: Layers },
                { id: "departments", label: "Departments", icon: Building },
                { id: "saas", label: "SaaS Operations Hub", icon: Cpu },
                ...(user.role === "admin" ? [
                  { id: "reports", label: "Compliance & Audits", icon: FileText }
                ] : []),
                { id: "settings", label: "Profile & Settings", icon: Settings }
              ].map(item => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative w-full p-3 rounded-lg flex items-center space-x-3 font-bold transition-all text-left overflow-hidden ${
                      active
                        ? "text-red-400 bg-red-500/10"
                        : "text-stone-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-red-400" : "text-stone-400"}`} />
                    <span className="relative z-10">{item.label}</span>
                    {active && (
                      <motion.div 
                        layoutId="desktopNavIndicator"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 rounded-t-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      />
                    )}
                  </motion.button>
                );
              })}
              
              <div className="pt-2 mt-2 border-t border-white/5">
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full p-3 rounded-lg flex items-center space-x-3 font-bold transition-all text-left overflow-hidden text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span className="relative z-10 text-[11px] uppercase tracking-wider">Log Out</span>
                </motion.button>
              </div>
            </nav>
          </aside>

          {/* MOBILE SIDEBAR OVERLAY SLIDE OUT */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Sidebar cabinet */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 180 }}
                  className="relative w-64 max-w-xs flex flex-col h-full z-10 p-5 bg-[#0a0a0a] text-white border-r border-white/10 shadow-2xl"
                >
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="flex items-center mb-6">
                    <span className="font-extrabold text-2xl tracking-tighter text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      WorkSphere
                    </span>
                  </div>

                  {/* Logged in employee */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3 text-xs mb-4 shadow-inner">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover bg-black border border-white/20" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-extrabold border border-white/20">
                        {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-white leading-tight">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-stone-400 truncate">{user.jobTitle}</p>
                    </div>
                  </div>

                  {/* Nav list */}
                  <nav className="flex-1 space-y-1 text-xs overflow-y-auto overflow-x-hidden pr-1 pb-4">
                    {[
                      { id: "dashboard", label: "Dashboard Hub", icon: Activity },
                      { id: "employees", label: "Employee Directory", icon: Users },
                      { id: "leaves", label: "Leave Calendar", icon: Calendar },
                      { id: "attendance", label: "Shift Logs", icon: Clock },
                      { id: "assets", label: "IT Hardware Stock", icon: Layers },
                      { id: "departments", label: "Departments", icon: Building },
                      { id: "saas", label: "SaaS Operations Hub", icon: Cpu },
                      ...(user.role === "admin" ? [
                        { id: "reports", label: "Compliance & Audits", icon: FileText }
                      ] : []),
                      { id: "settings", label: "Profile & Settings", icon: Settings }
                    ].map(item => {
                      const Icon = item.icon;
                      const active = activeView === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => { setActiveView(item.id); setMobileSidebarOpen(false); }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative w-full p-3 rounded-lg flex items-center space-x-3 font-bold transition-all text-left overflow-hidden ${
                            active
                              ? "text-red-400 bg-red-500/10"
                              : "text-stone-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${active ? "text-red-400" : "text-stone-400"}`} />
                          <span className="relative z-10">{item.label}</span>
                          {active && (
                            <motion.div 
                              layoutId="mobileNavIndicator"
                              className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 rounded-t-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                            />
                          )}
                        </motion.button>
                      );
                    })}

                    <div className="pt-2 mt-2 border-t border-white/5">
                      <motion.button
                        onClick={handleLogout}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative w-full p-3 rounded-lg flex items-center space-x-3 font-bold transition-all text-left overflow-hidden text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-4.5 w-4.5" />
                        <span className="relative z-10 text-[11px] uppercase tracking-wider">Log Out</span>
                      </motion.button>
                    </div>
                  </nav>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MAIN PLATFORM WORKSPACE FRAME */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
            
            {/* TOP HEADER STATUS PANEL */}
            <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 flex-shrink-0 relative transition-colors bg-white/5 backdrop-blur-md z-50">
              
              <div className="flex items-center space-x-3.5">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-1 md:hidden hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <h2 className="text-base font-extrabold tracking-tight hidden sm:block">
                  {getViewTitle()}
                </h2>
              </div>

              {/* Header Right Alerts widget & details */}
              <div className="flex items-center space-x-4">
                
                {/* Real-time Dynamic Date status */}
                <div className="hidden lg:flex items-center space-x-1.5 text-stone-400 font-bold uppercase text-[9px] tracking-widest border-r border-stone-200 dark:border-stone-800 pr-4">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  <span>UTC: {new Date().toISOString().split('T')[0]}</span>
                </div>

                {/* Simulated live notifications bell dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-stone-500 hover:text-orange-500 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl relative transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    {getUnreadNotificationsCount() > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-stone-900" />
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] p-4 space-y-3.5 text-xs bg-[#0a0a0a]/95 backdrop-blur-3xl text-white"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-800">
                            <span className="font-extrabold uppercase tracking-wide text-[9px] text-stone-400">Live Team Notifications</span>
                            <button
                              onClick={markAllNotificationsRead}
                              className="text-[10px] text-orange-500 hover:underline font-bold"
                            >
                              Mark all read
                            </button>
                          </div>

                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="py-6 text-center text-stone-400 font-semibold text-[11px]">
                                No new notifications. You are all caught up!
                              </div>
                            ) : (
                              notifications.map(notif => (
                                <div
                                  key={notif.id}
                                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                                  className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition-colors cursor-pointer ${
                                    notif.read
                                      ? "bg-transparent border-transparent opacity-60 hover:opacity-100"
                                      : "bg-white/5 border-white/10 hover:bg-white/10"
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                                    notif.read
                                      ? "bg-white/5 text-white/40"
                                      : "bg-orange-500/20 text-orange-400"
                                  }`}>
                                    <Bell className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <p className="font-bold text-white flex justify-between items-center gap-1.5">
                                      <span className="truncate">{notif.title}</span>
                                      <span className="text-[8px] text-white/40 font-medium flex-shrink-0">
                                        {notif.date ? new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                      </span>
                                    </p>
                                    <p className="text-[10px] text-white/70 leading-tight break-all">
                                      {notif.content || (notif as any).desc}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile short quick-link */}
                <div className="flex items-center space-x-2 border-l border-stone-200 dark:border-stone-800 pl-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-stone-200 dark:border-stone-900" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-extrabold border border-stone-200 dark:border-stone-900">
                      {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-extrabold text-[11px] uppercase tracking-wider text-stone-500">{user.firstName}</span>
                </div>

              </div>

            </header>

            {/* MAIN ROUTER CONTENT VIEW CANVAS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeView === "dashboard" && <DashboardView user={user} onNavigate={setActiveView} isDarkMode={isDarkMode} />}
                  {activeView === "employees" && <EmployeeView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "leaves" && <LeaveView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "attendance" && <AttendanceView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "assets" && <AssetView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "departments" && <DepartmentView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "reports" && <ReportsView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "saas" && <EnterpriseSaaSView currentUser={user} isDarkMode={isDarkMode} />}
                  {activeView === "settings" && (
                    <SettingsView 
                      currentUser={user} 
                      isDarkMode={isDarkMode} 
                      onUpdateUser={(updated) => {
                        setUser(updated);
                        localStorage.setItem("acme_user", JSON.stringify(updated));
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </main>

          {/* AI HR Copilot Floating Assistant */}
          <HRCopilot user={user} isDarkMode={isDarkMode} />

        </div>
      )}
        </>
      )}

      {/* GLOBAL FLOATING TOASTS NOTIFICATIONS */}
      <div className="fixed top-5 right-5 z-[10000] space-y-3 max-w-sm w-full pointer-events-none" id="global-toasts-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-2xl border shadow-xl flex items-start space-x-3 pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100"
                  : toast.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-100"
                  : isDarkMode
                  ? "bg-stone-900 border-stone-800 text-stone-100 shadow-black/30"
                  : "bg-white border-stone-200 text-stone-950 shadow-stone-200/50"
              }`}
            >
              {/* Toast Icon */}
              <div className={`mt-0.5 p-1 rounded-lg flex-shrink-0 ${
                toast.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300"
                  : toast.type === "error"
                  ? "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300"
                  : "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
              }`}>
                {toast.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>

              {/* Message text */}
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>

              {/* Close button */}
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-stone-400 hover:text-stone-500 dark:hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
