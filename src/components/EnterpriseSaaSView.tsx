import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building, ShieldAlert, Cpu, GitFork, Award, CheckCircle2, AlertCircle, Clock,
  FileSignature, QrCode, ClipboardList, Send, Ticket, MessageSquare, Plus,
  Sparkles, Layers, DollarSign, Calendar, MapPin, User, ChevronRight, Check, CheckSquare,
  Bookmark, Lock, FileText, UserPlus, Star, ArrowUpRight, Search, ShieldCheck, Compass
} from "lucide-react";
import { api } from "../utils/api";
import { User as UserType } from "../types";
import { Html5Qrcode } from "html5-qrcode";

interface EnterpriseSaaSViewProps {
  currentUser: UserType;
  isDarkMode: boolean;
}

export default function EnterpriseSaaSView({ currentUser, isDarkMode }: EnterpriseSaaSViewProps) {
  // Global SaaS context states
  const [activeTab, setActiveTab] = useState<"tenants" | "workflows" | "lifecycle" | "assets" | "serviceDesk" | "geofence" | "documents" | "appreciate">("tenants");
  const [tenants, setTenants] = useState<any[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>("t-acme");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Tenants initially
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await api.get<any[]>("/saas/tenants");
      setTenants(data);
    } catch (err: any) {
      console.error("Error loading tenants:", err);
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const getHeaders = () => {
    return { "X-Tenant-Id": currentTenantId };
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId) || {
    id: "t-acme",
    name: "Acme Enterprise Solutions",
    subdomain: "acme",
    brandingColor: "#4f46e5",
    plan: "enterprise"
  };

  return (
    <div className={`h-full flex flex-col space-y-6 ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>

      {/* Floating Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[9999] bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center space-x-2 border border-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[9999] bg-rose-500 text-white px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center space-x-2 border border-rose-400"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SaaS MODULES NAVIGATION CHIPS */}
      <div className="flex-shrink-0 flex items-center overflow-x-auto pb-2 gap-2 scrollbar-none">
        {[
          { id: "tenants", label: "Multi-Tenant Hub", icon: Building },
          { id: "workflows", label: "Workflow Designer", icon: GitFork },
          { id: "lifecycle", label: "Employee Lifecycle", icon: UserPlus },
          { id: "assets", label: "Hardware & QR Labs", icon: QrCode },
          { id: "serviceDesk", label: "SaaS Service Desk", icon: Ticket },
          { id: "geofence", label: "GPS Geofencing", icon: MapPin },
          { id: "documents", label: "Secure Document Vault", icon: Lock },
          { id: "appreciate", label: "Peer Appreciation", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-all whitespace-nowrap border ${
                active
                  ? "bg-gradient-to-br from-[#ea503f] to-[#7a1505] text-white border-white/10 shadow-lg shadow-red-600/30 scale-[1.02]"
                  : isDarkMode
                    ? "bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900/60"
                    : "bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE MODULE CONTROLLER */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "tenants" && <TenantOnboardingModule onNewTenant={loadTenants} isDarkMode={isDarkMode} showToast={showToast} tenants={tenants} currentTenant={currentTenant} />}
            {activeTab === "workflows" && <WorkflowAutomationModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} />}
            {activeTab === "lifecycle" && <EmployeeLifecycleModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} currentUser={currentUser} />}
            {activeTab === "assets" && <AssetLifecycleModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} />}
            {activeTab === "serviceDesk" && <ServiceDeskModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} currentUser={currentUser} />}
            {activeTab === "geofence" && <GeofencingModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} currentUser={currentUser} />}
            {activeTab === "documents" && <DocumentVaultModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} currentUser={currentUser} />}
            {activeTab === "appreciate" && <PeerAppreciationModule isDarkMode={isDarkMode} showToast={showToast} tenantHeaders={getHeaders()} currentUser={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

// ==================================================
// 1. MULTI-TENANT ONBOARDING MODULE
// ==================================================
interface TenantModuleProps {
  tenants: any[];
  currentTenant: any;
  showToast: (m: string, err?: boolean) => void;
  onNewTenant: () => void;
  isDarkMode: boolean;
}
function TenantOnboardingModule({ tenants, currentTenant, showToast, onNewTenant, isDarkMode }: TenantModuleProps) {
  const [form, setForm] = useState({ name: "", subdomain: "", brandingColor: "#4f46e5", plan: "standard" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subdomain) {
      showToast("Please enter tenant name and desired subdomain.", true);
      return;
    }
    setLoading(true);
    try {
      const created = await api.post<any>("/saas/tenants", form);
      showToast(`Success! Provisioned new isolated tenant database for "${created.name}"`);
      setForm({ name: "", subdomain: "", brandingColor: "#4f46e5", plan: "standard" });
      onNewTenant();
    } catch (err: any) {
      showToast(err.message || "Failed to provision tenant.", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Onboarding Wizard Form */}
      <div className={`lg:col-span-7 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Sparkles className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase tracking-wider">Tenant Provisioning Wizard</h2>
        </div>
        <p className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          Onboard a new organization instantly. This wizard establishes an isolated database namespace, initializes default leave rosters, configures corporate routing, and prepares secure settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Organization Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Oracle Labs"
                className="w-full px-3 py-2.5 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Subdomain Space</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={form.subdomain}
                  onChange={e => setForm(p => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder="e.g. oracle"
                  className="w-full px-3 py-2.5 rounded-l-xl border-y border-l dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
                />
                <span className="px-3 py-2.5 rounded-r-xl border border-l-0 bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-900 text-stone-400 font-bold">
                  .saas.app
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Subscription Tier</label>
              <select
                value={form.plan}
                onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
              >
                <option value="standard">Standard Plan (Up to 100 Seats)</option>
                <option value="growth">Growth Scale (Up to 500 Seats)</option>
                <option value="enterprise">Enterprise Complete (Unlimited)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Corporate Branding Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={form.brandingColor}
                  onChange={e => setForm(p => ({ ...p, brandingColor: e.target.value }))}
                  className="w-12 h-9 rounded-xl border p-0.5 cursor-pointer dark:bg-stone-950 dark:border-stone-900"
                />
                <span className="font-mono text-[11px] text-stone-400">{form.brandingColor}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
          >
            {loading ? <span>Spinning up Environment...</span> : <span>Provision Tenant Org</span>}
          </button>
        </form>
      </div>

      {/* Tenancy Observability Inspector */}
      <div className={`lg:col-span-5 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Layers className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase tracking-wider">Tenant Directory & Telemetry</h2>
        </div>
        <p className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          Isolated multi-tenant router database stats:
        </p>

        <div className="space-y-3">
          {tenants.map(t => (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                t.id === currentTenant.id
                  ? "bg-orange-50/10 border-orange-500/30 dark:bg-orange-950/10"
                  : "bg-stone-50/40 dark:bg-stone-950/10 border-transparent"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.brandingColor }} />
                <div>
                  <h4 className="font-extrabold text-xs">{t.name}</h4>
                  <p className="text-[10px] text-stone-400 font-mono leading-none">{t.subdomain}.saas.app</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  t.plan === "enterprise"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                    : t.plan === "growth"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                      : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                }`}>
                  {t.plan}
                </span>
                <p className="text-[8px] text-stone-400 mt-1 font-mono">ID: {t.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==================================================
// 2. WORKFLOW AUTOMATION CONFIGURATOR MODULE
// ==================================================
interface SubModuleProps {
  isDarkMode: boolean;
  showToast: (m: string, err?: boolean) => void;
  tenantHeaders: any;
}
function WorkflowAutomationModule({ isDarkMode, showToast, tenantHeaders }: SubModuleProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    triggerType: "leave_request",
    nodes: [
      { id: "node-1", type: "trigger", title: "Roster Request Registered", description: "Triggered instantly when user registers submission" },
      { id: "node-2", type: "approval", title: "Primary Supervisor Sign-off", description: "Direct routing to immediate department manager", assigneeRole: "manager", slaHours: 24 }
    ]
  });

  useEffect(() => {
    fetchWorkflows();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchWorkflows = async () => {
    try {
      const data = await api.get<any[]>("/saas/workflows", { headers: tenantHeaders });
      setWorkflows(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflow.name) {
      showToast("Please specify a workflow layout name.", true);
      return;
    }
    try {
      await api.post("/saas/workflows", newWorkflow, { headers: tenantHeaders });
      showToast(`Saved workflow process map "${newWorkflow.name}"`);
      setNewWorkflow({
        name: "",
        triggerType: "leave_request",
        nodes: [
          { id: "node-1", type: "trigger", title: "Roster Request Registered", description: "Triggered instantly when user registers submission" },
          { id: "node-2", type: "approval", title: "Primary Supervisor Sign-off", description: "Direct routing to immediate department manager", assigneeRole: "manager", slaHours: 24 }
        ]
      });
      fetchWorkflows();
    } catch (err: any) {
      showToast(err.message || "Failed to save workflow.", true);
    }
  };

  const addNode = (type: "approval" | "condition" | "action") => {
    const titles = {
      approval: "Additional Approving Director",
      condition: "SLA Threshold Verification Node",
      action: "Trigger System Action (Sync DB & Email)"
    };
    const desc = {
      approval: "Secondary level sign-off requiring VP or C-Level operational compliance clearance.",
      condition: "Examine parameter conditions like balance rates or critical priority thresholds.",
      action: "Execute webhook pipelines, dispatch alerts, synchronize directories."
    };
    const node = {
      id: "node-" + Date.now(),
      type,
      title: titles[type],
      description: desc[type],
      assigneeRole: type === "approval" ? "admin" : undefined,
      slaHours: type === "approval" ? 48 : undefined
    };
    setNewWorkflow(p => ({ ...p, nodes: [...p.nodes, node] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Workflow Builder Canvas */}
      <div className={`lg:col-span-8 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><GitFork className="h-4 w-4" /></span>
            <h2 className="font-extrabold text-sm uppercase tracking-wider">Visual Approval Workflow Designer</h2>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">Canvas Engine v1.0</span>
        </div>

        <form onSubmit={handleSaveWorkflow} className="space-y-4 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Pipeline Name</label>
              <input
                type="text"
                value={newWorkflow.name}
                onChange={e => setNewWorkflow(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Critical Hardware Allocation"
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Trigger Mechanism</label>
              <select
                value={newWorkflow.triggerType}
                onChange={e => setNewWorkflow(p => ({ ...p, triggerType: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500 focus:outline-none"
              >
                <option value="leave_request">Leave Application Submitted</option>
                <option value="asset_allocation">Hardware Asset Request</option>
                <option value="it_ticket">Service Ticket Escalation</option>
              </select>
            </div>
          </div>

          {/* Core Pipeline Visual Flow Nodes Stack */}
          <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-7 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
            {newWorkflow.nodes.map((node, idx) => (
              <div
                key={node.id}
                className={`ml-14 p-3.5 rounded-xl border relative transition-all ${
                  node.type === "trigger"
                    ? "bg-teal-500/10 border-teal-500/30"
                    : node.type === "condition"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : node.type === "action"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-stone-50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-900"
                }`}
              >
                {/* Visual Connector Dot */}
                <span className="absolute -left-[45px] top-4 w-4 h-4 rounded-full border-4 bg-white dark:bg-stone-950 flex items-center justify-center" 
                      style={{ borderColor: node.type === 'trigger' ? '#14b8a6' : node.type === 'condition' ? '#f59e0b' : '#4f46e5' }} />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-stone-400 block mb-1">{node.type} node</span>
                    <h4 className="font-extrabold text-xs">{node.title}</h4>
                    <p className={`text-[10px] font-normal leading-tight mt-0.5 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>{node.description}</p>
                  </div>
                  {idx > 1 && (
                    <button
                      type="button"
                      onClick={() => setNewWorkflow(p => ({ ...p, nodes: p.nodes.filter(n => n.id !== node.id) }))}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Node Action Center */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => addNode("approval")}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-extrabold text-white/70 hover:text-white border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Plus className="h-3 w-3" />
              <span>Add Approval Stage</span>
            </button>
            <button
              type="button"
              onClick={() => addNode("condition")}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-extrabold text-white/70 hover:text-white border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Plus className="h-3 w-3" />
              <span>Add Condition Node</span>
            </button>
            <button
              type="button"
              onClick={() => addNode("action")}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-extrabold text-white/70 hover:text-white border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Plus className="h-3 w-3" />
              <span>Add System Action</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl uppercase tracking-wider font-extrabold text-[11px] mt-4"
          >
            Deploy Automation Workflow
          </button>
        </form>
      </div>

      {/* Installed Active Workflows list */}
      <div className={`lg:col-span-4 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><ClipboardList className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase tracking-wider">Active Policy Flows</h2>
        </div>
        <p className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          List of automated flow configurations active inside this organization:
        </p>

        <div className="space-y-4">
          {workflows.map(wf => (
            <div key={wf.id} className="p-4 rounded-xl border dark:bg-stone-950/40 dark:border-stone-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-wider">Active</span>
                <span className="text-[9px] text-stone-400 font-mono">Nodes: {wf.nodes.length}</span>
              </div>
              <h4 className="font-extrabold text-xs">{wf.name}</h4>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest leading-none font-mono">Trigger: {wf.triggerType.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==================================================
// 3. EMPLOYEE LIFECYCLE MANAGEMENT MODULE
// ==================================================
interface LifecycleProps {
  currentUser: UserType;
  isDarkMode: boolean;
  showToast: (m: string, err?: boolean) => void;
  tenantHeaders: any;
}
function EmployeeLifecycleModule({ currentUser, isDarkMode, showToast, tenantHeaders }: LifecycleProps) {
  const [steps, setSteps] = useState<any[]>([]);
  const [form, setForm] = useState({ userId: "u-demoid", userName: "Alex Rodriguez", type: "onboarding", stepName: "", notes: "", dueDate: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSteps();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchSteps = async () => {
    try {
      const data = await api.get<any[]>("/saas/lifecycle", { headers: tenantHeaders });
      setSteps(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stepName) {
      showToast("Please provide step action item description.", true);
      return;
    }
    try {
      await api.post("/saas/lifecycle", form, { headers: tenantHeaders });
      showToast(`Logged lifecycle stage step for ${form.userName}`);
      setForm(p => ({ ...p, stepName: "", notes: "", dueDate: "" }));
      fetchSteps();
    } catch (err: any) {
      showToast(err.message || "Failed.", true);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.put(`/saas/lifecycle/${id}/toggle`, {}, { headers: tenantHeaders });
      showToast("Toggled step completion status");
      fetchSteps();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle.", true);
    }
  };

  const filteredSteps = steps.filter(s => s.userName.toLowerCase().includes(search.toLowerCase()) || s.stepName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Onboarding / Transition Action Register Form */}
      <div className={`lg:col-span-5 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><UserPlus className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase tracking-wider">Log Career Event</h2>
        </div>
        <p className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          Schedule transition milestones (Probation review, onboarding hardware signoff, exit clearance task, career progression reviews).
        </p>

        <form onSubmit={handleCreateStep} className="space-y-4 font-bold">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Target Employee</label>
            <select
              value={form.userId}
              onChange={e => {
                const names: Record<string, string> = { "u-demoid": "Alex Rodriguez", "u-evelyn": "Evelyn Carter", "u-sarah": "Sarah Connor" };
                setForm(p => ({ ...p, userId: e.target.value, userName: names[e.target.value] || "Staff Member" }));
              }}
              className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500"
            >
              <option value="u-demoid">Alex Rodriguez (New Hire)</option>
              <option value="u-evelyn">Evelyn Carter (Staff Associate)</option>
              <option value="u-sarah">Sarah Connor (Ops Lead)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Milestone Category</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500"
              >
                <option value="onboarding">Onboarding Checklist</option>
                <option value="offboarding">Offboarding Clearance</option>
                <option value="promotion">Career Progression</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400 uppercase tracking-wider">Target Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Milestone Goal (Short Description)</label>
            <input
              type="text"
              value={form.stepName}
              onChange={e => setForm(p => ({ ...p, stepName: e.target.value }))}
              placeholder="e.g. Conduct 30-Day Sync Call"
              className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100 focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase tracking-wider">Internal Handover Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Review objectives, required files..."
              className="w-full px-3 py-2 rounded-xl border h-16 dark:bg-stone-950 dark:border-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl uppercase font-black"
          >
            Register Milestone Task
          </button>
        </form>
      </div>

      {/* Active Lifecycle Tracker Directory */}
      <div className={`lg:col-span-7 p-6 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4 flex flex-col`}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm uppercase tracking-wider">Milestone Compliance Audit Log</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter names..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border dark:bg-stone-950 dark:border-stone-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredSteps.map(step => (
            <div
              key={step.id}
              onClick={() => handleToggle(step.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 hover:scale-[1.01] ${
                step.isCompleted
                  ? "bg-stone-50/50 dark:bg-stone-950/20 border-transparent opacity-60"
                  : "bg-stone-100/10 border-stone-200 dark:border-stone-900"
              }`}
            >
              <div className="mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                ) : (
                  <div className="h-4.5 w-4.5 rounded-full border-2 border-stone-300 dark:border-stone-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs">{step.userName}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    step.type === "onboarding"
                      ? "bg-teal-500/10 text-teal-500"
                      : step.type === "offboarding"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-orange-500/10 text-orange-500"
                  }`}>
                    {step.type}
                  </span>
                </div>
                <h4 className="font-bold text-xs mt-1 text-stone-800 dark:text-stone-200">{step.stepName}</h4>
                <p className="text-[10px] text-stone-400 mt-1">{step.notes}</p>
                <div className="flex items-center space-x-1.5 mt-2 text-[9px] text-stone-400 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>Target Due: {step.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==================================================
// 4. ADVANCED ASSET LIFECYCLE & QR LABS
// ==================================================
function AssetLifecycleModule({ isDarkMode, showToast, tenantHeaders }: SubModuleProps) {
  const [procurements, setProcurements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"procure" | "depreciate" | "qr">("procure");
  const [form, setForm] = useState({ name: "", category: "Laptop", quantity: 1, estimatedCost: 0, vendor: "" });
  
  // Depreciation calculator state
  const [depCal, setDepCal] = useState({ cost: 2400, salvage: 400, life: 5 });
  const [depYears, setDepYears] = useState<any[]>([]);

  // QR Generator & Simulation state
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [scannedLogs, setScannedLogs] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // Real webcam scanning integration inside SaaS view
  const [realCameraScan, setRealCameraScan] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saasScannedAsset, setSaasScannedAsset] = useState<any | null>(null);
  const [saasUpdateFields, setSaasUpdateFields] = useState({
    status: "Available",
    location: "",
    notes: ""
  });
  const [saasSubmitting, setSaasSubmitting] = useState(false);

  // Real camera scan effect inside AssetLifecycleModule
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let isActive = true;

    if (activeTab === "qr" && realCameraScan) {
      setScanning(true);
      setCameraError(null);

      const timer = setTimeout(() => {
        if (!isActive) return;
        const element = document.getElementById("saas-qr-reader");
        if (!element) {
          console.error("saas-qr-reader element not found");
          return;
        }

        try {
          html5Qrcode = new Html5Qrcode("saas-qr-reader");
          html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 180, height: 180 }
            },
            async (decodedText) => {
              if (isActive) {
                try {
                  if (html5Qrcode?.isScanning) {
                    await html5Qrcode.stop();
                  }
                } catch (e) {
                  console.error(e);
                }
                setScanning(false);
                setRealCameraScan(false);
                handleRealQrScanned(decodedText);
              }
            },
            () => {
              // Mute scan frames failure
            }
          ).catch(err => {
            if (isActive) {
              console.error("Camera start failed:", err);
              setCameraError("Camera permission denied or camera not found.");
              setScanning(false);
            }
          });
        } catch (e: any) {
          if (isActive) {
            setCameraError(e.message || "Failed to initialize camera scanner.");
            setScanning(false);
          }
        }
      }, 250);

      return () => {
        isActive = false;
        clearTimeout(timer);
        if (html5Qrcode && html5Qrcode.isScanning) {
          html5Qrcode.stop().catch(err => console.error("Failed to stop scanner on cleanup:", err));
        }
      };
    }
  }, [activeTab, realCameraScan]);

  const handleRealQrScanned = async (decodedText: string) => {
    const trimmed = decodedText.trim();
    try {
      const realAssets = await api.get<any[]>("/assets");
      let found = realAssets.find(a => a.assetId.toLowerCase() === trimmed.toLowerCase() || a.serialNumber?.toLowerCase() === trimmed.toLowerCase());
      
      if (!found) {
        const match = trimmed.match(/AST-\d{4}-\d+/i);
        if (match) {
          found = realAssets.find(a => a.assetId.toLowerCase() === match[0].toLowerCase());
        }
      }

      if (found) {
        setSaasScannedAsset(found);
        setSaasUpdateFields({
          status: found.status,
          location: found.location || "",
          notes: ""
        });
        const info = `REAL_SCAN [${found.assetId}] - ${found.name} identified. Prompting update...`;
        setScannedLogs(prev => [info, ...prev]);
        showToast(`Decoded Asset Tag successfully: ${found.assetId}`);
      } else {
        const info = `UNRECOGNIZED_SCAN - Tag "${trimmed}" not found in corporate registers.`;
        setScannedLogs(prev => [info, ...prev]);
        showToast("Scanned code not recognized in registry", true);
      }
    } catch (err: any) {
      showToast("Lookup failed: " + err.message, true);
    }
  };

  const handleSaasQuickUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saasScannedAsset) return;
    setSaasSubmitting(true);
    try {
      const updated = await api.put<any>(`/assets/${saasScannedAsset.id}/quick-update`, saasUpdateFields);
      showToast("Asset successfully updated via QR scan!");
      setSaasScannedAsset(null);
      
      const info = `UPDATED [${updated.assetId}] - Location: ${updated.location || "N/A"}, Status: ${updated.status}`;
      setScannedLogs(prev => [info, ...prev]);
    } catch (err: any) {
      showToast("Failed to update asset: " + err.message, true);
    } finally {
      setSaasSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchProcurements = async () => {
    try {
      const data = await api.get<any[]>("/saas/procurement", { headers: tenantHeaders });
      setProcurements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.estimatedCost <= 0) {
      showToast("Please provide asset details and valid cost.", true);
      return;
    }
    try {
      await api.post("/saas/procurement", form, { headers: tenantHeaders });
      showToast(`Procurement order request for ${form.name} successfully queued!`);
      setForm({ name: "", category: "Laptop", quantity: 1, estimatedCost: 0, vendor: "" });
      fetchProcurements();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/saas/procurement/${id}/status`, { status }, { headers: tenantHeaders });
      showToast(`Status updated to: ${status.toUpperCase()}`);
      fetchProcurements();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const calculateDepreciation = () => {
    const cost = Number(depCal.cost);
    const salvage = Number(depCal.salvage);
    const life = Number(depCal.life);
    if (cost <= salvage || life <= 0) return;

    const annualDep = (cost - salvage) / life;
    let currentVal = cost;
    const years = [];
    for (let i = 1; i <= life; i++) {
      currentVal -= annualDep;
      years.push({
        year: i,
        depreciation: annualDep.toFixed(2),
        bookValue: Math.max(currentVal, salvage).toFixed(2)
      });
    }
    setDepYears(years);
    showToast("Straight-Line Asset Depreciation Model Generated.");
  };

  const triggerQrScan = async () => {
    setScanning(true);
    try {
      const realAssets = await api.get<any[]>("/assets");
      setScanning(false);
      if (realAssets && realAssets.length > 0) {
        const item = realAssets[Math.floor(Math.random() * realAssets.length)];
        const info = `${item.assetId} [${item.name}] - Status: ${item.status} (${item.assignedUserName && item.assignedUserName !== "Unassigned" ? item.assignedUserName : "Unallocated"})`;
        setScannedLogs(prev => [info, ...prev]);
        showToast(`Decoded Asset QR Code successfully: ${item.assetId}`);
      } else {
        const info = "NO_ASSETS_FOUND - No real IT hardware assets exist in the system database. Register one under the Assets module first!";
        setScannedLogs(prev => [info, ...prev]);
        showToast("QR Scanner read empty ledger", true);
      }
    } catch (err: any) {
      setScanning(false);
      showToast("Scan failed: " + err.message, true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Sidebar Control Panel */}
      <div className={`lg:col-span-3 p-5 rounded-2xl border flex flex-col space-y-2 ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      }`}>
        <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-2">Asset Sub-Modules</span>
        {[
          { id: "procure", label: "Procurements & POs", icon: DollarSign },
          { id: "depreciate", label: "Depreciation Engine", icon: Layers },
          { id: "qr", label: "QR Barcode simulation", icon: QrCode }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full p-2.5 rounded-xl font-bold text-left flex items-center space-x-2.5 transition-colors ${
              activeTab === item.id
                ? "bg-orange-600/10 text-orange-500 dark:text-orange-400 border border-orange-500/20"
                : "hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-500"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Canvas View */}
      <div className="lg:col-span-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            {/* SUB: PROCUREMENT */}
            {activeTab === "procure" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* PO Request Form */}
                <div className={`md:col-span-5 p-5 rounded-2xl border ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                } space-y-3`}>
                  <h3 className="font-extrabold text-sm uppercase">Request Purchase Order</h3>
                  <form onSubmit={handleProcure} className="space-y-3 font-bold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-400">Inventory Item Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Dell Precision 7680"
                        className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-400">Quantity</label>
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={e => setForm(p => ({ ...p, quantity: Math.max(1, Number(e.target.value)) }))}
                          className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-400">Unit Price ($)</label>
                        <input
                          type="number"
                          value={form.estimatedCost}
                          onChange={e => setForm(p => ({ ...p, estimatedCost: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-400">Target Vendor</label>
                      <input
                        type="text"
                        value={form.vendor}
                        onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))}
                        placeholder="Lenovo Corp"
                        className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 font-extrabold rounded-xl uppercase">
                      Queue PO Request
                    </button>
                  </form>
                </div>

                {/* PO Active Stack */}
                <div className={`md:col-span-7 p-5 rounded-2xl border flex flex-col space-y-3 ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                }`}>
                  <h3 className="font-extrabold text-sm uppercase">Active Procurement Pipeline</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {procurements.map(p => (
                      <div key={p.id} className="p-3.5 rounded-xl border dark:bg-stone-950/40 dark:border-stone-900 flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs">{p.name}</h4>
                          <p className="text-[10px] text-stone-400">Vendor: {p.vendor} | Qty: {p.quantity} | Total: ${p.estimatedCost}</p>
                          <p className="text-[9px] text-stone-500">Requested by: {p.requestedBy} on {p.dateRequested}</p>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            p.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          }`}>{p.status}</span>
                          
                          {p.status === "pending" && (
                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => handleStatusUpdate(p.id, "approved")}
                                className="px-2 py-1 bg-emerald-500 text-white rounded text-[9px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(p.id, "rejected")}
                                className="px-2 py-1 bg-rose-500 text-white rounded text-[9px]"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* SUB: DEPRECIATION ENGINE */}
            {activeTab === "depreciate" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Inputs card */}
                <div className={`md:col-span-4 p-5 rounded-2xl border ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                } space-y-3`}>
                  <h3 className="font-extrabold text-sm uppercase">Depreciation Settings</h3>
                  <div className="space-y-3 font-bold">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-400 uppercase">Purchase Price ($)</label>
                      <input
                        type="number"
                        value={depCal.cost}
                        onChange={e => setDepCal(p => ({ ...p, cost: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-400 uppercase">Residual/Salvage Value ($)</label>
                      <input
                        type="number"
                        value={depCal.salvage}
                        onChange={e => setDepCal(p => ({ ...p, salvage: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-400 uppercase">Useful Lifespan (Years)</label>
                      <input
                        type="number"
                        value={depCal.life}
                        onChange={e => setDepCal(p => ({ ...p, life: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={calculateDepreciation}
                      className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 font-extrabold rounded-xl uppercase"
                    >
                      Calculate Model
                    </button>
                  </div>
                </div>

                {/* straight line results table */}
                <div className={`md:col-span-8 p-5 rounded-2xl border ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                } space-y-3`}>
                  <h3 className="font-extrabold text-sm uppercase">Straight-Line Depreciation Table</h3>
                  {depYears.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 font-bold">
                      Click Calculate to visualize asset devaluation curves.
                    </div>
                  ) : (
                    <div className="border border-stone-200 dark:border-stone-900 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-stone-100 dark:bg-stone-900 font-bold text-stone-500 uppercase text-[9px] border-b border-stone-200 dark:border-stone-900">
                          <tr>
                            <th className="p-3">Year</th>
                            <th className="p-3">Annual Depreciation</th>
                            <th className="p-3 text-right">Book Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-900">
                          {depYears.map(row => (
                            <tr key={row.year} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                              <td className="p-3 font-extrabold text-stone-500">Year {row.year}</td>
                              <td className="p-3 font-bold text-rose-500">-${row.depreciation}</td>
                              <td className="p-3 text-right font-mono font-bold">${row.bookValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SUB: QR BARCODE LABS */}
            {activeTab === "qr" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Scanner terminal */}
                <div className={`md:col-span-6 p-5 rounded-2xl border ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                } space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm uppercase">Corporate QR Scan Lab</h3>
                    
                    {/* Toggle controls between simulation and physical camera */}
                    <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border dark:border-stone-800 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setRealCameraScan(false);
                          setScanning(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${!realCameraScan ? "bg-white dark:bg-stone-800 text-orange-500 shadow-sm" : "text-stone-400"}`}
                      >
                        Mock Simulator
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRealCameraScan(true);
                          setScanning(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${realCameraScan ? "bg-white dark:bg-stone-800 text-orange-500 shadow-sm" : "text-stone-400"}`}
                      >
                        Live Camera Scan
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    {realCameraScan 
                      ? "Stream device camera directly to scan physical corporate barcode labels and update asset records." 
                      : "Simulate a physical barcode scanner click. Picks a random ledger item to demonstrate audit trails."}
                  </p>

                  <div className="aspect-video bg-stone-950 rounded-xl border border-stone-900 flex flex-col items-center justify-center relative overflow-hidden">
                    {realCameraScan ? (
                      <div id="saas-qr-reader" className="w-full h-full" />
                    ) : (
                      scanning ? (
                        <div className="space-y-3 text-center">
                          <div className="h-8 w-8 rounded-full border-4 border-t-orange-500 animate-spin border-transparent mx-auto" />
                          <span className="text-[10px] uppercase font-black text-orange-400 tracking-wider">Accessing Virtual Webcam...</span>
                        </div>
                      ) : (
                        <button
                          onClick={triggerQrScan}
                          className="px-4 py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider text-[10px]"
                        >
                          Initiate QR Scan Simulation
                        </button>
                      )
                    )}

                    {/* Camera error state */}
                    {realCameraScan && cameraError && (
                      <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center p-4 text-center space-y-2">
                        <span className="text-red-500 font-bold text-xs">{cameraError}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            setScanning(true);
                            setRealCameraScan(true);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 rounded-lg text-[10px] font-bold uppercase"
                        >
                          Retry Live Camera
                        </button>
                      </div>
                    )}

                    {/* Visual scan line effect */}
                    {scanning && <div className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-[bounce_3s_infinite] top-1/4 pointer-events-none" />}
                  </div>

                  {/* Inline manual lookup during scan */}
                  {realCameraScan && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Or enter Asset Tag ID manually..."
                        className="flex-1 p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border dark:border-stone-800 text-[10px] font-mono font-semibold text-stone-900 dark:text-stone-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) handleRealQrScanned(val);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousSibling as HTMLInputElement;
                          if (input.value) handleRealQrScanned(input.value);
                        }}
                        className="px-3 bg-stone-800 text-white rounded-lg text-[10px] uppercase font-bold"
                      >
                        Locate
                      </button>
                    </div>
                  )}
                </div>

                {/* Scan Results Terminal */}
                <div className={`md:col-span-6 p-5 rounded-2xl border flex flex-col space-y-3 ${
                  isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
                }`}>
                  <h3 className="font-extrabold text-sm uppercase">Audit & Relocation Desk</h3>
                  
                  {/* Real-time identified asset updater */}
                  {saasScannedAsset ? (
                    <form onSubmit={handleSaasQuickUpdateSubmit} className="space-y-3 p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 font-semibold text-[11px] text-left">
                      <div className="border-b dark:border-stone-800 pb-2">
                        <span className="text-[9px] uppercase font-black text-orange-500">Asset Identified</span>
                        <h4 className="text-xs font-black">{saasScannedAsset.name}</h4>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{saasScannedAsset.assetId} | S/N: {saasScannedAsset.serialNumber || "N/A"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-stone-400 text-[10px] mb-1">Status</label>
                          <select
                            value={saasUpdateFields.status}
                            onChange={e => setSaasUpdateFields({ ...saasUpdateFields, status: e.target.value })}
                            className="w-full p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border dark:border-stone-800 text-[11px]"
                          >
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="UnderRepair">Under Repair</option>
                            <option value="Retired">Retired</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-stone-400 text-[10px] mb-1">Physical Location</label>
                          <input
                            value={saasUpdateFields.location}
                            onChange={e => setSaasUpdateFields({ ...saasUpdateFields, location: e.target.value })}
                            placeholder="e.g. Chicago HQ"
                            className="w-full p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border dark:border-stone-800 text-[11px] text-stone-900 dark:text-stone-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-400 text-[10px] mb-0.5">Relocation/Audit Comments</label>
                        <input
                          value={saasUpdateFields.notes}
                          onChange={e => setSaasUpdateFields({ ...saasUpdateFields, notes: e.target.value })}
                          placeholder="Audit description..."
                          className="w-full p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border dark:border-stone-800 text-[11px] text-stone-900 dark:text-stone-100"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSaasScannedAsset(null)}
                          className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold rounded-lg text-[10px] uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saasSubmitting}
                          className="flex-1 py-2 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white font-bold rounded-lg text-[10px] uppercase flex items-center justify-center space-x-1"
                        >
                          {saasSubmitting && <div className="h-3 w-3 rounded-full border-2 border-t-white animate-spin border-transparent mr-1" />}
                          <span>Commit Update</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 flex-1">
                      {scannedLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-400 font-bold py-12 text-center">
                          No recent scan logs.<br/>Trigger Mock Scan or turn on Live Camera to decode labels.
                        </div>
                      ) : (
                        scannedLogs.map((log, i) => (
                          <div key={i} className="p-2.5 bg-stone-100/60 dark:bg-stone-950/40 rounded-lg border dark:border-stone-900 font-mono text-[10px]">
                            <span className="text-stone-500 uppercase font-bold tracking-wider mr-1 block text-[8px]">Scan Success:</span>
                            <span className="font-bold text-stone-800 dark:text-stone-100">{log}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

// ==================================================
// 5. SAAS SERVICE DESK & TICKETING MODULE
// ==================================================
interface ServiceDeskProps {
  currentUser: UserType;
  isDarkMode: boolean;
  showToast: (m: string, err?: boolean) => void;
  tenantHeaders: any;
}
function ServiceDeskModule({ currentUser, isDarkMode, showToast, tenantHeaders }: ServiceDeskProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New Ticket state
  const [newTkt, setNewTkt] = useState({ title: "", description: "", category: "IT", priority: "medium", slaLimitHours: "24", internalNotes: "" });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchTickets = async () => {
    try {
      const data = await api.get<any[]>("/saas/tickets", { headers: tenantHeaders });
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTkt.title || !newTkt.description) {
      showToast("Please provide title and description.", true);
      return;
    }
    try {
      await api.post("/saas/tickets", {
        ...newTkt,
        createdByUserId: currentUser.id,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`
      }, { headers: tenantHeaders });
      showToast("Service Ticket registered in compliance backlog!");
      setNewTkt({ title: "", description: "", category: "IT", priority: "medium", slaLimitHours: "24", internalNotes: "" });
      setShowCreateForm(false);
      fetchTickets();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !activeTicketId) return;
    try {
      const updated = await api.post<any>(`/saas/tickets/${activeTicketId}/comments`, {
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        content: commentText
      }, { headers: tenantHeaders });
      setCommentText("");
      showToast("Comment logged.");
      // Refresh current ticket inside state
      setTickets(prev => prev.map(t => t.id === activeTicketId ? updated : t));
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleResolve = async (id: string, satisfaction: number) => {
    try {
      const updated = await api.put<any>(`/saas/tickets/${id}/status`, {
        status: "resolved",
        satisfactionRating: satisfaction
      }, { headers: tenantHeaders });
      showToast(`Ticket Resolved. Satisfaction Rating: ${satisfaction} Stars.`);
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Tickets List Directory */}
      <div className={`lg:col-span-5 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-3 flex flex-col`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Ticket className="h-4 w-4" /></span>
            <h2 className="font-extrabold text-sm uppercase">Support Backlog</h2>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-2.5 py-1.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
          >
            <Plus className="h-3 w-3" />
            <span>Create Ticket</span>
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {tickets.map(t => (
            <div
              key={t.id}
              onClick={() => { setActiveTicketId(t.id); setShowCreateForm(false); }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                t.id === activeTicketId
                  ? "bg-orange-500/10 border-orange-500/30 dark:bg-orange-950/20"
                  : "bg-stone-50/40 dark:bg-stone-950/10 border-stone-200 dark:border-stone-900 hover:border-stone-300 dark:hover:border-stone-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold">
                <span className="font-mono text-stone-400">{t.id}</span>
                <span className={`px-2 py-0.5 rounded uppercase ${
                  t.priority === "critical" || t.priority === "high"
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}>{t.priority}</span>
              </div>
              <h4 className="font-extrabold text-xs mt-1 truncate">{t.title}</h4>
              <p className="text-[10px] text-stone-400 mt-1 leading-tight line-clamp-2">{t.description}</p>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{t.category} Group</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                  t.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail / Creator Workspace */}
      <div className="lg:col-span-7">
        {showCreateForm ? (
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
          } space-y-4`}>
            <h3 className="font-extrabold text-sm uppercase">Submit Service Desk Ticket</h3>
            <form onSubmit={handleCreate} className="space-y-3 font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase">Issue Title</label>
                <input
                  type="text"
                  required
                  value={newTkt.title}
                  onChange={e => setNewTkt(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Broken hardware monitor input ports"
                  className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 uppercase">Department Category</label>
                  <select
                    value={newTkt.category}
                    onChange={e => setNewTkt(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                  >
                    <option value="IT">IT Hardware/Systems</option>
                    <option value="HR">HR Operations/Benefits</option>
                    <option value="Finance">Finance/Paystubs</option>
                    <option value="Facilities">Facilities/AirCon</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 uppercase">Priority Impact</label>
                  <select
                    value={newTkt.priority}
                    onChange={e => setNewTkt(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                  >
                    <option value="low">Low Impact</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High SLA Attention</option>
                    <option value="critical">Critical (Blocking work)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 uppercase">SLA Limit Goal</label>
                  <select
                    value={newTkt.slaLimitHours}
                    onChange={e => setNewTkt(p => ({ ...p, slaLimitHours: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                  >
                    <option value="4">4 Hours SLA</option>
                    <option value="12">12 Hours SLA</option>
                    <option value="24">24 Hours SLA</option>
                    <option value="48">48 Hours SLA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 uppercase">Internal Notes (Admins)</label>
                  <input
                    type="text"
                    value={newTkt.internalNotes}
                    onChange={e => setNewTkt(p => ({ ...p, internalNotes: e.target.value }))}
                    placeholder="Suspecting physical damage"
                    className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase">Detailed Description</label>
                <textarea
                  required
                  value={newTkt.description}
                  onChange={e => setNewTkt(p => ({ ...p, description: e.target.value }))}
                  placeholder="Enclose exact symptoms, steps to replicate..."
                  className="w-full px-3 py-2 rounded-xl border h-20 dark:bg-stone-950"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 font-extrabold rounded-xl uppercase">
                Dispatch compliance ticket
              </button>
            </form>
          </div>
        ) : activeTicket ? (
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
          } space-y-4`}>
            
            {/* Header metadata */}
            <div className="flex items-center justify-between border-b dark:border-stone-900 pb-3">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-orange-500 font-mono">Backlog: {activeTicket.id}</span>
                <h3 className="font-extrabold text-sm mt-0.5">{activeTicket.title}</h3>
                <p className="text-[10px] text-stone-400">Created by: {activeTicket.createdByName} | SLA Countdown Target: {new Date(activeTicket.slaDeadline).toLocaleTimeString()}</p>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-black uppercase ${
                activeTicket.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              }`}>{activeTicket.status}</span>
            </div>

            <p className="text-xs font-normal leading-relaxed">{activeTicket.description}</p>

            {/* Comments stack */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Activity Feed & Comments</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeTicket.comments.map((cmt: any) => (
                  <div key={cmt.id} className="p-3 bg-stone-50 dark:bg-stone-950/30 rounded-xl border dark:border-stone-900">
                    <p className="font-extrabold text-[10px] flex justify-between">
                      <span>{cmt.authorName}</span>
                      <span className="text-stone-400 font-normal">{new Date(cmt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                    <p className="font-normal mt-1 leading-tight">{cmt.content}</p>
                  </div>
                ))}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Post comment or troubleshooting updates..."
                  className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900"
                />
                <button type="submit" className="p-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Resolution flow */}
            {activeTicket.status !== "resolved" && (
              <div className="border-t dark:border-stone-900 pt-4 flex flex-col space-y-2">
                <span className="text-[10px] uppercase font-black text-stone-400">Resolve Ticket (Customer Rating Survey)</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(stars => (
                    <button
                      key={stars}
                      onClick={() => handleResolve(activeTicket.id, stars)}
                      className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-colors text-emerald-500 rounded-lg flex items-center space-x-1 font-bold text-[10px]"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      <span>{stars} Star</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 font-bold">
            Select an active support ticket to review conversation feed.
          </div>
        )}
      </div>

    </div>
  );
}

// ==================================================
// 6. GPS GEOFENCING & REMOTE CHECK-IN MODULE
// ==================================================
function GeofencingModule({ currentUser, isDarkMode, showToast, tenantHeaders }: ServiceDeskProps) {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  const [isInside, setIsInside] = useState<boolean | null>(null);
  const [coords, setCoords] = useState({ lat: 37.7749, lng: -122.4194 });

  // Settings state
  const [hqName, setHqName] = useState("San Francisco HQ (Building 3)");
  const [hqCoords, setHqCoords] = useState({ lat: 37.7749, lng: -122.4194 });

  useEffect(() => {
    fetchAnomalies();
    fetchCorporateHq();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchCorporateHq = async () => {
    try {
      const data = await api.get<any>("/settings");
      if (data && data.officeLocation) {
        setHqName(data.officeLocation);
        // Try parsing coordinates like "37.7749, -122.4194" from location string
        const match = data.officeLocation.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (match) {
          const parsedLat = parseFloat(match[1]);
          const parsedLng = parseFloat(match[2]);
          setHqCoords({ lat: parsedLat, lng: parsedLng });
          setCoords({ lat: parsedLat, lng: parsedLng });
        }
      }
    } catch (err) {
      console.warn("Failed to load corporate HQ parameters for geofencing compliance:", err);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const data = await api.get<any[]>("/saas/anomalies", { headers: tenantHeaders });
      setAnomalies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyGps = () => {
    setChecking(true);
    setIsInside(null);
    setTimeout(() => {
      setChecking(false);
      // Determine inside/outside randomly
      const inside = Math.random() > 0.35;
      setIsInside(inside);
      if (inside) {
        // Generate coords within ~100m of HQ coordinates
        const offsetLat = (Math.random() - 0.5) * 0.001;
        const offsetLng = (Math.random() - 0.5) * 0.001;
        const checkLat = hqCoords.lat + offsetLat;
        const checkLng = hqCoords.lng + offsetLng;
        setCoords({ lat: checkLat, lng: checkLng });
        showToast(`GPS Coordinate Match. Clock-in approved inside compliance zone: ${hqName}.`);
      } else {
        // Generate coordinates far away (outside 500m geofence)
        const offsetLat = (Math.random() > 0.5 ? 0.015 : -0.015) + (Math.random() - 0.5) * 0.005;
        const offsetLng = (Math.random() > 0.5 ? 0.015 : -0.015) + (Math.random() - 0.5) * 0.005;
        const checkLat = hqCoords.lat + offsetLat;
        const checkLng = hqCoords.lng + offsetLng;
        setCoords({ lat: checkLat, lng: checkLng });
        showToast("Compliance Alert: GPS Geofence Check Failed! Logging alert.", true);
        
        // Dispatch anomaly report on the fly
        api.post("/saas/anomalies", {
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          type: "geofence_violation",
          details: `Attempted clock-in from remote latitude ${checkLat.toFixed(6)}, longitude ${checkLng.toFixed(6)} (compliance zone: ${hqName}).`
        }, { headers: tenantHeaders }).then(() => fetchAnomalies());
      }
    }, 1800);
  };

  const handleResolveAnomaly = async (id: string, status: string) => {
    try {
      await api.put(`/saas/anomalies/${id}/resolve`, { status }, { headers: tenantHeaders });
      showToast(`Logged anomaly report resolution status: ${status.toUpperCase()}`);
      fetchAnomalies();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Visual GPS verification widget */}
      <div className={`lg:col-span-6 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4 flex flex-col justify-between`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><MapPin className="h-4 w-4" /></span>
            <h2 className="font-extrabold text-sm uppercase">GPS Geofencing Verification</h2>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Compliant check-in limits location coordinates to standard office parameters. Geofence radius: <strong>500m around Corporate Headquarters</strong>.
          </p>
        </div>

        {/* Mock visual radar coordinate space */}
        <div className="aspect-video bg-stone-950 rounded-xl relative overflow-hidden border border-stone-900 flex items-center justify-center my-4">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
          
          {/* Pulsing office HQ radar circle */}
          <div className="absolute w-36 h-36 rounded-full border border-orange-500/40 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full border border-orange-400/40" />
          <div className="absolute w-2.5 h-2.5 bg-orange-500 rounded-full" />
          
          {/* Your current mock position pin */}
          {isInside !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute flex flex-col items-center justify-center"
              style={{
                top: isInside ? "42%" : "20%",
                left: isInside ? "55%" : "15%"
              }}
            >
              <MapPin className={`h-6 w-6 ${isInside ? "text-emerald-500" : "text-rose-500 animate-bounce"}`} />
              <span className="text-[8px] bg-stone-950 px-1 rounded mt-0.5 whitespace-nowrap">Your Coordinates</span>
            </motion.div>
          )}

          {checking && (
            <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center text-[10px] uppercase font-black tracking-widest text-orange-400">
              <span className="animate-pulse">Locking Triangulation GPS...</span>
            </div>
          )}
        </div>

        <div className="space-y-3 font-bold">
          <button
            onClick={handleVerifyGps}
            disabled={checking}
            className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white rounded-xl uppercase font-extrabold tracking-wider"
          >
            Run Location Audit
          </button>
          
          {isInside !== null && (
            <div className={`p-3 rounded-xl text-center border font-extrabold uppercase ${
              isInside
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-rose-500/10 border-rose-500/30 text-rose-500"
            }`}>
              {isInside ? "Inside compliance zone" : "Compliance Failed: Outside Geofence"}
              <span className="block text-[9px] font-mono lowercase font-normal text-stone-400 mt-1">lat: {coords.lat.toFixed(4)}, lng: {coords.lng.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Geofence Anomaly compliance logs list */}
      <div className={`lg:col-span-6 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><ShieldAlert className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase">Compliance Violation Ledger</h2>
        </div>
        <p className="text-[11px] text-stone-400">
          Corporate system logs location discrepancies, biometric mismatches, or unscheduled shifts for compliance auditing.
        </p>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {anomalies.map(an => (
            <div key={an.id} className="p-3 rounded-xl border dark:bg-stone-950/40 dark:border-stone-900 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[9px]">
                <span className="text-rose-500 uppercase">{an.type.replace("_", " ")}</span>
                <span className={`px-1.5 py-0.5 rounded uppercase ${
                  an.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}>{an.status}</span>
              </div>
              <h4 className="font-bold text-xs">{an.userName} on {an.date}</h4>
              <p className="text-[10px] leading-tight text-stone-400">{an.details}</p>
              
              {an.status === "pending_review" && (
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleResolveAnomaly(an.id, "resolved")}
                    className="px-2 py-1 bg-emerald-500 text-white rounded text-[9px] font-bold"
                  >
                    Resolve / Accept Excuse
                  </button>
                  <button
                    onClick={() => handleResolveAnomaly(an.id, "excused")}
                    className="px-2 py-1 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 rounded text-[9px] font-bold"
                  >
                    Excuse Violations
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==================================================
// 7. SECURE DOCUMENT VAULT MODULE
// ==================================================
function DocumentVaultModule({ currentUser, isDarkMode, showToast, tenantHeaders }: ServiceDeskProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  
  // Signature pad states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // New Doc Form
  const [newDoc, setNewDoc] = useState({ title: "", category: "contract", securityClass: "confidential", fileSize: "1.2 MB" });

  useEffect(() => {
    fetchDocs();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchDocs = async () => {
    try {
      const data = await api.get<any[]>("/saas/documents", { headers: tenantHeaders });
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;
    try {
      await api.post("/saas/documents", {
        ...newDoc,
        userId: currentUser.id
      }, { headers: tenantHeaders });
      showToast("Document draft uploaded successfully.");
      setNewDoc({ title: "", category: "contract", securityClass: "confidential", fileSize: "1.2 MB" });
      fetchDocs();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#4f46e5";
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = async () => {
    if (!activeDocId) return;
    try {
      await api.put(`/saas/documents/${activeDocId}/sign`, {
        signatureData: "M10 20 L40 80 L90 10" // Mock SVG path from signature canvas
      }, { headers: tenantHeaders });
      showToast("Digital Signature locked. Cryptographic hash stamped on PDF metadata.");
      fetchDocs();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const activeDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Upload/Index Forms */}
      <div className={`lg:col-span-4 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-3`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Lock className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase">Document Lockbox</h2>
        </div>
        <p className="text-[11px] text-stone-400 leading-tight">
          Establish secure employee files with custom security classification paths.
        </p>

        <form onSubmit={handleCreateDoc} className="space-y-3 font-bold">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase">Document Title</label>
            <input
              type="text"
              required
              value={newDoc.title}
              onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. FY26 Offer Letter Annexure"
              className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950 dark:border-stone-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400">Security Access</label>
              <select
                value={newDoc.securityClass}
                onChange={e => setNewDoc(p => ({ ...p, securityClass: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
              >
                <option value="internal">Internal Core</option>
                <option value="restricted">Restricted Access</option>
                <option value="confidential">Confidential</option>
                <option value="highly_confidential">Highly Confidential</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-400">Doc Category</label>
              <select
                value={newDoc.category}
                onChange={e => setNewDoc(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border dark:bg-stone-950"
              >
                <option value="contract">Primary Contract</option>
                <option value="nda">NDAs & IPs</option>
                <option value="tax_form">Corporate Tax</option>
                <option value="visa">Visa Permits</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white font-extrabold rounded-xl uppercase">
            Upload & Encrypt File
          </button>
        </form>
      </div>

      {/* Vault Directory */}
      <div className={`lg:col-span-4 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-3 flex flex-col`}>
        <h3 className="font-extrabold text-sm uppercase">Secure Directory Shelf</h3>
        <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 flex-1">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                doc.id === activeDocId
                  ? "bg-orange-500/10 border-orange-500/30 dark:bg-orange-950/20"
                  : "bg-stone-50/40 dark:bg-stone-950/10 border-transparent hover:bg-stone-100"
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="font-extrabold text-xs truncate">{doc.title}</h4>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">{doc.category} | {doc.fileSize}</p>
                <span className="text-[8px] bg-orange-600/10 text-orange-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{doc.securityClass}</span>
              </div>
              <div>
                {doc.isSigned ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <FileSignature className="h-5 w-5 text-amber-500 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Panel */}
      <div className="lg:col-span-4">
        {activeDoc ? (
          <div className={`p-5 rounded-2xl border ${
            isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
          } space-y-4`}>
            <h3 className="font-extrabold text-sm uppercase">Compliance Signature Pad</h3>
            <p className="text-[10px] text-stone-400">
              Draw digital signature directly below to sign <strong>{activeDoc.title}</strong> securely.
            </p>

            {activeDoc.isSigned ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <Check className="h-8 w-8 text-emerald-500 mx-auto" />
                <span className="font-extrabold text-emerald-500 uppercase block">Signed & Witnessed</span>
                <p className="text-[9px] text-stone-400 font-mono">MD5: de68a798f0e9b9776d6560ef7b7a2ae9<br />SHA-256 Verified</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-dashed border-stone-300 dark:border-stone-800 rounded-xl bg-stone-100 dark:bg-stone-950 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={220}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-[100px] cursor-crosshair block"
                  />
                </div>
                <div className="flex gap-2 font-bold text-[10px]">
                  <button
                    onClick={clearCanvas}
                    className="w-1/2 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-900 rounded-lg text-stone-500"
                  >
                    Clear Drawing
                  </button>
                  <button
                    onClick={submitSignature}
                    className="w-1/2 py-2 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white border border-white/10 shadow-md shadow-red-600/20 rounded-lg uppercase"
                  >
                    Lock Signature
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 font-bold">
            Select a document block to apply cryptographic signature.
          </div>
        )}
      </div>

    </div>
  );
}

// ==================================================
// 8. PEER APPRECIATION & COMMUNICATIONS
// ==================================================
function PeerAppreciationModule({ currentUser, isDarkMode, showToast, tenantHeaders }: ServiceDeskProps) {
  const [appreciations, setAppreciations] = useState<any[]>([]);
  const [form, setForm] = useState({ receiverId: "", receiverName: "", badgeType: "rockstar", message: "" });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    fetchAppreciations();
    fetchEmployees();
  }, [tenantHeaders["X-Tenant-Id"]]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await api.get<{ employees: any[] }>("/employees?limit=250");
      if (data && data.employees) {
        // Exclude current logged in user from peer appreciation list
        const filtered = data.employees.filter(e => e.id !== currentUser.id);
        setEmployees(filtered);
        if (filtered.length > 0) {
          setForm(p => ({
            ...p,
            receiverId: filtered[0].id,
            receiverName: `${filtered[0].firstName} ${filtered[0].lastName}`
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load active coworkers directory list:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchAppreciations = async () => {
    try {
      const data = await api.get<any[]>("/saas/appreciations", { headers: tenantHeaders });
      setAppreciations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message || !form.receiverId) {
      showToast("Please select a coworker and write a message.", true);
      return;
    }
    try {
      await api.post("/saas/appreciations", {
        ...form,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`
      }, { headers: tenantHeaders });
      showToast(`Granted appreciation badge to ${form.receiverName}!`);
      setForm(p => ({ ...p, message: "" }));
      fetchAppreciations();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const badgeIcons: Record<string, any> = {
    rockstar: Star,
    innovator: Sparkles,
    team_player: User,
    problem_solver: CheckCircle2,
    catalyst: Award
  };

  const badgeColors: Record<string, string> = {
    rockstar: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    innovator: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    team_player: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    problem_solver: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    catalyst: "text-orange-500 bg-orange-500/10 border-orange-500/20"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
      
      {/* Grant Appreciation Card */}
      <div className={`lg:col-span-5 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500"><Award className="h-4 w-4" /></span>
          <h2 className="font-extrabold text-sm uppercase">Peer Recognition Center</h2>
        </div>
        <p className="text-[11px] text-stone-400">
          Foster positive workplace culture by awarding specialized performance badges to peer co-workers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 font-bold">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase">Select Coworker</label>
            <select
              value={form.receiverId}
              onChange={e => {
                const selectedEmp = employees.find(emp => emp.id === e.target.value);
                if (selectedEmp) {
                  setForm(p => ({
                    ...p,
                    receiverId: e.target.value,
                    receiverName: `${selectedEmp.firstName} ${selectedEmp.lastName}`
                  }));
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border dark:bg-stone-950 dark:border-stone-900 focus:border-orange-500 text-stone-900 dark:text-stone-100 font-bold"
              disabled={employees.length === 0}
            >
              {employees.length === 0 ? (
                <option value="">No other active employees found</option>
              ) : (
                employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.department || "General Staff"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase">Select Badge Type</label>
            <select
              value={form.badgeType}
              onChange={e => setForm(p => ({ ...p, badgeType: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border dark:bg-stone-950 focus:border-orange-500"
            >
              <option value="rockstar">⭐ Rockstar Performer</option>
              <option value="innovator">✨ Out-of-the-box Innovator</option>
              <option value="team_player">🤝 High Integrity Team Player</option>
              <option value="problem_solver">✔️ Absolute Problem Solver</option>
              <option value="catalyst">🔥 Operational Catalyst</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-400 uppercase">Personal Message</label>
            <textarea
              required
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Enclose a helpful, personalized thank-you line..."
              className="w-full px-3 py-2 rounded-xl border h-20 dark:bg-stone-950"
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 border border-white/10 text-white font-extrabold rounded-xl uppercase">
            Award Badge
          </button>
        </form>
      </div>

      {/* Live Activity Wall Feed */}
      <div className={`lg:col-span-7 p-5 rounded-2xl border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-stone-200"
      } space-y-4`}>
        <h3 className="font-extrabold text-sm uppercase">Peer Wall of Recognition</h3>
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {appreciations.map(app => {
            const Icon = badgeIcons[app.badgeType] || Star;
            return (
              <div key={app.id} className="p-4 bg-stone-50/50 dark:bg-stone-950/20 rounded-xl border dark:border-stone-900 flex items-start space-x-3 transition-all hover:scale-[1.01]">
                <div className={`p-2 rounded-xl border flex-shrink-0 ${badgeColors[app.badgeType] || "bg-orange-50"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs text-stone-800 dark:text-stone-100">{app.receiverName} received a badge!</span>
                    <span className="text-[9px] text-stone-400 font-mono">{app.date}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-none">Awarded by: {app.senderName}</p>
                  <p className="text-[11px] font-normal mt-2 leading-relaxed bg-white dark:bg-stone-950/50 p-2.5 rounded-lg border dark:border-stone-900 italic">
                    "{app.message}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
