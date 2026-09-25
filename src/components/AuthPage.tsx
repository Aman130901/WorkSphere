import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Mail, User, ArrowLeft, Loader2, Check, AlertCircle, Building, Users, ShieldCheck, BarChart3, Clock, Zap } from "lucide-react";
import { api } from "../utils/api";
import { User as UserType } from "../types";

interface AuthPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
  onBackToLanding: () => void;
  isDarkMode: boolean;
}

function FloatingCard({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.div
      className={`absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: [0, -12, 0], rotateX: [0, 3, 0], rotateY: [-2, 2, -2] }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 5, delay, repeat: Infinity, ease: "easeInOut" },
        rotateX: { duration: 7, delay, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 9, delay: delay + 1, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

function Orb({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function AuthPage({ onLoginSuccess, onBackToLanding }: AuthPageProps) {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const data = await api.post<{ token: string; user: UserType }>("/auth/login", { email, password });
      api.setToken(data.token); onLoginSuccess(data.user, data.token);
    } catch (err: any) { setError(err.message || "Invalid credentials."); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api.post("/auth/register", { email, password, firstName, lastName, role, jobTitle: jobTitle || (role === "admin" ? "VP Operations" : role === "manager" ? "Team Manager" : "Software Associate") });
      setSuccess("Account registered! You can now log in."); setView("login"); setPassword("");
    } catch (err: any) { setError(err.message || "Registration failed."); } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const response = await api.post<{ message: string }>("/auth/reset-password", { email });
      setSuccess(response.message); setView("login");
    } catch (err: any) { setError(err.message || "Unable to reset password."); } finally { setLoading(false); }
  };

  const inputClass = "w-full pl-10 pr-4 py-3.5 text-sm rounded-xl border border-stone-200 bg-white/80 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#ea503f]/30 focus:border-[#ea503f] transition-all duration-200 shadow-sm";
  const labelClass = "block text-xs font-bold mb-1.5 uppercase tracking-wider text-stone-500";

  return (
    <div className="min-h-screen flex overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* BACK BUTTON */}
      <button 
        onClick={onBackToLanding}
        className="absolute top-6 left-6 z-50 flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 lg:text-white text-stone-800 lg:border-white/20 lg:bg-white/10 lg:hover:bg-white/20 bg-stone-100 hover:bg-stone-200 border-stone-200 lg:mix-blend-normal"
        title="Back to Landing Page"
      >
        <ArrowLeft className="h-5 w-5 lg:text-white text-stone-600" />
      </button>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a00 0%, #3d0f00 40%, #ea503f 100%)" }}>
        <Orb className="w-96 h-96 bg-[#ea503f] top-[-10%] left-[-10%]" delay={0} />
        <Orb className="w-64 h-64 bg-orange-400 bottom-[10%] right-[-5%]" delay={2} />
        <Orb className="w-48 h-48 bg-red-700 top-[40%] left-[30%]" delay={4} />

        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <motion.div
          className="absolute inset-0"
          animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          <FloatingCard delay={0} className="top-[18%] left-[10%] w-52">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Users className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-white/60 text-xs">Total Employees</p>
                <p className="text-white font-bold text-xl">1,284</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ delay: 0.8, duration: 1 }} />
            </div>
          </FloatingCard>

          <FloatingCard delay={0.4} className="top-[38%] right-[8%] w-48">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/20 rounded-xl"><BarChart3 className="h-4 w-4 text-white" /></div>
              <p className="text-white/70 text-xs font-semibold">Asset Recovery</p>
            </div>
            <p className="text-white font-bold text-2xl">99.8%</p>
            <p className="text-white/50 text-xs mt-1">↑ 2.3% this quarter</p>
          </FloatingCard>

          <FloatingCard delay={0.8} className="top-[46%] left-[10%] w-56">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl"><Clock className="h-4 w-4 text-white" /></div>
              <p className="text-white/70 text-xs font-semibold">Leave Approvals</p>
            </div>
            <div className="flex gap-1 items-end h-10">
              {[60, 80, 45, 90, 70].map((h, i) => (
                <motion.div key={i} className="flex-1 bg-white/40 rounded-sm"
                  initial={{ height: 0 }} animate={{ height: `${h}%` }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.6 }} />
              ))}
            </div>
          </FloatingCard>

          <FloatingCard delay={1.2} className="top-[12%] right-[10%] w-44">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-400/30 rounded-xl"><ShieldCheck className="h-4 w-4 text-emerald-300" /></div>
              <div>
                <p className="text-white/60 text-xs">Compliance</p>
                <p className="text-emerald-300 font-bold">Active ✓</p>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        <div className="absolute bottom-12 left-10 right-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-extrabold text-2xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>WorkSphere</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Enterprise HRMS for managing people, assets, leaves, and compliance — all in one place.
            </p>
            <div className="flex gap-5 mt-5">
              {[{ icon: Zap, label: "Fast" }, { icon: ShieldCheck, label: "Secure" }, { icon: BarChart3, label: "Insights" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-white/70 text-xs">
                  <Icon className="h-3.5 w-3.5" /><span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf9f7] px-6 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-red-50/30 pointer-events-none" />
        <motion.div className="w-full max-w-md relative z-10" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <span className="font-extrabold text-2xl text-stone-900" style={{ fontFamily: "'Outfit', sans-serif" }}>WorkSphere</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {view === "login" && "Welcome back 👋"}
                  {view === "register" && "Create account ✨"}
                  {view === "forgot" && "Reset password 🔑"}
                </h1>
                <p className="text-stone-500 text-sm">
                  {view === "login" && "Sign in to your WorkSphere enterprise account."}
                  {view === "register" && "Join your team on the WorkSphere platform."}
                  {view === "forgot" && "Enter your email to receive reset instructions."}
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" /><span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {view === "login" && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className={labelClass} style={{ marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={() => { setView("forgot"); setError(null); setSuccess(null); }} className="text-xs font-semibold text-[#ea503f] hover:underline">Forgot?</button>
                    </div>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #ea503f 0%, #c0392b 100%)", boxShadow: "0 8px 25px rgba(234,80,63,0.4)" }}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing in...</span></> : <span>Sign In →</span>}
                  </motion.button>
                  <p className="text-center text-sm text-stone-500 pt-2">Don't have an account?{" "}
                    <button type="button" onClick={() => { setView("register"); setError(null); setSuccess(null); }} className="font-bold text-[#ea503f] hover:underline">Create one</button>
                  </p>
                </form>
              )}

              {view === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>First Name</label>
                      <div className="relative"><User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alex" className={inputClass} /></div>
                    </div>
                    <div><label className={labelClass}>Last Name</label>
                      <div className="relative"><User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Chen" className={inputClass} /></div>
                    </div>
                  </div>
                  <div><label className={labelClass}>Email</label>
                    <div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@company.com" className={inputClass} /></div>
                  </div>
                  <div><label className={labelClass}>Password</label>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className={inputClass} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Role</label>
                      <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3.5 text-sm rounded-xl border border-stone-200 bg-white/80 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#ea503f]/30 focus:border-[#ea503f] transition-all">
                        <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Administrator</option>
                      </select></div>
                    <div><label className={labelClass}>Job Title</label>
                      <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Engineer" className="w-full px-4 py-3.5 text-sm rounded-xl border border-stone-200 bg-white/80 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#ea503f]/30 focus:border-[#ea503f] transition-all" /></div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #ea503f 0%, #c0392b 100%)", boxShadow: "0 8px 25px rgba(234,80,63,0.4)" }}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Creating...</span></> : <span>Create Account →</span>}
                  </motion.button>
                  <p className="text-center text-sm text-stone-500 pt-2">Already have an account?{" "}
                    <button type="button" onClick={() => { setView("login"); setError(null); setSuccess(null); }} className="font-bold text-[#ea503f] hover:underline">Sign in</button>
                  </p>
                </form>
              )}

              {view === "forgot" && (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div><label className={labelClass}>Registered Email</label>
                    <div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} /></div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #ea503f 0%, #c0392b 100%)", boxShadow: "0 8px 25px rgba(234,80,63,0.4)" }}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}<span>Send Reset Link →</span>
                  </motion.button>
                  <button type="button" onClick={() => { setView("login"); setError(null); setSuccess(null); }}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-stone-500 hover:text-[#ea503f] transition-colors">
                    <ArrowLeft className="h-4 w-4" />Back to Sign In
                  </button>
                </form>
              )}

            </motion.div>
          </AnimatePresence>

          <p className="mt-10 text-center text-xs text-stone-400">© 2026 WorkSphere, Inc. · Enterprise Grade HRMS Platform</p>
        </motion.div>
      </div>
    </div>
  );
}
