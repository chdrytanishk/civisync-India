export type UserMode = "shadow" | "guardian";

export interface UserProfile {
  uid: string;
  email: string;
  mode: UserMode;
  username: string;
  points: number;
  streak: number; // in weeks
  badges: string[];
  joinedAt: string;
  lastReportedAt?: string;
}

export type IssueCategory =
  | "pothole"
  | "broken streetlight"
  | "water leakage"
  | "waste"
  | "damaged road"
  | "other";

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus = "Open" | "In Progress" | "Resolved";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ProofChain {
  beforePhotoURL: string;
  afterPhotoURL: string;
  verdict: "GENUINE_FIX" | "FAKE_RESOLUTION";
  confidence: "High" | "Medium" | "Low";
  reason: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  location: LatLng;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  photoURL: string;
  status: IssueStatus;
  reportedBy: string | null; // null if Shadow Mode
  reportedByUsername?: string; // only visible if Guardian Mode
  upvotes: number;
  upvotedBy: string[]; // List of user UIDs who upvoted
  createdAt: string;
  resolvedAt: string | null;
  neighborhoodId: string;
  isRecurring: boolean;
  recurrenceCount: number;
  proofChain?: ProofChain;
}

export interface Resolution {
  issueId: string;
  beforePhotoURL: string;
  afterPhotoURL: string;
  geminiVerdict: "Genuine Fix" | "Rejected";
  verifiedAt: string;
  reason: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  boundaries: LatLng[]; // For overlay boundary simulation
  fixScore: number; // 0-100
  scoreHistory: { date: string; score: number }[];
}

export type HistoryEvent =
  | "reported"
  | "upvoted"
  | "assigned"
  | "resolution_attempted"
  | "verified"
  | "recurred";

export type ActorRole = "citizen" | "authority" | "system";

export interface IssueHistoryLog {
  id: string;
  issueId: string;
  event: HistoryEvent;
  timestamp: string;
  actorRole: ActorRole;
  details?: string;
}
