import fs from "fs";
import path from "path";

const SAAS_DB_PATH = path.resolve(process.cwd(), "saas_db.json");

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  brandingColor: string; // Hex color
  plan: "standard" | "growth" | "enterprise";
  dateCreated: string;
  status: "active" | "suspended";
}

export interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "approval" | "action";
  title: string;
  description: string;
  assigneeRole?: string;
  slaHours?: number;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  triggerType: "leave_request" | "asset_allocation" | "reimbursement" | "it_ticket";
  nodes: WorkflowNode[];
  isActive: boolean;
  dateCreated: string;
}

export interface LifecycleStep {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  type: "onboarding" | "offboarding" | "promotion";
  stepName: string;
  isCompleted: boolean;
  dueDate: string;
  notes: string;
}

export interface AssetProcurement {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  quantity: number;
  estimatedCost: number;
  vendor: string;
  status: "pending" | "approved" | "rejected" | "ordered" | "delivered";
  requestedBy: string;
  dateRequested: string;
}

export interface ServiceTicket {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: "IT" | "HR" | "Finance" | "Facilities" | "Administration";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdByUserId: string;
  createdByName: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  dateCreated: string;
  slaDeadline: string; // ISO timestamp
  satisfactionRating?: number;
  internalNotes?: string;
  comments: {
    id: string;
    authorName: string;
    content: string;
    date: string;
  }[];
}

export interface SecureDocument {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  category: "contract" | "id_proof" | "nda" | "visa" | "tax_form";
  version: number;
  fileSize: string;
  securityClass: "internal" | "restricted" | "confidential" | "highly_confidential";
  isSigned: boolean;
  signatureData: string | null; // Signature SVG path or initials
  dateCreated: string;
  expiryDate?: string;
}

export interface PeerAppreciation {
  id: string;
  tenantId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  badgeType: "rockstar" | "innovator" | "team_player" | "problem_solver" | "catalyst";
  message: string;
  date: string;
}

export interface AttendanceAnomaly {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  date: string;
  type: "geofence_violation" | "biometric_mismatch" | "late_arrival" | "undertime";
  details: string;
  status: "pending_review" | "resolved" | "excused";
}

export interface SaasDatabase {
  tenants: Tenant[];
  workflows: Workflow[];
  lifecycleSteps: LifecycleStep[];
  procurements: AssetProcurement[];
  tickets: ServiceTicket[];
  documents: SecureDocument[];
  appreciations: PeerAppreciation[];
  anomalies: AttendanceAnomaly[];
}

const INITIAL_SAAS_DB: SaasDatabase = {
  tenants: [],
  workflows: [],
  lifecycleSteps: [],
  procurements: [],
  tickets: [],
  documents: [],
  appreciations: [],
  anomalies: []
};

import { loadState, saveState } from "./mongo.js";

let saasDbState: SaasDatabase | null = null;
export let isSaasDbDirty = false;

export async function initSaasDb() {
  saasDbState = await loadState('saas_db', INITIAL_SAAS_DB);
}

export async function flushSaasDb() {
  if (isSaasDbDirty && saasDbState) {
    await saveState('saas_db', saasDbState);
    isSaasDbDirty = false;
  }
}

function readSaasDb(): SaasDatabase {
  if (!saasDbState) {
    saasDbState = INITIAL_SAAS_DB;
    return INITIAL_SAAS_DB;
  }
  return saasDbState;
}

function writeSaasDb(data: SaasDatabase) {
  saasDbState = data;
  isSaasDbDirty = true;
}

export const saasDb = {
  getTenants: () => readSaasDb().tenants,
  createTenant: (tenant: Omit<Tenant, "id" | "dateCreated" | "status">) => {
    const db = readSaasDb();
    const id = "t-" + Math.random().toString(36).substring(2, 9);
    const newTenant: Tenant = {
      ...tenant,
      id,
      dateCreated: new Date().toISOString().split("T")[0],
      status: "active"
    };
    db.tenants.push(newTenant);
    writeSaasDb(db);
    return newTenant;
  },

  getWorkflows: (tenantId: string) => readSaasDb().workflows.filter(w => w.tenantId === tenantId),
  createWorkflow: (tenantId: string, workflow: Omit<Workflow, "id" | "tenantId" | "dateCreated">) => {
    const db = readSaasDb();
    const id = "wf-" + Math.random().toString(36).substring(2, 9);
    const newWf: Workflow = {
      ...workflow,
      id,
      tenantId,
      dateCreated: new Date().toISOString().split("T")[0]
    };
    db.workflows.push(newWf);
    writeSaasDb(db);
    return newWf;
  },

  getLifecycleSteps: (tenantId: string, userId?: string) => {
    const steps = readSaasDb().lifecycleSteps.filter(s => s.tenantId === tenantId);
    if (userId) return steps.filter(s => s.userId === userId);
    return steps;
  },
  createLifecycleStep: (tenantId: string, step: Omit<LifecycleStep, "id" | "tenantId">) => {
    const db = readSaasDb();
    const id = "lc-" + Math.random().toString(36).substring(2, 9);
    const newStep: LifecycleStep = {
      ...step,
      id,
      tenantId
    };
    db.lifecycleSteps.push(newStep);
    writeSaasDb(db);
    return newStep;
  },
  toggleLifecycleStep: (id: string) => {
    const db = readSaasDb();
    const idx = db.lifecycleSteps.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.lifecycleSteps[idx].isCompleted = !db.lifecycleSteps[idx].isCompleted;
      writeSaasDb(db);
      return db.lifecycleSteps[idx];
    }
    return null;
  },

  getProcurements: (tenantId: string) => readSaasDb().procurements.filter(p => p.tenantId === tenantId),
  createProcurement: (tenantId: string, item: Omit<AssetProcurement, "id" | "tenantId" | "status" | "dateRequested">) => {
    const db = readSaasDb();
    const id = "pr-" + Math.random().toString(36).substring(2, 9);
    const newItem: AssetProcurement = {
      ...item,
      id,
      tenantId,
      status: "pending",
      dateRequested: new Date().toISOString().split("T")[0]
    };
    db.procurements.push(newItem);
    writeSaasDb(db);
    return newItem;
  },
  updateProcurementStatus: (id: string, status: AssetProcurement["status"]) => {
    const db = readSaasDb();
    const idx = db.procurements.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.procurements[idx].status = status;
      writeSaasDb(db);
      return db.procurements[idx];
    }
    return null;
  },

  getTickets: (tenantId: string) => readSaasDb().tickets.filter(t => t.tenantId === tenantId),
  createTicket: (tenantId: string, tkt: Omit<ServiceTicket, "id" | "tenantId" | "status" | "dateCreated" | "comments">) => {
    const db = readSaasDb();
    const id = "tkt-" + Math.floor(1000 + Math.random() * 9000);
    const newTkt: ServiceTicket = {
      ...tkt,
      id: `tkt-${id}`,
      tenantId,
      status: "open",
      dateCreated: new Date().toISOString(),
      comments: []
    };
    db.tickets.push(newTkt);
    writeSaasDb(db);
    return newTkt;
  },
  addTicketComment: (id: string, authorName: string, content: string) => {
    const db = readSaasDb();
    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.tickets[idx].comments.push({
        id: "cmt-" + Math.random().toString(36).substring(2, 9),
        authorName,
        content,
        date: new Date().toISOString()
      });
      writeSaasDb(db);
      return db.tickets[idx];
    }
    return null;
  },
  updateTicketStatus: (id: string, status: ServiceTicket["status"], satisfactionRating?: number) => {
    const db = readSaasDb();
    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.tickets[idx].status = status;
      if (satisfactionRating !== undefined) {
        db.tickets[idx].satisfactionRating = satisfactionRating;
      }
      writeSaasDb(db);
      return db.tickets[idx];
    }
    return null;
  },

  getDocuments: (tenantId: string, userId?: string) => {
    const docs = readSaasDb().documents.filter(d => d.tenantId === tenantId);
    if (userId) return docs.filter(d => d.userId === userId);
    return docs;
  },
  signDocument: (id: string, signatureData: string) => {
    const db = readSaasDb();
    const idx = db.documents.findIndex(d => d.id === id);
    if (idx !== -1) {
      db.documents[idx].isSigned = true;
      db.documents[idx].signatureData = signatureData;
      writeSaasDb(db);
      return db.documents[idx];
    }
    return null;
  },
  createDocument: (tenantId: string, doc: Omit<SecureDocument, "id" | "tenantId" | "isSigned" | "signatureData" | "dateCreated">) => {
    const db = readSaasDb();
    const id = "doc-" + Math.floor(100 + Math.random() * 900);
    const newDoc: SecureDocument = {
      ...doc,
      id,
      tenantId,
      isSigned: false,
      signatureData: null,
      dateCreated: new Date().toISOString().split("T")[0]
    };
    db.documents.push(newDoc);
    writeSaasDb(db);
    return newDoc;
  },

  getAppreciations: (tenantId: string) => readSaasDb().appreciations.filter(a => a.tenantId === tenantId),
  createAppreciation: (tenantId: string, app: Omit<PeerAppreciation, "id" | "tenantId" | "date">) => {
    const db = readSaasDb();
    const id = "app-" + Math.random().toString(36).substring(2, 9);
    const newApp: PeerAppreciation = {
      ...app,
      id,
      tenantId,
      date: new Date().toISOString().split("T")[0]
    };
    db.appreciations.push(newApp);
    writeSaasDb(db);
    return newApp;
  },

  getAnomalies: (tenantId: string, userId?: string) => {
    const list = readSaasDb().anomalies.filter(a => a.tenantId === tenantId);
    if (userId) return list.filter(a => a.userId === userId);
    return list;
  },
  createAnomaly: (tenantId: string, anomaly: Omit<AttendanceAnomaly, "id" | "tenantId" | "status">) => {
    const db = readSaasDb();
    const id = "an-" + Math.random().toString(36).substring(2, 9);
    const newAn: AttendanceAnomaly = {
      ...anomaly,
      id,
      tenantId,
      status: "pending_review"
    };
    db.anomalies.push(newAn);
    writeSaasDb(db);
    return newAn;
  },
  resolveAnomaly: (id: string, status: AttendanceAnomaly["status"]) => {
    const db = readSaasDb();
    const idx = db.anomalies.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.anomalies[idx].status = status;
      writeSaasDb(db);
      return db.anomalies[idx];
    }
    return null;
  }
};
