import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Building,
  Plus,
  Trash2,
  Edit,
  User,
  Users,
  DollarSign,
  Loader2,
  X,
  Target,
  Briefcase
} from "lucide-react";
import { api } from "../utils/api";
import { Department, User as UserType } from "../types";

interface DepartmentViewProps {
  currentUser: UserType;
  isDarkMode: boolean;
}

export default function DepartmentView({ currentUser, isDarkMode }: DepartmentViewProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fields state
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState({
    name: "",
    code: "",
    managerId: "",
    budget: 500000,
  });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Department[]>("/departments");
      setDepartments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load departments registers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.get<{ employees: UserType[] }>("/employees?limit=100");
      setEmployees(data.employees);
    } catch (err) {
      console.error("Failed to query employee registers", err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await api.post("/departments", formFields);
      setFormSuccess("Corporate subdivision successfully registered!");
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        resetForm();
        fetchDepartments();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to create department.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await api.put(`/departments/${selectedDeptId}`, formFields);
      setFormSuccess("Subdivision parameters modified successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        setFormSuccess(null);
        resetForm();
        fetchDepartments();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Modification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this department and unassign all employees. Proceed?")) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditModal = (dept: Department) => {
    setSelectedDeptId(dept.id);
    setFormFields({
      name: dept.name,
      code: dept.code,
      managerId: dept.managerId || "",
      budget: dept.budget,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedDeptId(null);
    setFormFields({
      name: "",
      code: "",
      managerId: "",
      budget: 500000,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Corporate Departments</h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">Audit subdivision headcount, monitor allocated budgets, and assign department managers.</p>
        </div>
        {currentUser.role === "admin" && (
          <button
            onClick={() => { resetForm(); setFormError(null); setShowAddModal(true); }}
            className="p-3 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/10 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 self-stretch sm:self-auto justify-center"
            id="add-department-trigger"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Register Subdivision</span>
          </button>
        )}
      </div>

      {/* DEPARTMENTS GRID VIEW */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs text-stone-500 font-medium mt-2">Loading subdivisions roster...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center border rounded-xl max-w-lg mx-auto text-red-500">{error}</div>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => {
            const head = employees.find(e => e.id === dept.managerId);
            return (
              <div
                key={dept.id}
                className={`p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between min-h-[220px] text-xs`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="p-1 px-2.5 text-[10px] bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-md font-bold uppercase tracking-wide">{dept.code}</span>
                    {currentUser.role === "admin" && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(dept)}
                          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                          id={`edit-dept-${dept.id}`}
                        >
                          <Edit className="h-4 w-4 text-stone-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">{dept.name}</h3>
                    <p className="text-[10px] text-stone-400">ID: {dept.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-semibold">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <div>
                        <span className="block text-stone-400 text-[9px] uppercase font-bold leading-none">Headcount</span>
                        <span className="text-stone-700 dark:text-stone-300 font-extrabold">{dept.employeeCount || 0} Members</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <div>
                        <span className="block text-stone-400 text-[9px] uppercase font-bold leading-none">Annual Budget</span>
                        <span className="text-stone-700 dark:text-stone-300 font-extrabold">${dept.budget?.toLocaleString() || "0"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 mt-4 flex items-center space-x-2 bg-stone-50 dark:bg-stone-950/40 p-2 rounded-lg">
                  <User className="h-4 w-4 text-stone-400" />
                  <div className="truncate">
                    <span className="block text-stone-400 text-[9px] font-bold uppercase leading-none">Subdivision Lead</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {head ? `${head.firstName} ${head.lastName}` : "No head assigned"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-stone-400">No corporate departments logged in databases.</div>
      )}

      {/* MODAL: ADD SUBDIVISION */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold mb-1">Onboard Subdivision Department</h3>
            <p className="text-xs text-stone-500 mb-6 font-medium">Create a functional cluster with structural code parameters and leading staff.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-400 mb-1">Subdivision Name *</label>
                <input
                  required
                  value={formFields.name}
                  onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                  placeholder="e.g. Sales Development"
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Structural Code *</label>
                  <input
                    required
                    value={formFields.code}
                    onChange={e => setFormFields({ ...formFields, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SALES-DE"
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Annual Budget Estimate ($) *</label>
                  <input
                    required
                    type="number"
                    value={formFields.budget}
                    onChange={e => setFormFields({ ...formFields, budget: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Select Department Lead (Manager)</label>
                <select
                  value={formFields.managerId}
                  onChange={e => setFormFields({ ...formFields, managerId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                >
                  <option value="">No head assigned</option>
                  {employees.filter(emp => emp.role !== "employee").map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.jobTitle})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="add-department-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Register Department</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT SUBDIVISION */}
      {showEditModal && selectedDeptId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold mb-1">Modify Department Parameters</h3>
            <p className="text-xs text-stone-500 mb-6 font-medium">Update operational budgets or change department leadership.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-400 mb-1">Subdivision Name *</label>
                <input
                  required
                  value={formFields.name}
                  onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Structural Code *</label>
                  <input
                    required
                    value={formFields.code}
                    onChange={e => setFormFields({ ...formFields, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Annual Budget Estimate ($) *</label>
                  <input
                    required
                    type="number"
                    value={formFields.budget}
                    onChange={e => setFormFields({ ...formFields, budget: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Select Department Lead (Manager)</label>
                <select
                  value={formFields.managerId}
                  onChange={e => setFormFields({ ...formFields, managerId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                >
                  <option value="">No head assigned</option>
                  {employees.filter(emp => emp.role !== "employee").map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.jobTitle})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="edit-department-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Save Department Modifications</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
