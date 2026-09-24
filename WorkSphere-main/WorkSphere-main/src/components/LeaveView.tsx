import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Plus,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  X
} from "lucide-react";
import { api } from "../utils/api";
import { Leave, User as UserType, LeaveType, LeaveStatus } from "../types";

interface LeaveViewProps {
  currentUser: UserType;
  isDarkMode: boolean;
}

export default function LeaveView({ currentUser, isDarkMode }: LeaveViewProps) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leave balance tracking
  const [balances, setBalances] = useState<Record<LeaveType, { allocated: number; used: number }>>({
    Annual: { allocated: 20, used: 5 },
    Sick: { allocated: 10, used: 1 },
    Casual: { allocated: 7, used: 0 },
    Maternity: { allocated: 90, used: 0 },
    Paternity: { allocated: 14, used: 0 },
    Unpaid: { allocated: 30, used: 0 }
  });

  // Application Form States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formFields, setFormFields] = useState({
    leaveType: "Annual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
    documentUrl: ""
  });

  // Review states (Admin/Manager reviewing)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Calendar view states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Leave[]>("/leaves");
      setLeaves(data);
      
      // Calculate active used balances from fetched approved leaves for current user
      const userApprovedLeaves = data.filter(l => l.userId === currentUser.id && l.status === "Approved");
      const updatedBalances = { ...balances };
      
      // Reset used balances to zero first, then compile
      Object.keys(updatedBalances).forEach((key) => {
        updatedBalances[key as LeaveType].used = 0;
      });

      userApprovedLeaves.forEach(l => {
        if (updatedBalances[l.leaveType]) {
          updatedBalances[l.leaveType].used += l.duration;
        }
      });

      setBalances(updatedBalances);
    } catch (err: any) {
      setError(err.message || "Failed to load leave records.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Date validation
    const start = new Date(formFields.startDate);
    const end = new Date(formFields.endDate);
    if (start.getTime() > end.getTime()) {
      setFormError("The Start Date cannot be after the End Date.");
      return;
    }

    // Calculate duration in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    // Check balance limit
    const balance = balances[formFields.leaveType];
    const remaining = balance.allocated - balance.used;
    if (duration > remaining && formFields.leaveType !== "Unpaid") {
      setFormError(`Insufficient leave balance! You requested ${duration} days, but only have ${remaining} days remaining of ${formFields.leaveType} leave.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/leaves", {
        ...formFields,
        duration,
      });
      setFormSuccess("Leave request submitted successfully. Awaiting manager review!");
      setTimeout(() => {
        setShowApplyModal(false);
        setFormSuccess(null);
        setFormFields({
          leaveType: "Annual",
          startDate: "",
          endDate: "",
          reason: "",
          documentUrl: ""
        });
        fetchLeaves();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: "Approved" | "Rejected" | "MoreInfo") => {
    try {
      setReviewingId(id);
      const notes = reviewNotes[id] || "";
      await api.post(`/leaves/${id}/review`, { status, managerNotes: notes });
      
      // Clear notes input
      setReviewNotes(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      fetchLeaves();
    } catch (err: any) {
      alert(err.message || "Review action failed.");
    } finally {
      setReviewingId(null);
    }
  };

  // Build high-contrast calendar highlight grid
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + offset, 1));
  };

  // Highlight helper for approved leaves
  const getLeaveHighlight = (day: number) => {
    const calendarYear = currentCalendarDate.getFullYear();
    const calendarMonth = currentCalendarDate.getMonth();
    const cellDate = new Date(calendarYear, calendarMonth, day);
    
    // Check if cellDate is within any approved leave duration
    const match = leaves.find(l => {
      if (l.status !== "Approved") return false;
      const start = new Date(l.startDate + "T00:00:00");
      const end = new Date(l.endDate + "T23:59:59");
      return cellDate.getTime() >= start.getTime() && cellDate.getTime() <= end.getTime();
    });

    if (match) {
      return {
        isLeave: true,
        type: match.leaveType,
        user: match.employeeName || currentUser.firstName,
      };
    }
    return null;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = getDaysInMonth(currentCalendarDate);
  const firstDayIndex = getFirstDayOfMonth(currentCalendarDate);

  const pendingCount = leaves.filter(l => l.status === "Pending").length;

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leave Management & Calendars</h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">Check leave balances, request calendar absences, or review direct report applications.</p>
        </div>
        <button
          onClick={() => { setFormError(null); setFormSuccess(null); setShowApplyModal(true); }}
          className="p-3 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/10 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 self-stretch sm:self-auto justify-center"
          id="request-leave-trigger"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* THREE ACTIVE BALANCE BLOCKS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(balances).map(([type, bal]) => {
          const { allocated, used } = bal as any;
          return (
            <div key={type} className="p-4 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-center">
              <span className="block text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-1">{type} Leave</span>
              <span className="text-xl sm:text-2xl font-extrabold block">{(allocated - used)} / {allocated}</span>
              <span className="text-[10px] text-stone-500 mt-1 block font-semibold">Days Remaining</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE FILINGS TABLE & MANAGER ACTION CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-between items-center">
              <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-stone-500">Leave Applications Register</span>
              {currentUser.role !== "employee" && pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-600 dark:bg-amber-950 text-[10px] font-bold rounded-full animate-pulse">
                  {pendingCount} Needs Review
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">Loading leaves log...</p>
              </div>
            ) : leaves.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-900">
                {leaves.map(lv => (
                  <div key={lv.id} className="p-4 sm:p-5 text-xs space-y-3.5">
                    
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="bg-stone-100 dark:bg-stone-900 p-2 rounded-lg text-stone-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100">{lv.employeeName || "Alex Rodriguez"}</p>
                          <p className="text-[10px] text-stone-400">{lv.employeeTitle || "Team Member"} | Date: {new Date(lv.dateSubmitted).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <span className="p-1 px-2.5 bg-stone-100 dark:bg-stone-900 font-bold rounded text-[10px] tracking-wide uppercase">{lv.leaveType}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          lv.status === "Approved"
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : lv.status === "Rejected"
                            ? "text-red-600 bg-red-50 dark:bg-red-950/40"
                            : "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                        }`}>
                          {lv.status}
                        </span>
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="pl-0 sm:pl-11 space-y-2">
                      <p className="font-semibold text-stone-700 dark:text-stone-300">
                        Requested: <span className="font-extrabold text-orange-600">{lv.startDate} to {lv.endDate}</span> ({lv.duration} days absence)
                      </p>
                      <p className="text-stone-500 bg-stone-50 dark:bg-stone-950 p-3 rounded-lg leading-relaxed">{lv.reason}</p>
                      
                      {/* Document Attachment Simulation */}
                      {lv.documentUrl && (
                        <div className="inline-flex items-center space-x-1.5 p-1 px-2.5 rounded bg-orange-50/50 dark:bg-orange-950/20 text-orange-500 text-[10px] font-bold border border-orange-500/10">
                          <FileText className="h-3.5 w-3.5" />
                          <span>DoctorNote-Compliance.pdf</span>
                        </div>
                      )}

                      {/* Manager response feedback */}
                      {lv.managerNotes && (
                        <div className="p-3 bg-stone-100/60 dark:bg-stone-900 rounded-lg border-l-2 border-l-stone-400 text-[11px]">
                          <span className="font-extrabold text-stone-500 uppercase tracking-wide block text-[9px] mb-0.5">Manager Response:</span>
                          <p className="italic text-stone-500 dark:text-stone-300">"{lv.managerNotes}"</p>
                        </div>
                      )}

                      {/* Active review actions (Visible for Admins/Managers if status is Pending or MoreInfo) */}
                      {currentUser.role !== "employee" && (lv.status === "Pending" || lv.status === "MoreInfo") && (
                        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                          <label className="block text-[10px] text-stone-400 font-bold uppercase tracking-wide">Leave Assessment & Approval Notes</label>
                          <input
                            value={reviewNotes[lv.id] || ""}
                            onChange={e => setReviewNotes({ ...reviewNotes, [lv.id]: e.target.value })}
                            placeholder="Add approval coordinates or rejection reasoning..."
                            className="w-full p-2.5 text-xs rounded-lg border dark:bg-stone-950 dark:border-stone-800 focus:outline-none"
                          />
                          <div className="flex space-x-2">
                            <button
                              disabled={reviewingId === lv.id}
                              onClick={() => handleReview(lv.id, "Approved")}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wide flex items-center justify-center space-x-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve Request</span>
                            </button>
                            <button
                              disabled={reviewingId === lv.id}
                              onClick={() => handleReview(lv.id, "Rejected")}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wide flex items-center justify-center space-x-1"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject Request</span>
                            </button>
                            <button
                              disabled={reviewingId === lv.id}
                              onClick={() => handleReview(lv.id, "MoreInfo")}
                              className="py-2 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-500 rounded-lg font-bold text-[11px]"
                            >
                              More Info
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400">No leave applications filed on records.</div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVEapproved ABSENCE CALENDAR */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-400 flex items-center">
                <Calendar className="h-4.5 w-4.5 text-orange-500 mr-1.5" />
                <span>Absence Calendar</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs font-bold w-24 text-center">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-stone-400 uppercase mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}
            </div>

            {/* Calendar Grid Days */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {/* Empty offset days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => <span key={`empty-${i}`} className="p-2" />)}
              
              {/* Real Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const absenceInfo = getLeaveHighlight(day);
                return (
                  <div
                    key={`day-${day}`}
                    className={`p-1.5 py-2.5 rounded-lg border border-transparent font-semibold relative group ${
                      absenceInfo
                        ? "bg-orange-600 text-white shadow shadow-orange-500/10"
                        : isDarkMode
                        ? "bg-stone-950 hover:bg-stone-900"
                        : "bg-stone-50 hover:bg-stone-100"
                    }`}
                  >
                    <span>{day}</span>
                    {absenceInfo && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}

                    {/* Simple hover tooltip for absence info */}
                    {absenceInfo && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-stone-950 text-white text-[9px] p-2.5 rounded shadow-xl hidden group-hover:block z-20 w-32 font-bold leading-normal">
                        <span className="block text-orange-400 uppercase tracking-wide text-[8px]">{absenceInfo.type} Leave</span>
                        <span className="block truncate mt-0.5">{absenceInfo.user}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-[10px] leading-relaxed text-white/70 flex items-start space-x-2 backdrop-blur-sm">
              <Info className="h-4.5 w-4.5 text-orange-500 flex-shrink-0" />
              <span>Approved absences (leaves) automatically highlight in solid indigo grids. Hover over highlighted dates to view employee names.</span>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL: SUBMIT LEAVE APPLICATION */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-50 bg-[#0a0a0a]/90 backdrop-blur-3xl text-white border-white/20"
          >
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <X className="h-5 w-5 drop-shadow" />
            </button>

            <h3 className="text-xl font-extrabold mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>File Leave Calendar Absence</h3>
            <p className="text-[11px] text-white/50 mb-6 font-medium">File your required absence. Leave credits automatically decrement on approval.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleApplySubmit} className="space-y-5 text-xs font-semibold">
              <div>
                <label className="block text-white/60 mb-1.5 font-bold text-[10px] uppercase tracking-wider">Select Leave Type *</label>
                <select
                  value={formFields.leaveType}
                  onChange={e => setFormFields({ ...formFields, leaveType: e.target.value as LeaveType })}
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white text-sm outline-none transition-all hover:border-white/20 focus:border-red-500 shadow-inner cursor-pointer appearance-none"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 mb-1.5 font-bold text-[10px] uppercase tracking-wider">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={formFields.startDate}
                    onChange={e => setFormFields({ ...formFields, startDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white text-sm outline-none transition-all hover:border-white/20 focus:border-red-500 shadow-inner"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1.5 font-bold text-[10px] uppercase tracking-wider">End Date *</label>
                  <input
                    required
                    type="date"
                    value={formFields.endDate}
                    onChange={e => setFormFields({ ...formFields, endDate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white text-sm outline-none transition-all hover:border-white/20 focus:border-red-500 shadow-inner"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1.5 font-bold text-[10px] uppercase tracking-wider">Supporting Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={formFields.reason}
                  onChange={e => setFormFields({ ...formFields, reason: e.target.value })}
                  placeholder="Explain your calendar absence reason..."
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white text-sm outline-none transition-all hover:border-white/20 focus:border-red-500 shadow-inner placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1.5 font-bold text-[10px] uppercase tracking-wider">Attach doctors note / certificate</label>
                <div className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all shadow-inner group">
                  <Upload className="h-6 w-6 text-white/40 mx-auto mb-2 group-hover:-translate-y-1 transition-transform group-hover:text-red-400 drop-shadow" />
                  <span className="text-[11px] text-white/50 block font-bold mb-2">Select PDF, JPG, or PNG (Max 5MB)</span>
                  <input
                    type="file"
                    className="hidden"
                    id="simulated-upload"
                    onChange={() => setFormFields({ ...formFields, documentUrl: "attached-slip.pdf" })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("simulated-upload")?.click();
                      setFormFields({ ...formFields, documentUrl: "attached-slip.pdf" });
                    }}
                    className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest block mx-auto hover:text-white transition-colors"
                  >
                    {formFields.documentUrl ? "Attached: Doctors_Note_Sim.pdf" : "Simulate File Upload"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-4 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white rounded-xl font-extrabold uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50 text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 border border-white/10"
                id="apply-leave-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin drop-shadow" /> : null}
                <span className="drop-shadow">File Application Registry</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
