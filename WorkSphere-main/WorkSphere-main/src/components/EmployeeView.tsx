import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  X,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Layers,
  Award
} from "lucide-react";
import { api } from "../utils/api";
import { User, Department } from "../types";

interface EmployeeViewProps {
  currentUser: User;
  isDarkMode: boolean;
}

export default function EmployeeView({ currentUser, isDarkMode }: EmployeeViewProps) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter parameters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector and form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [inspectedEmployee, setInspectedEmployee] = useState<{
    profile: User;
    leaves: any[];
    attendance: any[];
    assets: any[];
  } | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  // Create/Edit employee form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields state
  const [formFields, setFormFields] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "employee",
    departmentId: "",
    managerId: "",
    jobTitle: "",
    phone: "",
    emergencyContact: "",
    address: "",
    skillsStr: "",
    projectsStr: "",
    avatarUrl: ""
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [search, selectedDept, selectedRole, selectedStatus, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        search,
        department: selectedDept,
        role: selectedRole,
        status: selectedStatus,
        page: String(page),
        limit: "8"
      });
      const data = await api.get<{ employees: User[]; total: number; totalPages: number }>(`/employees?${params.toString()}`);
      setEmployees(data.employees);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to query employee directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await api.get<Department[]>("/departments");
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const handleInspect = async (id: string) => {
    try {
      setSelectedEmployeeId(id);
      setLoadingInspection(true);
      const data = await api.get<any>(`/employees/${id}`);
      setInspectedEmployee(data);
    } catch (err: any) {
      alert(err.message || "Failed to load employee timeline.");
    } finally {
      setLoadingInspection(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "active" | "suspended") => {
    if (!window.confirm(`Are you absolutely sure you want to set this employee status to ${newStatus}?`)) return;
    try {
      await api.put(`/employees/${id}/status`, { status: newStatus });
      fetchEmployees();
      if (inspectedEmployee && inspectedEmployee.profile.id === id) {
        handleInspect(id); // Reload active profile
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete the employee, cancel their permissions, and unassign all hardware. This action is irreversible. Proceed?")) return;
    try {
      await api.delete(`/employees/${id}`);
      setSelectedEmployeeId(null);
      setInspectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const skills = formFields.skillsStr.split(",").map(s => s.trim()).filter(Boolean);
      const projects = formFields.projectsStr.split(",").map(p => p.trim()).filter(Boolean);
      
      await api.post("/employees", {
        ...formFields,
        skills,
        projects
      });

      setFormSuccess("Employee registered and added to corporate records successfully!");
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        resetForm();
        fetchEmployees();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Onboarding failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const skills = formFields.skillsStr.split(",").map(s => s.trim()).filter(Boolean);
      const projects = formFields.projectsStr.split(",").map(p => p.trim()).filter(Boolean);
      
      const payload: any = {
        ...formFields,
        skills,
        projects
      };
      // Password can be omitted
      if (!payload.password) delete payload.password;

      await api.put(`/employees/${selectedEmployeeId}`, payload);

      setFormSuccess("Employee profile modified successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        setFormSuccess(null);
        resetForm();
        fetchEmployees();
        handleInspect(selectedEmployeeId);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Profile modification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (!inspectedEmployee) return;
    const p = inspectedEmployee.profile;
    setFormFields({
      email: p.email || "",
      password: "",
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      role: p.role || "employee",
      departmentId: p.departmentId || "",
      managerId: p.managerId || "",
      jobTitle: p.jobTitle || "",
      phone: p.phone || "",
      emergencyContact: p.emergencyContact || "",
      address: p.address || "",
      skillsStr: Array.isArray(p.skills) ? p.skills.join(", ") : "",
      projectsStr: Array.isArray(p.projects) ? p.projects.join(", ") : "",
      avatarUrl: p.avatarUrl || ""
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormFields({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "employee",
      departmentId: "",
      managerId: "",
      jobTitle: "",
      phone: "",
      emergencyContact: "",
      address: "",
      skillsStr: "",
      projectsStr: "",
      avatarUrl: ""
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Employee Directory & Registers</h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">Manage corporate accounts, suspend contracts, and inspect team rosters.</p>
        </div>
        {currentUser.role === "admin" && (
          <button
            onClick={() => { resetForm(); setFormError(null); setShowAddModal(true); }}
            className="p-3 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 self-stretch sm:self-auto justify-center"
            id="add-employee-trigger"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Onboard New Employee</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT BLOCK: SEARCH & EMPLOYEES DIRECTORY TABLE */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-stone-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by first name, last name, email, or job title..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border dark:bg-stone-950 dark:border-stone-800 dark:text-stone-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <select
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
                  className="w-full p-2.5 text-xs rounded-lg border dark:bg-stone-950 dark:border-stone-800 font-semibold"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedRole}
                  onChange={e => { setSelectedRole(e.target.value); setPage(1); }}
                  className="w-full p-2.5 text-xs rounded-lg border dark:bg-stone-950 dark:border-stone-800 font-semibold"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin Only</option>
                  <option value="manager">Manager Only</option>
                  <option value="employee">Employee Only</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedStatus}
                  onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="w-full p-2.5 text-xs rounded-lg border dark:bg-stone-950 dark:border-stone-800 font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* EMPLOYEES GRID/DIRECTORY TABLE */}
          <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">Querying secure employee directory...</p>
              </div>
            ) : employees.length > 0 ? (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-950 text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800 uppercase tracking-wider">
                      <th className="p-4 font-extrabold">Employee</th>
                      <th className="p-4 font-extrabold">Job Title</th>
                      <th className="p-4 font-extrabold">Department</th>
                      <th className="p-4 font-extrabold">Role</th>
                      <th className="p-4 font-extrabold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr
                        key={emp.id}
                        onClick={() => handleInspect(emp.id)}
                        className={`border-b border-stone-100 dark:border-stone-900 hover:bg-stone-50 dark:hover:bg-stone-950 cursor-pointer transition-colors ${selectedEmployeeId === emp.id ? "bg-orange-50/50 dark:bg-stone-950/60 font-medium border-l-2 border-l-orange-500" : ""}`}
                      >
                        <td className="p-4 flex items-center space-x-3">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-stone-200 dark:border-stone-800" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 border border-stone-200 dark:border-stone-800">
                              {(emp.firstName?.[0] || "").toUpperCase()}{(emp.lastName?.[0] || "").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-stone-400">{emp.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-stone-700 dark:text-stone-300">{emp.jobTitle}</td>
                        <td className="p-4 text-stone-500">
                          {departments.find(d => d.id === emp.departmentId)?.name || "Unassigned"}
                        </td>
                        <td className="p-4">
                          <span className={`capitalize font-bold px-2 py-0.5 rounded-md text-[10px] ${emp.role === "admin" ? "bg-red-100 text-red-600 dark:bg-red-950/40" : emp.role === "manager" ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40" : "bg-orange-100/70 text-orange-700 dark:bg-orange-950/30"}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emp.status === "active" ? "text-emerald-600 bg-emerald-100/40 dark:bg-emerald-950/40" : "text-stone-500 bg-stone-100 dark:bg-stone-900"}`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400">No active employees found matching the current search parameters.</div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 flex justify-between items-center border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <span className="text-[11px] text-stone-500 font-medium">Showing {employees.length} of {totalCount} profiles</span>
                <div className="flex space-x-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold px-2.5 py-1 text-stone-500 dark:text-stone-400">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT BLOCK: DETAILED EMPLOYEE PROFILE INSPECTOR */}
        <div className="space-y-4">
          <div className={`p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm min-h-[400px]`}>
            {loadingInspection ? (
              <div className="flex flex-col justify-center items-center h-80 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="text-xs text-stone-500 font-medium">Inspecting corporate contract ledger...</p>
              </div>
            ) : inspectedEmployee ? (
              <div className="space-y-6 text-xs text-stone-700 dark:text-stone-300">
                
                {/* Avatar & Title Block */}
                <div className="text-center relative">
                  {inspectedEmployee.profile.avatarUrl ? (
                    <img src={inspectedEmployee.profile.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover mx-auto border-2 border-orange-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-lg font-extrabold mx-auto border-2 border-orange-500">
                      {(inspectedEmployee.profile.firstName?.[0] || "").toUpperCase()}{(inspectedEmployee.profile.lastName?.[0] || "").toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-base font-extrabold mt-3">{inspectedEmployee.profile.firstName} {inspectedEmployee.profile.lastName}</h3>
                  <p className="text-stone-500 font-semibold mt-0.5">{inspectedEmployee.profile.jobTitle}</p>
                  <p className="text-[10px] text-stone-400 mt-1">ID: {inspectedEmployee.profile.id} | Joined: {inspectedEmployee.profile.dateJoined}</p>
                  
                  {/* Status Badges */}
                  <div className="flex justify-center space-x-1.5 mt-2.5">
                    <span className="capitalize px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 text-[10px] font-bold rounded-md">{inspectedEmployee.profile.role}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inspectedEmployee.profile.status === "active" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950" : "bg-stone-100 text-stone-500"}`}>{inspectedEmployee.profile.status}</span>
                  </div>
                </div>

                {/* Admin controls block */}
                {currentUser.role === "admin" && (
                  <div className="grid grid-cols-2 gap-2 border-t border-b py-3 border-stone-200 dark:border-stone-800">
                    <button
                      onClick={openEditModal}
                      className="p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 hover:dark:bg-stone-900 border rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    {inspectedEmployee.profile.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(inspectedEmployee.profile.id, "suspended")}
                        className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 border rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>Suspend</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(inspectedEmployee.profile.id, "active")}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Activate</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(inspectedEmployee.profile.id)}
                      className="col-span-2 p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 border border-red-500/20 rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Permanently Delete Employee Account</span>
                    </button>
                  </div>
                )}

                {/* Profile Details Tabs */}
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <p className="font-bold text-stone-400 uppercase tracking-widest text-[9px]">Contact Information</p>
                    <p className="flex items-center space-x-2"><Mail className="h-4 w-4 text-stone-400" /> <span className="font-semibold">{inspectedEmployee.profile.email}</span></p>
                    <p className="flex items-center space-x-2"><Phone className="h-4 w-4 text-stone-400" /> <span>{inspectedEmployee.profile.phone || "No phone added"}</span></p>
                    <p className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-stone-400" /> <span>{inspectedEmployee.profile.address || "No address added"}</span></p>
                    <p className="flex items-start space-x-2"><Heart className="h-4 w-4 text-stone-400 mt-0.5" /> <div><span className="block text-stone-400 text-[10px]">Emergency Contact</span> <span className="font-semibold">{inspectedEmployee.profile.emergencyContact || "Unassigned"}</span></div></p>
                  </div>

                  <div className="border-t pt-3 border-stone-100 dark:border-stone-800 space-y-2">
                    <p className="font-bold text-stone-400 uppercase tracking-widest text-[9px]">Expertise & Projects</p>
                    <div>
                      <span className="text-[10px] text-stone-400 block font-semibold">Skills Register</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {inspectedEmployee.profile.skills.length > 0 ? (
                          inspectedEmployee.profile.skills.map((s, idx) => (
                            <span key={idx} className="p-1 px-2 text-[10px] bg-stone-100 dark:bg-stone-800 rounded font-semibold">{s}</span>
                          ))
                        ) : (
                          <span className="text-stone-400">None declared</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <span className="text-[10px] text-stone-400 block font-semibold">Active Project Assignments</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {inspectedEmployee.profile.projects.length > 0 ? (
                          inspectedEmployee.profile.projects.map((p, idx) => (
                            <span key={idx} className="p-1 px-2 text-[10px] bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 rounded font-semibold border border-orange-500/10">{p}</span>
                          ))
                        ) : (
                          <span className="text-stone-400">General Admin</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational Summaries */}
                  <div className="border-t pt-3 border-stone-100 dark:border-stone-800 space-y-3">
                    <p className="font-bold text-stone-400 uppercase tracking-widest text-[9px]">Operational Summaries</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-stone-400" />
                        <span className="font-semibold">Assigned Assets</span>
                      </div>
                      <span className="p-1 px-2 rounded bg-stone-100 dark:bg-stone-900 font-bold">{inspectedEmployee.assets.length} Assets</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-stone-400" />
                        <span className="font-semibold">Attendance Logs</span>
                      </div>
                      <span className="p-1 px-2 rounded bg-stone-100 dark:bg-stone-900 font-bold">{inspectedEmployee.attendance.length} Record(s)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-stone-400" />
                        <span className="font-semibold">Leave Calendar Requests</span>
                      </div>
                      <span className="p-1 px-2 rounded bg-stone-100 dark:bg-stone-900 font-bold">{inspectedEmployee.leaves.length} Filed</span>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-80 text-center text-stone-400 p-6 space-y-3">
                <Users className="h-12 w-12 text-stone-300" />
                <h4 className="font-bold">No Profile Inspected</h4>
                <p className="text-xs leading-relaxed">Select any employee profile from the directory on the left to review emergency info, skills, attendance summary, and assigned hardware assets.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: ONBOARD NEW EMPLOYEE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative my-8 ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold mb-1">Onboard & Create Employee Account</h3>
            <p className="text-xs text-stone-500 mb-6">Complete the mandatory operational HR records to generate corporate portal keys.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">First Name *</label>
                  <input
                    required
                    value={formFields.firstName}
                    onChange={e => setFormFields({ ...formFields, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="Evelyn"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Last Name *</label>
                  <input
                    required
                    value={formFields.lastName}
                    onChange={e => setFormFields({ ...formFields, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="Carter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Corporate Email *</label>
                  <input
                    required
                    type="email"
                    value={formFields.email}
                    onChange={e => setFormFields({ ...formFields, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="e.carter@company.com"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Portal Password *</label>
                  <input
                    required
                    type="password"
                    value={formFields.password}
                    onChange={e => setFormFields({ ...formFields, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">System Role *</label>
                  <select
                    value={formFields.role}
                    onChange={e => setFormFields({ ...formFields, role: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Department</label>
                  <select
                    value={formFields.departmentId}
                    onChange={e => setFormFields({ ...formFields, departmentId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Job Title *</label>
                  <input
                    required
                    value={formFields.jobTitle}
                    onChange={e => setFormFields({ ...formFields, jobTitle: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="QA Automation Expert"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Personal Phone</label>
                  <input
                    value={formFields.phone}
                    onChange={e => setFormFields({ ...formFields, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="+1 (555) 012-4455"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Emergency contact info</label>
                  <input
                    value={formFields.emergencyContact}
                    onChange={e => setFormFields({ ...formFields, emergencyContact: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="James Carter (Spouse: +1 555-012-4456)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Technical Skills Register (Comma separated)</label>
                <input
                  value={formFields.skillsStr}
                  onChange={e => setFormFields({ ...formFields, skillsStr: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  placeholder="Java, Selenium, Cypress, Jira, Postman"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="add-employee-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Onboard Employee into Directory</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {showEditModal && inspectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative my-8 ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold mb-1">Modify Employee Profile</h3>
            <p className="text-xs text-stone-500 mb-6">Modify records for {inspectedEmployee.profile.firstName} {inspectedEmployee.profile.lastName}.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">First Name *</label>
                  <input
                    required
                    value={formFields.firstName}
                    onChange={e => setFormFields({ ...formFields, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Last Name *</label>
                  <input
                    required
                    value={formFields.lastName}
                    onChange={e => setFormFields({ ...formFields, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Corporate Email *</label>
                  <input
                    required
                    type="email"
                    value={formFields.email}
                    onChange={e => setFormFields({ ...formFields, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">New Portal Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formFields.password}
                    onChange={e => setFormFields({ ...formFields, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">System Role *</label>
                  <select
                    value={formFields.role}
                    onChange={e => setFormFields({ ...formFields, role: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Department</label>
                  <select
                    value={formFields.departmentId}
                    onChange={e => setFormFields({ ...formFields, departmentId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Job Title *</label>
                  <input
                    required
                    value={formFields.jobTitle}
                    onChange={e => setFormFields({ ...formFields, jobTitle: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Personal Phone</label>
                  <input
                    value={formFields.phone}
                    onChange={e => setFormFields({ ...formFields, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Emergency contact info</label>
                  <input
                    value={formFields.emergencyContact}
                    onChange={e => setFormFields({ ...formFields, emergencyContact: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Technical Skills Register (Comma separated)</label>
                <input
                  value={formFields.skillsStr}
                  onChange={e => setFormFields({ ...formFields, skillsStr: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Projects assignment (Comma separated)</label>
                <input
                  value={formFields.projectsStr}
                  onChange={e => setFormFields({ ...formFields, projectsStr: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Avatar Image URL</label>
                <input
                  value={formFields.avatarUrl}
                  onChange={e => setFormFields({ ...formFields, avatarUrl: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="edit-employee-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Save Corporate Profile Changes</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
