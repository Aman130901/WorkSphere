import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Shield,
  Building,
  Clock,
  Save,
  Database,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  Loader2,
  User as UserIcon,
  Phone,
  MapPin,
  Contact,
  Key,
  Bell,
  Trash2,
  Plus,
  Briefcase,
  SlidersHorizontal,
  PlusCircle,
  Check,
  X,
  ShieldCheck,
  Award,
  Calendar,
  Camera,
  Upload,
  Laptop
} from "lucide-react";
import { api } from "../utils/api";
import { User } from "../types";

interface SettingsViewProps {
  currentUser: User;
  isDarkMode: boolean;
  onUpdateUser?: (updated: User) => void;
}

export default function SettingsView({ currentUser, isDarkMode, onUpdateUser }: SettingsViewProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // ==========================================
  // 1. ADMIN GOVERNANCE STATE
  // ==========================================
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [coreHours, setCoreHours] = useState(8);
  const [officeLocation, setOfficeLocation] = useState("San Francisco HQ (Building 3)");
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [backupLoading, setBackupLoading] = useState(false);

  // Security variables
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [forcedPasswordRotation, setForcedPasswordRotation] = useState(90);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [loginAttemptLimit, setLoginAttemptLimit] = useState(5);
  const [backups, setBackups] = useState<any[]>([]);

  // Navigation sub-tab inside Admin Mode
  const [adminActiveTab, setAdminActiveTab] = useState<"attendance" | "location" | "security" | "backups">("attendance");

  // ==========================================
  // 2. EMPLOYEE SELF-SERVICE STATE
  // ==========================================
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [address, setAddress] = useState(currentUser.address || "");
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact || "");
  
  // Skills and projects lists
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [projects, setProjects] = useState<string[]>(currentUser.projects || []);
  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState("");

  // Security toggles
  const [twoFactor, setTwoFactor] = useState(currentUser.twoFactorEnabled || false);
  const [notifPrefs, setNotifPrefs] = useState(currentUser.notificationPrefs || {
    leaveStatus: true,
    assetUpdates: true,
    announcements: true
  });

  // Self-Service tabs
  const [essTab, setEssTab] = useState<"dossier" | "resume" | "security" | "hardware">("dossier");

  // ==========================================
  // 3. HARDWARE ASSET STATE
  // ==========================================
  const [assignedAssets, setAssignedAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Maintenance ticket state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedAssetForTicket, setSelectedAssetForTicket] = useState<any | null>(null);
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSeverity, setTicketSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [ticketNotes, setTicketNotes] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const fetchAssignedAssets = async () => {
    setLoadingAssets(true);
    try {
      const data = await api.get<any[]>("/assets");
      const filtered = data.filter(a => a.assignedToUserId === currentUser.id);
      setAssignedAssets(filtered);
    } catch (err: any) {
      console.error("Failed to fetch assigned assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleReportDamage = (asset: any) => {
    setSelectedAssetForTicket(asset);
    setTicketDescription("");
    setTicketSeverity("Medium");
    setTicketNotes("");
    setTicketError(null);
    setIsTicketModalOpen(true);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) {
      setTicketError("Issue description is required.");
      return;
    }
    if (!selectedAssetForTicket) return;

    setIsSubmittingTicket(true);
    setTicketError(null);

    try {
      const fullDescription = ticketNotes.trim()
        ? `${ticketDescription.trim()}\n\nAdditional Notes: ${ticketNotes.trim()}`
        : ticketDescription.trim();

      await api.post("/maintenance-tickets", {
        assetId: selectedAssetForTicket.id,
        assetName: selectedAssetForTicket.name,
        severity: ticketSeverity,
        description: fullDescription
      });

      setSuccess(`Damage report submitted successfully. Related asset ${selectedAssetForTicket.name} status updated.`);
      setIsTicketModalOpen(false);
      fetchAssignedAssets();
    } catch (err: any) {
      setTicketError(err.error || err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // ==========================================
  // AVATAR / PROFILE PICTURE STATE (all roles)
  // ==========================================
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit Mode state variables
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(currentUser.firstName || "");
  const [editLastName, setEditLastName] = useState(currentUser.lastName || "");
  const [editDob, setEditDob] = useState(currentUser.dateOfBirth || "");
  const [editPhone, setEditPhone] = useState(currentUser.phone || "");
  const [editAddress, setEditAddress] = useState(currentUser.address || "");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const startEditing = () => {
    setEditFirstName(currentUser.firstName || "");
    setEditLastName(currentUser.lastName || "");
    setEditDob(currentUser.dateOfBirth || "");
    setEditPhone(currentUser.phone || "");
    setEditAddress(currentUser.address || "");
    setProfileErrors({});
    setIsEditingProfile(true);
  };

  const cancelEditing = () => {
    setIsEditingProfile(false);
    setProfileErrors({});
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    if (!editFirstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!editLastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (editDob) {
      const dobDate = new Date(editDob);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.dateOfBirth = "Invalid date of birth";
      } else if (dobDate > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfileData = async () => {
    if (!validateProfile()) return;
    setSuccess(null);
    setSubmitting(true);
    try {
      const updatedUser = await api.put<User>(`/employees/${currentUser.id}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        dateOfBirth: editDob,
        phone: editPhone.trim(),
        address: editAddress.trim()
      });
      if (onUpdateUser) onUpdateUser(updatedUser);
      setIsEditingProfile(false);
      setSuccess("Your personal profile details have been updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert("Profile Save Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Load backend configuration parameters if Admin
  useEffect(() => {
    if (currentUser.role === "admin") {
      api.get<any>("/settings")
        .then(data => {
          if (data) {
            setGraceMinutes(data.gracePeriodMinutes ?? 15);
            setCoreHours(data.baseWorkHours ?? 8);
            setOfficeLocation(data.officeLocation ?? "San Francisco HQ (Building 3)");
            setSelectedDays(data.dutyDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]);
            setSessionTimeout(data.sessionTimeoutMinutes ?? 60);
            setPasswordMinLength(data.passwordMinLength ?? 8);
            setForcedPasswordRotation(data.forcedPasswordRotationDays ?? 90);
            setTwoFactorRequired(data.twoFactorRequired ?? false);
            setLoginAttemptLimit(data.loginAttemptLimit ?? 5);
            setBackups(data.backups ?? []);
          }
        })
        .catch(err => console.warn("Failed to retrieve live parameters:", err));
    }
  }, [currentUser]);

  // Sync profile details if currentUser prop changes
  useEffect(() => {
    setPhone(currentUser.phone || "");
    setAddress(currentUser.address || "");
    setEmergencyContact(currentUser.emergencyContact || "");
    setSkills(currentUser.skills || []);
    setProjects(currentUser.projects || []);
    setTwoFactor(currentUser.twoFactorEnabled || false);
    setNotifPrefs(currentUser.notificationPrefs || {
      leaveStatus: true,
      assetUpdates: true,
      announcements: true
    });
  }, [currentUser]);

  // Load assigned hardware assets
  useEffect(() => {
    fetchAssignedAssets();
  }, [currentUser]);

  useEffect(() => {
    if (essTab === "hardware") {
      fetchAssignedAssets();
    }
  }, [essTab]);

  // ==========================================
  // 3. ADMIN ACTIONS
  // ==========================================
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setSubmitting(true);
    try {
      // Send updates to server
      const updated = await api.put<any>("/settings", {
        gracePeriodMinutes: graceMinutes,
        baseWorkHours: coreHours,
        officeLocation,
        dutyDays: selectedDays,
        sessionTimeoutMinutes: sessionTimeout,
        passwordMinLength,
        forcedPasswordRotationDays: forcedPasswordRotation,
        twoFactorRequired,
        loginAttemptLimit
      });
      if (updated) {
        setGraceMinutes(updated.gracePeriodMinutes ?? graceMinutes);
        setCoreHours(updated.baseWorkHours ?? coreHours);
        setOfficeLocation(updated.officeLocation ?? officeLocation);
        setSelectedDays(updated.dutyDays ?? selectedDays);
        setSessionTimeout(updated.sessionTimeoutMinutes ?? sessionTimeout);
        setPasswordMinLength(updated.passwordMinLength ?? passwordMinLength);
        setForcedPasswordRotation(updated.forcedPasswordRotationDays ?? forcedPasswordRotation);
        setTwoFactorRequired(updated.twoFactorRequired ?? twoFactorRequired);
        setLoginAttemptLimit(updated.loginAttemptLimit ?? loginAttemptLimit);
      }
      setSuccess("Corporate policy values updated and propagated company-wide!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to save policies:", err);
      alert("Policy Save Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const newBackup = await api.post<any>("/settings/backup", {});
      setBackups(prev => [newBackup, ...prev]);
      setSuccess("New database snapshot successfully created and stored!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to create snapshot backup:", err);
      alert("Backup snapshot creation failed: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // ==========================================
  // 4. EMPLOYEE SELF-SERVICE ACTIONS
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setSubmitting(true);
    try {
      const updatedUser = await api.put<User>(`/employees/${currentUser.id}`, {
        phone,
        address,
        emergencyContact,
        skills,
        projects
      });
      if (onUpdateUser) onUpdateUser(updatedUser);
      setSuccess("Your professional profile has been securely saved!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert("Profile Save Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // AVATAR / PROFILE PICTURE ACTIONS (all roles)
  // ==========================================

  // Resize + compress the picked image client-side before it's stored,
  // so the profile picture stays a small, consistent square photo.
  const resizeImageToDataUrl = (file: File, maxDimension = 320): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = maxDimension;
          canvas.height = maxDimension;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Image processing isn't supported in this browser."));
            return;
          }
          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDimension, maxDimension);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarPick = () => {
    setAvatarError(null);
    fileInputRef.current?.click();
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarError(null);

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (JPG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("That image is larger than 5MB. Please choose a smaller file.");
      return;
    }

    setAvatarSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const updatedUser = await api.put<User>(`/employees/${currentUser.id}`, {
        avatarUrl: dataUrl
      });
      if (onUpdateUser) onUpdateUser(updatedUser);
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile picture:", err);
      setAvatarError(err.message || "Failed to update profile picture.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError(null);
    setAvatarSaving(true);
    try {
      const updatedUser = await api.put<User>(`/employees/${currentUser.id}`, {
        avatarUrl: ""
      });
      if (onUpdateUser) onUpdateUser(updatedUser);
      setSuccess("Profile picture removed.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to remove profile picture:", err);
      setAvatarError(err.message || "Failed to remove profile picture.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleToggleMFA = async () => {
    try {
      const res = await api.post<{ enabled: boolean }>("/auth/2fa/toggle", {});
      setTwoFactor(res.enabled);
      if (onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          twoFactorEnabled: res.enabled
        });
      }
      setSuccess(`Simulated Multi-Factor Authentication (MFA) ${res.enabled ? "enabled" : "disabled"} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to toggle MFA:", err);
      alert("MFA Toggle Error: " + err.message);
    }
  };

  const handleToggleNotificationPref = async (key: keyof typeof notifPrefs) => {
    const updatedPrefs = {
      ...notifPrefs,
      [key]: !notifPrefs[key]
    };
    try {
      await api.put("/auth/notifications/prefs", updatedPrefs);
      setNotifPrefs(updatedPrefs);
      if (onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          notificationPrefs: updatedPrefs
        });
      }
      setSuccess("Alert routing configurations saved.");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Failed to update notification prefs:", err);
    }
  };

  // Manage Skills & Projects chips
  const addSkillChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkillChip = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addProjectChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      setProjects([...projects, newProject.trim()]);
      setNewProject("");
    }
  };

  const removeProjectChip = (projectToRemove: string) => {
    setProjects(projects.filter(p => p !== projectToRemove));
  };

  // ==========================================
  // 5. RENDERING PORTALS
  // ==========================================
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* HEADER BAR */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {currentUser.role === "admin" ? "Corporate Policies & Parameters" : "Employee Profile Self-Service"}
        </h1>
        <p className="text-xs text-stone-500 font-semibold mt-1">
          {currentUser.role === "admin" 
            ? "Configure company-wide grace periods, standard office locations, duty days, and backups."
            : "Update your contact coordinates, manage career tags, review contract parameters, and configure security alerts."}
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* PROFILE PICTURE CARD (Admin, Manager, Employee) */}
      {/* ========================================== */}
      <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative shrink-0">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover border border-stone-200 dark:border-stone-800"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 flex items-center justify-center text-xl font-extrabold border border-stone-200 dark:border-stone-800">
              {(currentUser.firstName?.[0] || "").toUpperCase()}{(currentUser.lastName?.[0] || "").toUpperCase()}
            </div>
          )}
          <button
            onClick={handleAvatarPick}
            disabled={avatarSaving}
            title="Upload new photo"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-stone-900 disabled:opacity-60"
          >
            {avatarSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileSelected}
          />
        </div>

        {isEditingProfile ? (
          <div className="flex-1 w-full text-center sm:text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <div>
                <h3 className="text-sm font-extrabold">Edit Personal Profile</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Modify your core workspace identity</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1">First Name *</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-medium ${profileErrors.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 dark:border-stone-800'}`}
                  placeholder="First Name"
                />
                {profileErrors.firstName && <span className="text-[10px] text-red-500 block mt-1 font-bold">{profileErrors.firstName}</span>}
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-medium ${profileErrors.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 dark:border-stone-800'}`}
                  placeholder="Last Name"
                />
                {profileErrors.lastName && <span className="text-[10px] text-red-500 block mt-1 font-bold">{profileErrors.lastName}</span>}
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={e => setEditDob(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-medium ${profileErrors.dateOfBirth ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 dark:border-stone-800'}`}
                />
                {profileErrors.dateOfBirth && <span className="text-[10px] text-red-500 block mt-1 font-bold">{profileErrors.dateOfBirth}</span>}
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-sm font-medium"
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-500 dark:text-stone-400 mb-1">Physical Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-sm font-medium"
                  placeholder="128 Ocean Dr, Apt 4B, San Francisco CA 94107"
                />
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveProfileData}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white flex items-center space-x-1.5 disabled:opacity-60 transition-colors shadow-md border border-white/10"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-60 transition-colors border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-extrabold">{currentUser.firstName} {currentUser.lastName}</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-2">Profile Picture · {currentUser.role}</p>
            
            {/* Display DOB and contact details in standard card view */}
            <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1 mb-4 font-semibold">
              {currentUser.dateOfBirth && (
                <p>🎂 Date of Birth: <span className="font-bold text-stone-800 dark:text-stone-200">{currentUser.dateOfBirth}</span></p>
              )}
              {currentUser.phone && (
                <p>📞 Phone: <span className="font-bold text-stone-800 dark:text-stone-200">{currentUser.phone}</span></p>
              )}
              {currentUser.address && (
                <p>🏠 Address: <span className="font-bold text-stone-800 dark:text-stone-200">{currentUser.address}</span></p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={handleAvatarPick}
                disabled={avatarSaving}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white flex items-center space-x-1.5 disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{currentUser.avatarUrl ? "Update Photo" : "Add Photo"}</span>
              </button>
              {currentUser.avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatarSaving}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center space-x-1.5 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
              <button
                type="button"
                onClick={startEditing}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 flex items-center space-x-1.5 border border-orange-500/20"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
            {avatarError && (
              <p className="text-[11px] font-bold text-red-500 mt-2">{avatarError}</p>
            )}
            <p className="text-[10px] text-stone-400 font-semibold mt-2">JPG, PNG or WEBP. Cropped to a square automatically.</p>
          </div>
        )}
      </div>

      {currentUser.role === "admin" ? (
        // ==========================================
        // ADMIN MODE SYSTEM POLICIES
        // ==========================================
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* LEFT SIDE: CONFIG GROUPS */}
          <div className="p-4 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-2 text-xs">
            <span className="block text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-2 px-2">Configuration Groups</span>
            {[
              { id: "attendance", label: "Attendance Controls", icon: Clock },
              { id: "location", label: "HQ Geographic Parameters", icon: Building },
              { id: "security", label: "Security & Permissions", icon: Shield },
              { id: "backups", label: "Database Backups Ledger", icon: Database }
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = adminActiveTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setAdminActiveTab(sec.id as any)}
                  className={`w-full p-2.5 rounded-lg flex items-center space-x-2.5 text-left font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-[#ea503f] to-[#7a1505] text-white shadow shadow-red-600/30 border border-white/10"
                      : "hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-stone-400"}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* MIDDLE/RIGHT SIDE: INPUT EDITORS */}
          <div className="md:col-span-2 space-y-6">
            
            {adminActiveTab === "attendance" && (
              <form onSubmit={handleSaveSettings} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-5 text-xs font-semibold">
                
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-2">
                  <Clock className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Duty & Clocking Coefficients</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 mb-1">Punctuality Grace Period (Minutes) *</label>
                    <input
                      type="number"
                      required
                      value={graceMinutes}
                      onChange={e => setGraceMinutes(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                    <span className="block text-[10px] text-stone-400 font-medium mt-1">Arrivals logged after this grace value are automatically flagged Late.</span>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Standard Daily Core Hours *</label>
                    <input
                      type="number"
                      required
                      value={coreHours}
                      onChange={e => setCoreHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                    <span className="block text-[10px] text-stone-400 font-medium mt-1">Under-departures completed below this duration value are flagged Early Exit.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1.5">Official Corporate Duty Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => {
                      const active = selectedDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`p-2 px-3.5 rounded-lg border font-bold transition-all ${
                            active
                              ? "bg-gradient-to-br from-[#ea503f] to-[#7a1505] text-white shadow shadow-red-600/30 border border-white/10"
                              : "bg-transparent hover:bg-stone-50 dark:hover:bg-stone-950 text-stone-500"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Attendance Controls</span>
                </button>

              </form>
            )}

            {adminActiveTab === "location" && (
              <form onSubmit={handleSaveSettings} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-5 text-xs font-semibold">
                
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-2">
                  <Building className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">HQ Geographic Parameters</h3>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Corporate HQ Location Coordinates or Address *</label>
                  <input
                    required
                    value={officeLocation}
                    onChange={e => setOfficeLocation(e.target.value)}
                    placeholder="Enter corporate HQ address or lat/long coordinates (e.g., 37.7749, -122.4194)"
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                  <span className="block text-[10px] text-stone-400 font-medium mt-1">Geographic parameters defining active zone boundaries for GPS geofencing clock-ins.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Location Parameters</span>
                </button>

              </form>
            )}

            {adminActiveTab === "security" && (
              <form onSubmit={handleSaveSettings} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-5 text-xs font-semibold">
                
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-2">
                  <Shield className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Security Policies & Permissions</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 mb-1">Session Inactivity Timeout (Minutes)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={1440}
                      value={sessionTimeout}
                      onChange={e => setSessionTimeout(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Minimum Password Length</label>
                    <input
                      type="number"
                      required
                      min={6}
                      max={64}
                      value={passwordMinLength}
                      onChange={e => setPasswordMinLength(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Forced Password Rotation Interval (Days)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={forcedPasswordRotation}
                      onChange={e => setForcedPasswordRotation(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                    <span className="block text-[10px] text-stone-400 font-medium mt-1">Set to 0 to disable periodic forced password rotation rules.</span>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Login Attempt Threshold (Limits)</label>
                    <input
                      type="number"
                      required
                      min={3}
                      max={20}
                      value={loginAttemptLimit}
                      onChange={e => setLoginAttemptLimit(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                    />
                    <span className="block text-[10px] text-stone-400 font-medium mt-1">Accounts are temporarily locked after this many consecutive authentication failures.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900">
                  <div className="space-y-0.5">
                    <span className="block font-extrabold text-xs">Require Two-Factor Authentication (2FA) Company-wide</span>
                    <span className="text-[10px] text-stone-400 font-medium">Require all operational and employee accounts to register a valid MFA device.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTwoFactorRequired(!twoFactorRequired)}
                    className={`w-11 h-6 rounded-full p-1 transition-all ${
                      twoFactorRequired ? "bg-orange-600" : "bg-stone-300 dark:bg-stone-800"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-all transform ${twoFactorRequired ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Security Permissions</span>
                </button>

              </form>
            )}

            {adminActiveTab === "backups" && (
              <div className="space-y-6">
                
                {/* SNAPSHOTS CONTROLLER */}
                <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold space-y-4">
                  <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-1">
                    <Database className="h-4.5 w-4.5 text-orange-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">Database Backup Snapshot Ledger</h3>
                  </div>

                  <p className="text-stone-500 leading-relaxed font-semibold">
                    Initiate live, hot backups of corporate user profiles, attendance, leaves, asset registers, and configuration policies. Snapshot archives are processed and stored securely.
                  </p>

                  <div className="flex pt-2">
                    <button
                      disabled={backupLoading}
                      onClick={handleBackup}
                      className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-60 text-white rounded-lg font-bold flex items-center justify-center space-x-2"
                    >
                      {backupLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Database className="h-4 w-4" />}
                      <span>Create Real Database Backup Snapshot</span>
                    </button>
                  </div>
                </div>

                {/* BACKUPS LOGTABLE */}
                <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <span className="block text-stone-400 font-bold uppercase text-[9px] tracking-wider">Historical Snapshot Records</span>
                  
                  {backups.length === 0 ? (
                    <div className="text-center py-8 bg-stone-50 dark:bg-stone-950 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
                      No backups have been created yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-stone-500 dark:text-stone-400">
                        <thead className="bg-stone-100 dark:bg-stone-950 text-[10px] text-stone-400 font-bold uppercase">
                          <tr>
                            <th className="p-3 rounded-l-lg">Backup Filename</th>
                            <th className="p-3">Created Date</th>
                            <th className="p-3">Size</th>
                            <th className="p-3 rounded-r-lg">Status</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-stone-700 dark:text-stone-300">
                          {backups.map((bak) => (
                            <tr key={bak.id} className="border-b border-stone-100 dark:border-stone-800/60 last:border-none">
                              <td className="p-3 font-mono text-[11px] text-orange-600 dark:text-orange-400 max-w-[200px] truncate" title={bak.name}>
                                {bak.name}
                              </td>
                              <td className="p-3 text-[11px]">{new Date(bak.date).toLocaleString()}</td>
                              <td className="p-3 font-mono text-[11px]">{bak.size}</td>
                              <td className="p-3">
                                <span className="p-1 px-2.5 text-[9px] bg-emerald-100/40 text-emerald-600 rounded font-bold">
                                  {bak.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      ) : (
        // ==========================================
        // EMPLOYEE SELF-SERVICE MODE (NON-ADMINS)
        // ==========================================
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* LEFT SIDEBAR: PROFILE TAB NAVIGATION */}
          <div className="p-4 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-2 text-xs">
            
            {/* Short mini card avatar */}
            <div className="flex items-center space-x-3 p-2 pb-4 mb-2 border-b border-stone-100 dark:border-stone-800">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt="" 
                  className="h-10 w-10 rounded-full object-cover border border-stone-200 dark:border-stone-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 flex items-center justify-center text-xs font-extrabold border border-stone-200 dark:border-stone-800">
                  {(currentUser.firstName?.[0] || "").toUpperCase()}{(currentUser.lastName?.[0] || "").toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <h4 className="font-extrabold text-sm truncate">{currentUser.firstName} {currentUser.lastName}</h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider truncate">{currentUser.jobTitle}</p>
              </div>
            </div>

            <span className="block text-stone-400 font-bold uppercase text-[9px] tracking-wider mb-2 px-2">Personal Parameters</span>
            {[
              { id: "dossier", label: "My Personal Dossier", icon: UserIcon },
              { id: "resume", label: "My Career Canvas (Skills)", icon: Award },
              { id: "security", label: "Security & Alerts Prefs", icon: Shield },
              { id: "hardware", label: "My Hardware Assets", icon: Laptop }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = essTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEssTab(tab.id as any)}
                  className={`w-full p-2.5 rounded-lg flex items-center space-x-2.5 text-left font-extrabold transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#ea503f] to-[#7a1505] text-white shadow-lg shadow-red-600/30 border border-white/10"
                      : "hover:bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-stone-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT VIEW CANVAS */}
          <div className="md:col-span-2 space-y-6">
            
            {essTab === "dossier" && (
              <form onSubmit={handleSaveProfile} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-5 text-xs font-semibold">
                
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-2">
                  <UserIcon className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Personal Contact coordinates</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 mb-1">Mobile Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Emergency SOS Contact (Name & Tel)</label>
                    <div className="relative">
                      <Contact className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={e => setEmergencyContact(e.target.value)}
                        placeholder="John Doe (Spouse) - +1 (555) 438-9201"
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Physical Residential Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="128 Ocean Dr, Apt 4B, San Francisco CA 94107"
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    />
                  </div>
                </div>

                {/* READ ONLY CONTRACT STATS */}
                <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-900 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400">Roster Job Title</span>
                    <span className="font-extrabold text-xs text-stone-700 dark:text-stone-300">{currentUser.jobTitle}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400">System Permission Role</span>
                    <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400 capitalize">{currentUser.role}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400">Corporate Date Joined</span>
                    <span className="font-extrabold text-xs text-stone-700 dark:text-stone-300">{new Date(currentUser.dateJoined).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Contact Details</span>
                </button>

              </form>
            )}

            {essTab === "resume" && (
              <form onSubmit={handleSaveProfile} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm space-y-5 text-xs font-semibold">
                
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-2">
                  <Award className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Professional Career Canvas</h3>
                </div>

                {/* SKILLS TAG GENERATOR */}
                <div className="space-y-3">
                  <label className="block text-stone-400">Core Professional Skills & Technologies</label>
                  
                  {/* Skill Chips flex list */}
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-900">
                    {skills.length === 0 ? (
                      <span className="text-stone-400 italic text-[11px] self-center">No skills logged yet. Add some below!</span>
                    ) : (
                      skills.map((s, index) => (
                        <div key={`${s}-${index}`} className="p-1 px-2.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-extrabold rounded-lg flex items-center space-x-1 border border-orange-500/10">
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => removeSkillChip(s)}
                            className="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-900 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Skills add form inline */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      placeholder="Add a technology or methodology (e.g. React, Agile, SQL)..."
                      className="flex-1 p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkillChip(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addSkillChip}
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white font-extrabold border border-white/10 flex items-center space-x-1 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* PROJECTS LIST */}
                <div className="space-y-3">
                  <label className="block text-stone-400">Corporate Assignments & Projects</label>
                  
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-900">
                    {projects.length === 0 ? (
                      <span className="text-stone-400 italic text-[11px] self-center">No projects listed. Add some below!</span>
                    ) : (
                      projects.map((p, index) => (
                        <div key={`${p}-${index}`} className="p-1 px-2.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-extrabold rounded-lg flex items-center space-x-1 border border-orange-500/10">
                          <span>{p}</span>
                          <button
                            type="button"
                            onClick={() => removeProjectChip(p)}
                            className="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-900 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProject}
                      onChange={e => setNewProject(e.target.value)}
                      placeholder="Add a division project (e.g. Phoenix Launch, Q3 Migration)..."
                      className="flex-1 p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addProjectChip(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addProjectChip}
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white font-extrabold border border-white/10 flex items-center space-x-1 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm shadow-red-600/30"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Update Career Tags</span>
                </button>

              </form>
            )}

            {essTab === "security" && (
              <div className="space-y-6">
                
                {/* MFA PANEL CARD */}
                <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold space-y-4">
                  
                  <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-1">
                    <Shield className="h-4.5 w-4.5 text-orange-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">Multi-Factor Authenticator (MFA)</h3>
                  </div>

                  <p className="text-stone-500 leading-relaxed font-semibold">
                    Protect your corporate dossier, payroll files, and internal hardware ledger by requiring a secondary verification token during credential login.
                  </p>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900">
                    <div className="space-y-0.5">
                      <span className="block font-extrabold text-xs">Simulated Two-Factor Authentication (2FA)</span>
                      <span className="text-[10px] text-stone-400 font-medium">Verify through mobile auth generator code during session init.</span>
                    </div>

                    {/* Simple toggle switch */}
                    <button
                      onClick={handleToggleMFA}
                      className={`w-11 h-6 rounded-full p-1 transition-all ${
                        twoFactor ? "bg-orange-600" : "bg-stone-300 dark:bg-stone-800"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-white transition-all transform ${twoFactor ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                </div>

                {/* NOTIFICATIONS PANEL CARD */}
                <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold space-y-4">
                  
                  <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-1">
                    <Bell className="h-4.5 w-4.5 text-orange-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">Real-Time Alerts Routing</h3>
                  </div>

                  <p className="text-stone-500 leading-relaxed font-semibold">
                    Customize your alerts rules. Select which operations emit real-time system alerts and dynamic header notification dots.
                  </p>

                  <div className="space-y-3 pt-1">
                    {[
                      { key: "leaveStatus", title: "Leave Status Updates", desc: "Notify when a manager approves, rejects, or requests feedback on your leave applications." },
                      { key: "assetUpdates", title: "Hardware Asset Changes", desc: "Notify immediately when laptops, phones, or monitors are assigned or requested back." },
                      { key: "announcements", title: "Corporate Announcements", desc: "Get notifications about corporate subdivision policies and system-wide settings modifications." }
                    ].map((pref) => {
                      const enabled = (notifPrefs as any)[pref.key];
                      return (
                        <div 
                          key={pref.key} 
                          onClick={() => handleToggleNotificationPref(pref.key as any)}
                          className="flex items-start justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-950 border border-transparent hover:border-stone-100 dark:hover:border-stone-900 cursor-pointer transition-colors"
                        >
                          <div className="space-y-0.5 max-w-[85%]">
                            <span className="block font-extrabold text-xs">{pref.title}</span>
                            <span className="text-[10px] text-stone-400 font-semibold leading-tight block">{pref.desc}</span>
                          </div>
                          
                          {/* Checkbox indicator */}
                          <div className={`h-5 w-5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                            enabled 
                              ? "bg-gradient-to-br from-[#ea503f] to-[#7a1505] border border-white/10 text-white" 
                              : "border-stone-300 dark:border-stone-700 bg-transparent"
                          }`}>
                            {enabled && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            )}

            {essTab === "hardware" && (
              <div className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-xs space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-1">
                  <Laptop className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Assigned Hardware Assets</h3>
                </div>

                <p className="text-stone-500 leading-relaxed font-semibold">
                  Below are the IT hardware assets currently registered and allocated to your custody by the system administrator.
                </p>

                {loadingAssets ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Loading hardware register...</span>
                  </div>
                ) : assignedAssets.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl border-stone-200 dark:border-stone-800 text-center text-stone-400 font-bold flex flex-col items-center justify-center space-y-2">
                    <Laptop className="h-8 w-8 text-stone-300 dark:text-stone-700" />
                    <span>No hardware assets are currently assigned to you.</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {assignedAssets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-semibold"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">{asset.name}</span>
                            <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md text-[9px] font-bold uppercase tracking-wider">
                              {asset.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400">
                            <span className="font-mono">Asset ID: {asset.assetId}</span>
                            <span className="font-mono">S/N: {asset.serialNumber || "N/A"}</span>
                            {asset.dateAssigned && (
                              <span>Assigned: {asset.dateAssigned}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                            asset.status === "Available"
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                              : asset.status === "Assigned"
                              ? "text-orange-600 bg-orange-50 dark:bg-orange-950/40"
                              : (asset.status === "UnderRepair" || asset.status === "Maintenance")
                              ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                              : "text-stone-500 bg-stone-100 dark:bg-stone-900"
                          }`}>
                            {asset.status === "Maintenance" ? "In Maintenance" : asset.status}
                          </span>

                          {(asset.status !== "Maintenance" && asset.status !== "UnderRepair") && (
                            <button
                              onClick={() => handleReportDamage(asset)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide shadow-xs transition-colors cursor-pointer"
                            >
                              Report Damage / File Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {isTicketModalOpen && selectedAssetForTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-scaleIn text-xs">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
              <div>
                <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Report Damage / File Ticket</h4>
                <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Asset: {selectedAssetForTicket.name} ({selectedAssetForTicket.assetId})</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="p-5 space-y-4">
              {ticketError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold">
                  {ticketError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wide text-[10px]">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Please describe the damage or issue you are experiencing with this hardware..."
                  className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wide text-[10px]">
                  Severity <span className="text-stone-400 font-medium">(Optional)</span>
                </label>
                <select
                  value={ticketSeverity}
                  onChange={(e: any) => setTicketSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold uppercase tracking-wide text-[10px]"
                >
                  <option value="Low">Low - Cosmetic, doesn't affect work</option>
                  <option value="Medium">Medium - Annoyance, partially working</option>
                  <option value="High">High - Major blocker, unable to work properly</option>
                  <option value="Critical">Critical - Hardware is completely non-functional</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wide text-[10px]">
                  Additional Notes <span className="text-stone-400 font-medium">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  placeholder="Any other helpful details, context, or timelines..."
                  className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  disabled={isSubmittingTicket}
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-800 rounded-xl font-bold uppercase tracking-wider text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-950 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-4 py-2 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1 disabled:opacity-50"
                >
                  {isSubmittingTicket ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
