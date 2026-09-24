import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Layers,
  Laptop,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Trash2,
  Plus,
  Loader2,
  User,
  Search,
  Filter,
  X,
  FileText,
  Bookmark,
  QrCode,
  Camera
} from "lucide-react";
import { api } from "../utils/api";
import { Asset, User as UserType, AssetStatus } from "../types";
import { Html5Qrcode } from "html5-qrcode";

interface AssetViewProps {
  currentUser: UserType;
  isDarkMode: boolean;
}

export default function AssetView({ currentUser, isDarkMode }: AssetViewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters parameters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // QR Scanner & Tag Modal states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [scanUpdateSuccess, setScanUpdateSuccess] = useState<string | null>(null);
  const [showQrTagModal, setShowQrTagModal] = useState<Asset | null>(null);

  // Quick update form fields
  const [updateFields, setUpdateFields] = useState({
    status: "Available" as AssetStatus,
    location: "",
    notes: "",
    assignedToUserId: ""
  });

  // Modals and action parameters
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Selection states
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");

  // Create Form fields
  const [addFields, setAddFields] = useState({
    name: "",
    category: "Laptop",
    serialNumber: "",
    value: 1200,
    status: "Available" as AssetStatus,
  });

  // Maintenance tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"inventory" | "tickets">("inventory");
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolvingTicket, setIsResolvingTicket] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Ticket Modal States
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedAssetForTicket, setSelectedAssetForTicket] = useState<Asset | null>(null);
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSeverity, setTicketSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [ticketNotes, setTicketNotes] = useState("");
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    fetchAssets();
    if (currentUser.role === "admin") {
      fetchEmployees();
      fetchTickets();
    }
  }, []);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await api.get<any[]>("/maintenance-tickets");
      setTickets(data);
    } catch (err) {
      console.error("Failed to load maintenance tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Asset[]>("/assets");
      setAssets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load corporate asset register.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.get<{ employees: UserType[] }>("/employees?limit=100");
      setEmployees(data.employees);
    } catch (err) {
      console.error("Failed to query employee list", err);
    }
  };

  // QR Scanner initialization and stream hook
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let isActive = true;

    if (showScanModal && !scannedAsset) {
      setScanning(true);
      setScanError(null);

      const timer = setTimeout(() => {
        if (!isActive) return;
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.error("qr-reader element not found in DOM");
          return;
        }

        try {
          html5Qrcode = new Html5Qrcode("qr-reader");
          html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              if (isActive) {
                handleScanSuccess(decodedText, html5Qrcode!);
              }
            },
            (errorMessage) => {
              // Standard frame scanning logs can be muted
            }
          ).catch(err => {
            if (isActive) {
              console.error("Camera startup failed:", err);
              setScanError("Could not access camera. Please verify permissions or check camera availability.");
              setScanning(false);
            }
          });
        } catch (e: any) {
          if (isActive) {
            setScanError(e.message || "Failed to initialize camera scanner.");
            setScanning(false);
          }
        }
      }, 200);

      return () => {
        isActive = false;
        clearTimeout(timer);
        if (html5Qrcode && html5Qrcode.isScanning) {
          html5Qrcode.stop().catch(err => console.error("Failed to stop scanner on cleanup:", err));
        }
      };
    }
  }, [showScanModal, !!scannedAsset]);

  const handleScanSuccess = async (decodedText: string, qrScanner: Html5Qrcode) => {
    setScanning(false);
    try {
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }
    } catch (e) {
      console.error("Failed to stop scanner on success:", e);
    }

    const trimmed = decodedText.trim();
    // Look up in assets
    let found = assets.find(a => a.assetId.toLowerCase() === trimmed.toLowerCase() || a.serialNumber?.toLowerCase() === trimmed.toLowerCase());
    
    if (!found) {
      const match = trimmed.match(/AST-\d{4}-\d+/i);
      if (match) {
        const extracted = match[0];
        found = assets.find(a => a.assetId.toLowerCase() === extracted.toLowerCase());
      }
    }

    if (found) {
      setScannedAsset(found);
      setUpdateFields({
        status: found.status,
        location: found.location || "",
        notes: "",
        assignedToUserId: found.assignedToUserId || ""
      });
    } else {
      setScanError(`Asset tag "${trimmed}" not recognized in system registers.`);
    }
  };

  const handleScanUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await api.put<Asset>(`/assets/${scannedAsset.id}/quick-update`, updateFields);
      setScanUpdateSuccess("Asset successfully updated!");
      
      // Update local state list
      setAssets(prev => prev.map(a => a.id === scannedAsset.id ? { ...a, ...updated } : a));
      
      setTimeout(() => {
        setScanUpdateSuccess(null);
        setShowScanModal(false);
        setScannedAsset(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to update asset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await api.post("/assets", addFields);
      setFormSuccess("Hardware asset successfully logged into corporate registers!");
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        setAddFields({
          name: "",
          category: "Laptop",
          serialNumber: "",
          value: 1200,
          status: "Available"
        });
        fetchAssets();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to log asset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/assign`, { userId: targetEmployeeId });
      setFormSuccess("Hardware asset successfully assigned to selected employee!");
      setTimeout(() => {
        setShowAssignModal(false);
        setFormSuccess(null);
        setTargetEmployeeId("");
        setSelectedAsset(null);
        fetchAssets();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Assignment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (id: string) => {
    if (!window.confirm("Are you sure you want to reclaim this asset into available inventory?")) return;
    try {
      await api.post(`/assets/${id}/unassign`, {});
      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssetStatus) => {
    try {
      await api.put(`/assets/${id}/status`, { status: newStatus });
      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("DANGER: This will permanently delete the hardware record. Proceed?")) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReportIssue = (id: string) => {
    const assetObj = assets.find(a => a.id === id);
    if (!assetObj) return;
    setSelectedAssetForTicket(assetObj);
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

      alert(`Damage report submitted successfully. Related asset ${selectedAssetForTicket.name} status updated.`);
      setIsTicketModalOpen(false);
      
      // Reset form
      setTicketDescription("");
      setTicketSeverity("Medium");
      setTicketNotes("");
      
      fetchAssets();
      if (currentUser.role === "admin") {
        fetchTickets();
      }
    } catch (err: any) {
      setTicketError(err.error || err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setResolveError("Resolution notes are required.");
      return;
    }
    if (!selectedTicketForResolve) return;

    setIsResolvingTicket(true);
    setResolveError(null);
    try {
      await api.post(`/maintenance-tickets/${selectedTicketForResolve.ticketId}/resolve`, {
        resolutionNotes: resolutionNotes.trim()
      });
      setSelectedTicketForResolve(null);
      setResolutionNotes("");
      alert("Ticket successfully resolved!");
      fetchTickets();
      fetchAssets();
    } catch (err: any) {
      setResolveError(err.message || "Failed to resolve ticket.");
    } finally {
      setIsResolvingTicket(false);
    }
  };

  // Filters calculation
  const filteredAssets = assets.filter(ast => {
    const matchesSearch =
      ast.name.toLowerCase().includes(search.toLowerCase()) ||
      (ast.serialNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (ast.assignedUserName || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "" || ast.status === statusFilter;
    const matchesCategory = categoryFilter === "" || ast.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Split into Assigned to Current User vs All Corporate assets
  const employeeAssignedAssets = assets.filter(a => a.assignedToUserId === currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">IT Hardware & Asset Ledger</h1>
          <p className="text-xs text-stone-500 font-semibold mt-1">Audit company workstations, laptops, monitors, software licenses, or file support tickets.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-stretch sm:self-auto">
          {(currentUser.role === "admin" || currentUser.role === "manager") && (
            <button
              onClick={() => {
                setScanError(null);
                setScanUpdateSuccess(null);
                setScannedAsset(null);
                setShowScanModal(true);
              }}
              className="p-3 px-5 bg-white/5 hover:bg-white/10 text-white rounded-xl shadow-inner border border-white/10 text-[11px] font-extrabold uppercase tracking-widest flex items-center space-x-2 justify-center transition-all hover:scale-105 active:scale-95"
              id="scan-qr-trigger"
            >
              <QrCode className="h-4.5 w-4.5 text-red-400 drop-shadow" />
              <span className="drop-shadow">Scan QR Code</span>
            </button>
          )}
          {currentUser.role === "admin" && (
            <button
              onClick={() => { setFormError(null); setFormSuccess(null); setShowAddModal(true); }}
              className="p-3 px-5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 border border-white/10 text-[11px] font-extrabold uppercase tracking-widest flex items-center space-x-2 justify-center transition-all hover:scale-105 active:scale-95"
              id="register-asset-trigger"
            >
              <Plus className="h-4.5 w-4.5 drop-shadow" />
              <span className="drop-shadow">Register IT Hardware</span>
            </button>
          )}
        </div>
      </div>

      {/* CONDITIONAL SUB-VIEW: WORKSTATIONS ASSIGNED TO THE LOGGED IN USER */}
      {currentUser.role === "employee" && (
        <div className="space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400 flex items-center">
            <Laptop className="h-4.5 w-4.5 text-orange-500 mr-2" />
            <span>Your Assigned Workstations & Accessories</span>
          </h3>

          {employeeAssignedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employeeAssignedAssets.map(ast => (
                <div key={ast.id} className="p-5 rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between min-h-[160px] text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="p-1 px-2 text-[10px] bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-md font-bold">{ast.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ast.status === "Assigned"
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                          : "text-amber-600 bg-amber-50 dark:bg-amber-950/20"
                      }`}>{ast.status}</span>
                    </div>
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm mt-1">{ast.name}</h4>
                    <p className="text-[10px] text-stone-400">S/N: <span className="font-mono">{ast.serialNumber}</span> | Insured: ${ast.value}</p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4">
                    <button
                      onClick={() => handleReportIssue(ast.id)}
                      className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Report Damage / File Ticket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed rounded-xl text-center text-stone-400 text-xs">
              No hardware workstations currently allocated to your account. Reach out to the IT Helpdesk if you require a laptop or monitor.
            </div>
          )}
        </div>
      )}

      {/* MASTER INVENTORY TABLE (Visible for managers or admins) */}
      {(currentUser.role !== "employee" || employeeAssignedAssets.length === 0) && (
        <div className="space-y-4">
          {currentUser.role === "admin" && (
            <div className="flex border-b border-stone-200 dark:border-stone-800 mb-2">
              <button
                onClick={() => setActiveSubTab("inventory")}
                className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                  activeSubTab === "inventory"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                }`}
              >
                Inventory Directory
              </button>
              <button
                onClick={() => setActiveSubTab("tickets")}
                className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeSubTab === "tickets"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                }`}
              >
                <span>Reported Damage Tickets</span>
                {tickets.filter(t => t.status === "Pending").length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded-full font-bold animate-pulse">
                    {tickets.filter(t => t.status === "Pending").length}
                  </span>
                )}
              </button>
            </div>
          )}

          {activeSubTab === "inventory" ? (
            <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-stone-500 flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              <span>Company Hardware Assets Inventory</span>
            </span>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search S/N, asset, assignee..."
                  className="pl-8 pr-3 py-1.5 w-40 sm:w-48 rounded border dark:bg-stone-950 dark:border-stone-800 focus:outline-none"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="p-1.5 rounded border dark:bg-stone-950 dark:border-stone-800 font-semibold"
              >
                <option value="">All Categories</option>
                <option value="Laptop">Laptops</option>
                <option value="Monitor">Monitors</option>
                <option value="Mobile">Mobile Devices</option>
                <option value="Network">Network Hardware</option>
                <option value="Accessory">Workstation Accessories</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-1.5 rounded border dark:bg-stone-950 dark:border-stone-800 font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned Only</option>
                <option value="UnderRepair">Under Repair</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          {/* TABLE LOGS */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-xs text-stone-500 font-medium mt-2">Loading asset logs...</p>
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950 text-stone-400 border-b border-stone-200 dark:border-stone-800 font-semibold uppercase tracking-wider">
                    <th className="p-4 font-extrabold">IT Asset Name</th>
                    <th className="p-4 font-extrabold">Category</th>
                    <th className="p-4 font-extrabold">Serial Number (S/N)</th>
                    <th className="p-4 font-extrabold">Book Value</th>
                    <th className="p-4 font-extrabold">Location</th>
                    <th className="p-4 font-extrabold">Current Holder</th>
                    <th className="p-4 font-extrabold">Status</th>
                    {currentUser.role === "admin" && <th className="p-4 font-extrabold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(ast => (
                    <tr key={ast.id} className="border-b border-stone-100 dark:border-stone-900 hover:bg-stone-50/50 dark:hover:bg-stone-950/60 transition-colors">
                      <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center space-x-2">
                          <span>{ast.name}</span>
                          <button
                            onClick={() => setShowQrTagModal(ast)}
                            className="p-1 text-stone-400 hover:text-orange-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                            title="View printable QR code tag"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">{ast.assetId}</div>
                      </td>
                      <td className="p-4">
                        <span className="p-1 px-2 bg-stone-100 dark:bg-stone-900 text-[10px] font-bold rounded-md">{ast.category}</span>
                      </td>
                      <td className="p-4 font-mono text-stone-500">{ast.serialNumber}</td>
                      <td className="p-4 font-bold">${ast.value}</td>
                      <td className="p-4 text-stone-600 dark:text-stone-300 font-medium">
                        {ast.location || <span className="text-stone-400 text-[11px] italic">Not set</span>}
                      </td>
                      <td className="p-4 text-stone-700 dark:text-stone-300">
                        {ast.assignedToUserId && ast.assignedUserName && ast.assignedUserName !== "Unassigned" ? (
                          <div className="flex items-center space-x-1">
                            <User className="h-3.5 w-3.5 text-orange-500" />
                            <span className="font-semibold">{ast.assignedUserName}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 font-medium">Unallocated (In stock)</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          ast.status === "Available"
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : ast.status === "Assigned"
                            ? "text-orange-600 bg-orange-50 dark:bg-orange-950/40"
                            : ast.status === "UnderRepair"
                            ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                            : "text-stone-500 bg-stone-100 dark:bg-stone-900"
                        }`}>
                          {ast.status}
                        </span>
                      </td>
                      {currentUser.role === "admin" && (
                        <td className="p-4 space-x-1">
                          {ast.status === "Available" ? (
                            <button
                              onClick={() => { setSelectedAsset(ast); setTargetEmployeeId(""); setFormError(null); setShowAssignModal(true); }}
                              className="px-2 py-1 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow uppercase tracking-wide"
                              id={`assign-btn-${ast.id}`}
                            >
                              Assign Holder
                            </button>
                          ) : ast.status === "Assigned" ? (
                            <button
                              onClick={() => handleUnassign(ast.id)}
                              className="px-2 py-1 text-[10px] font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-300 rounded-md border uppercase tracking-wide"
                              id={`reclaim-btn-${ast.id}`}
                            >
                              Reclaim to Stock
                            </button>
                          ) : null}

                          <select
                            value={ast.status}
                            onChange={e => handleStatusChange(ast.id, e.target.value as AssetStatus)}
                            className="p-1 text-[10px] font-semibold border rounded dark:bg-stone-950 dark:border-stone-800"
                          >
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="UnderRepair">Under Repair</option>
                            <option value="Retired">Retired</option>
                          </select>

                          <button
                            onClick={() => handleDelete(ast.id)}
                            className="p-1 hover:bg-red-50 text-red-500 dark:hover:bg-red-950/40 rounded inline-block"
                            title="Delete Asset permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400">No hardware assets logged on ledger match current criteria.</div>
          )}
        </div>
          ) : (
            <div className="rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden animate-fadeIn text-xs">
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-between items-center">
                <span className="font-extrabold text-xs uppercase tracking-wider text-stone-500 flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-red-500" />
                  <span>Reported Damage & Maintenance Tickets</span>
                </span>
                <span className="text-[10px] text-stone-400 font-bold uppercase">
                  {tickets.length} Tickets Registered
                </span>
              </div>

              {loadingTickets ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                  <p className="text-xs text-stone-500 font-medium mt-2">Loading ticket registers...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center text-stone-400 font-bold">
                  No hardware damage or maintenance tickets have been submitted.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 dark:bg-stone-950 text-stone-400 border-b border-stone-200 dark:border-stone-800 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Ticket ID</th>
                        <th className="p-4">Asset</th>
                        <th className="p-4">Reported By</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Date Filed</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium text-stone-700 dark:text-stone-300">
                      {tickets.map((t) => (
                        <tr key={t.ticketId} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/20">
                          <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">{t.ticketId}</td>
                          <td className="p-4">
                            <div className="font-bold text-stone-900 dark:text-stone-100">{t.assetName}</div>
                            <div className="text-[10px] text-stone-400 font-mono">ID: {t.assetId}</div>
                          </td>
                          <td className="p-4">{t.reportedByName}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                              t.severity === "Critical"
                                ? "text-red-700 bg-red-100 dark:bg-red-950/30"
                                : t.severity === "High"
                                ? "text-orange-700 bg-orange-100 dark:bg-orange-950/30"
                                : t.severity === "Medium"
                                ? "text-amber-700 bg-amber-100 dark:bg-amber-950/30"
                                : "text-stone-600 bg-stone-100 dark:bg-stone-800"
                            }`}>
                              {t.severity}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs truncate" title={t.description}>{t.description}</td>
                          <td className="p-4 text-stone-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                              t.status === "Pending"
                                ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20 animate-pulse"
                                : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {t.status === "Pending" ? (
                              <button
                                onClick={() => {
                                  setSelectedTicketForResolve(t);
                                  setResolutionNotes("");
                                  setResolveError(null);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] shadow-sm cursor-pointer transition-colors"
                              >
                                Resolve
                              </button>
                            ) : (
                              <div className="text-[10px] text-stone-400 font-semibold" title={`Resolved by ${t.resolvedBy} on ${new Date(t.resolvedAt).toLocaleString()}`}>
                                Resolved
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE / REGISTER IT HARDWARE */}
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

            <h3 className="text-lg font-extrabold mb-1">Log IT Hardware Asset</h3>
            <p className="text-xs text-stone-500 mb-6 font-medium">Add a workstation, accessory, or software subscription into active inventory.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-400 mb-1">Asset Display Name *</label>
                <input
                  required
                  value={addFields.name}
                  onChange={e => setAddFields({ ...addFields, name: e.target.value })}
                  placeholder="MacBook Pro M3 Max (16-inch, 32GB)"
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Category *</label>
                  <select
                    value={addFields.category}
                    onChange={e => setAddFields({ ...addFields, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  >
                    <option value="Laptop">Laptop Workstation</option>
                    <option value="Monitor">Monitor Display</option>
                    <option value="Mobile">Mobile Device</option>
                    <option value="Network">Network Hardware</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Book Value ($ USD) *</label>
                  <input
                    required
                    type="number"
                    value={addFields.value}
                    onChange={e => setAddFields({ ...addFields, value: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Serial Number (S/N) *</label>
                <input
                  required
                  value={addFields.serialNumber}
                  onChange={e => setAddFields({ ...addFields, serialNumber: e.target.value })}
                  placeholder="e.g. C02F87X8Q05D"
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="register-asset-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Register Hardware into Stock</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ASSIGN HOLDER */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => { setShowAssignModal(false); setSelectedAsset(null); }}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold mb-1">Assign Hardware Asset Holder</h3>
            <p className="text-xs text-stone-500 mb-6 font-medium">Reclaim or allocate "{selectedAsset.name}" directly to a validated employee.</p>

            {formError && <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4">{formSuccess}</div>}

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-400 mb-1">Select Employee Holder *</label>
                <select
                  required
                  value={targetEmployeeId}
                  onChange={e => setTargetEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                >
                  <option value="">Select corporate employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.jobTitle})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 space-y-1.5 text-stone-500">
                <p className="flex justify-between"><span>Asset:</span> <span className="font-bold text-stone-700 dark:text-stone-300">{selectedAsset.name}</span></p>
                <p className="flex justify-between"><span>S/N:</span> <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{selectedAsset.serialNumber}</span></p>
              </div>

              <button
                type="submit"
                disabled={submitting || !targetEmployeeId}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs"
                id="assign-asset-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Transmit Hardware Custody</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: QR SCANNER & ASSET QUICK STATUS UPDATER */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}
          >
            <button
              onClick={() => {
                setShowScanModal(false);
                setScannedAsset(null);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Asset QR Scanner</h3>
                <p className="text-[11px] text-stone-500">Scan physical barcode tags using your camera to modify custody, status, or location.</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-100/10 border border-red-500/20 rounded text-xs text-red-500 mb-4 font-semibold">
                {formError}
              </div>
            )}
            {scanUpdateSuccess && (
              <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 rounded text-xs text-emerald-500 mb-4 font-semibold">
                {scanUpdateSuccess}
              </div>
            )}

            {/* SCANNING PHASE */}
            {!scannedAsset && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex flex-col items-center justify-center">
                  <div id="qr-reader" className="w-full h-full" />
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-stone-950/20 pointer-events-none flex flex-col items-center justify-center">
                      <div className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-[bounce_3s_infinite] top-1/4" />
                      <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest bg-stone-950/80 px-3 py-1 rounded-full mt-32">
                        Camera Stream Live...
                      </p>
                    </div>
                  )}

                  {scanError && (
                    <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <AlertTriangle className="h-10 w-10 text-amber-500" />
                      <p className="text-xs font-bold text-stone-200">{scanError}</p>
                      <button
                        onClick={() => {
                          setScanError(null);
                          setScanning(true);
                        }}
                        className="p-2 px-4 bg-orange-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-orange-700"
                      >
                        Retry Scan
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200 dark:border-stone-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 block">Manual Lookup Override</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Asset ID or Serial Number..."
                      className="flex-1 p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-xs font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            handleScanSuccess(val, { isScanning: false, stop: async () => {} } as any);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        if (input.value) {
                          handleScanSuccess(input.value, { isScanning: false, stop: async () => {} } as any);
                        }
                      }}
                      className="px-4 bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold rounded-lg text-xs uppercase"
                    >
                      Locate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* RESULTS & UPDATE PHASE */}
            {scannedAsset && (
              <form onSubmit={handleScanUpdateSubmit} className="space-y-4 font-semibold text-xs">
                <div className="p-4 bg-stone-50 dark:bg-stone-950/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-orange-500">Asset Identified</span>
                  <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">{scannedAsset.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-[11px] text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-900 mt-2">
                    <div>
                      <p>Asset ID: <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{scannedAsset.assetId}</span></p>
                      <p className="mt-1">S/N: <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{scannedAsset.serialNumber || "N/A"}</span></p>
                    </div>
                    <div>
                      <p>Category: <span className="font-bold text-stone-700 dark:text-stone-300">{scannedAsset.category}</span></p>
                      <p className="mt-1">Current Status: <span className="font-bold text-stone-700 dark:text-stone-300">{scannedAsset.status}</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Asset Status *</label>
                    <select
                      value={updateFields.status}
                      onChange={e => setUpdateFields({ ...updateFields, status: e.target.value as AssetStatus })}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    >
                      <option value="Available">Available (In Stock)</option>
                      <option value="Assigned">Assigned (In Use)</option>
                      <option value="UnderRepair">Under Repair</option>
                      <option value="Retired">Retired / Out of Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Holder / Custody Assignee</label>
                    <select
                      value={updateFields.assignedToUserId}
                      onChange={e => setUpdateFields({ ...updateFields, assignedToUserId: e.target.value })}
                      className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                    >
                      <option value="">Keep Unallocated (In stock)</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.jobTitle})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Current Physical Location</label>
                  <input
                    value={updateFields.location}
                    onChange={e => setUpdateFields({ ...updateFields, location: e.target.value })}
                    placeholder="e.g. Server Room 3B, Chicago HQ, Home Office"
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Audit Log Comments / Repair Notes</label>
                  <textarea
                    value={updateFields.notes}
                    onChange={e => setUpdateFields({ ...updateFields, notes: e.target.value })}
                    placeholder="Brief description of relocation, check-in reason, or service ticket info..."
                    className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-sm h-16 resize-none"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setScannedAsset(null)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold rounded-xl uppercase text-xs"
                  >
                    Rescan Tag
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-1 disabled:opacity-50 text-xs"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    <span>Save Update</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* MODAL: VIEW PRINTABLE QR TAG */}
      {showQrTagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}
          >
            <button
              onClick={() => setShowQrTagModal(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full inline-block">
                Corporate Asset Tag
              </span>
              
              <h3 className="text-base font-extrabold">{showQrTagModal.name}</h3>
              
              <div className="p-4 bg-white rounded-xl border inline-block shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(showQrTagModal.assetId)}`}
                  alt="Asset QR Barcode"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1.5 text-xs text-stone-500">
                <p className="font-mono text-sm font-bold text-stone-800 dark:text-stone-200">{showQrTagModal.assetId}</p>
                <p>S/N: <span className="font-mono font-bold">{showQrTagModal.serialNumber || "N/A"}</span></p>
                <p className="text-[11px] italic">Print and affix this tag directly to company workstations or devices for barcode auditing.</p>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold rounded-xl uppercase text-xs"
              >
                Print Label Tag
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: RESOLVE TICKET */}
      {selectedTicketForResolve && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-stone-800 dark:text-stone-100">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}
          >
            <button
              onClick={() => setSelectedTicketForResolve(null)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full cursor-pointer text-stone-400 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-500 mb-4 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
              <span>Resolve Maintenance Ticket</span>
            </h3>

            <div className="mb-4 p-3 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1">
              <p><strong>Ticket ID:</strong> <span className="font-mono">{selectedTicketForResolve.ticketId}</span></p>
              <p><strong>Asset:</strong> {selectedTicketForResolve.assetName}</p>
              <p><strong>Reported By:</strong> {selectedTicketForResolve.reportedByName}</p>
              <p><strong>Description:</strong> {selectedTicketForResolve.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {resolveError && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                  {resolveError}
                </div>
              )}

              <div className="text-xs">
                <label className="block text-stone-500 font-bold uppercase mb-1">Resolution Actions / Notes</label>
                <textarea
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the actions taken to repair or inspect the hardware asset..."
                  className="w-full p-2.5 rounded-lg border dark:bg-stone-950 dark:border-stone-800 text-xs h-24 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500 bg-transparent"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForResolve(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold rounded-xl uppercase text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingTicket}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs cursor-pointer transition-colors"
                >
                  {isResolvingTicket && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Mark Resolved</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isTicketModalOpen && selectedAssetForTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-scaleIn text-xs">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
              <div>
                <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Report Damage / File Ticket</h4>
                <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Asset: {selectedAssetForTicket.name} ({selectedAssetForTicket.assetId || selectedAssetForTicket.serialNumber})</p>
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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1 disabled:opacity-50"
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
