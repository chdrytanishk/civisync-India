import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  addDoc
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Issue, UserProfile, Resolution, Neighborhood, IssueHistoryLog, LatLng, ProofChain } from "../types";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Seed Data for Local Fallback and Initial Setup
const DEFAULT_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "indiranagar",
    name: "Indiranagar, Bengaluru",
    fixScore: 82,
    boundaries: [
      { lat: 12.9716, lng: 77.6400 },
      { lat: 12.9786, lng: 77.6410 },
      { lat: 12.9750, lng: 77.6480 },
      { lat: 12.9690, lng: 77.6450 },
    ],
    scoreHistory: [
      { date: "May 1", score: 76 },
      { date: "May 15", score: 78 },
      { date: "Jun 1", score: 80 },
      { date: "Jun 15", score: 81 },
      { date: "Jun 23", score: 82 },
    ]
  },
  {
    id: "dwarka",
    name: "Dwarka Sector 10, Delhi",
    fixScore: 54,
    boundaries: [
      { lat: 28.5800, lng: 77.0500 },
      { lat: 28.5880, lng: 77.0520 },
      { lat: 28.5840, lng: 77.0600 },
      { lat: 28.5760, lng: 77.0580 },
    ],
    scoreHistory: [
      { date: "May 1", score: 62 },
      { date: "May 15", score: 59 },
      { date: "Jun 1", score: 55 },
      { date: "Jun 15", score: 53 },
      { date: "Jun 23", score: 54 },
    ]
  },
  {
    id: "andheri",
    name: "Andheri West, Mumbai",
    fixScore: 68,
    boundaries: [
      { lat: 19.1136, lng: 72.8300 },
      { lat: 19.1216, lng: 72.8310 },
      { lat: 19.1180, lng: 72.8380 },
      { lat: 19.1100, lng: 72.8350 },
    ],
    scoreHistory: [
      { date: "May 1", score: 70 },
      { date: "May 15", score: 69 },
      { date: "Jun 1", score: 67 },
      { date: "Jun 15", score: 68 },
      { date: "Jun 23", score: 68 },
    ]
  },
  {
    id: "saket",
    name: "Saket, Delhi",
    fixScore: 75,
    boundaries: [
      { lat: 28.5200, lng: 77.2100 },
      { lat: 28.5280, lng: 77.2120 },
      { lat: 28.5240, lng: 77.2200 },
      { lat: 28.5160, lng: 77.2180 },
    ],
    scoreHistory: [
      { date: "May 1", score: 72 },
      { date: "May 15", score: 73 },
      { date: "Jun 1", score: 74 },
      { date: "Jun 15", score: 75 },
      { date: "Jun 23", score: 75 },
    ]
  },
  {
    id: "saltlake",
    name: "Salt Lake Sector V, Kolkata",
    fixScore: 89,
    boundaries: [
      { lat: 22.5726, lng: 88.4330 },
      { lat: 22.5806, lng: 88.4340 },
      { lat: 22.5770, lng: 88.4410 },
      { lat: 22.5690, lng: 88.4380 },
    ],
    scoreHistory: [
      { date: "May 1", score: 85 },
      { date: "May 15", score: 87 },
      { date: "Jun 1", score: 88 },
      { date: "Jun 15", score: 89 },
      { date: "Jun 23", score: 89 },
    ]
  }
];

const DEFAULT_ISSUES: Issue[] = [
  {
    id: "issue1",
    location: { lat: 12.9730, lng: 77.6420 },
    category: "pothole",
    severity: "High",
    description: "Huge pothole near the main crossing. Extremely dangerous during rain. Multiple vehicles damaged.",
    photoURL: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    status: "Open",
    reportedBy: "guardian1",
    reportedByUsername: "RahulS",
    upvotes: 14,
    upvotedBy: ["uid_example_2", "uid_example_3"],
    createdAt: "2026-06-18T10:00:00.000Z",
    resolvedAt: null,
    neighborhoodId: "indiranagar",
    isRecurring: false,
    recurrenceCount: 0
  },
  {
    id: "issue2",
    location: { lat: 12.9755, lng: 77.6445 },
    category: "broken streetlight",
    severity: "Medium",
    description: "Streetlight not working for the last 5 days. Street is completely dark and unsafe for women at night.",
    photoURL: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=600",
    status: "In Progress",
    reportedBy: "guardian1",
    reportedByUsername: "RahulS",
    upvotes: 8,
    upvotedBy: ["uid_example_3"],
    createdAt: "2026-06-20T14:30:00.000Z",
    resolvedAt: null,
    neighborhoodId: "indiranagar",
    isRecurring: false,
    recurrenceCount: 0
  },
  {
    id: "issue3",
    location: { lat: 28.5820, lng: 77.0530 },
    category: "waste",
    severity: "Critical",
    description: "Massive pile of solid waste dumped directly on the sidewalk blocking pedestrian passage. Emitting terrible smell.",
    photoURL: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    status: "Open",
    reportedBy: null, // Shadow Mode
    upvotes: 22,
    upvotedBy: ["uid_example_1", "uid_example_2"],
    createdAt: "2026-06-19T08:15:00.000Z",
    resolvedAt: null,
    neighborhoodId: "dwarka",
    isRecurring: true,
    recurrenceCount: 3
  },
  {
    id: "issue4",
    location: { lat: 28.5850, lng: 77.0560 },
    category: "water leakage",
    severity: "High",
    description: "Underground main pipe burst. Water flooding the road and drinking water is being wasted for hours.",
    photoURL: "https://images.unsplash.com/photo-1508138221679-760a23a2285b?auto=format&fit=crop&q=80&w=600",
    status: "Resolved",
    reportedBy: "guardian2",
    reportedByUsername: "Anjali_G",
    upvotes: 35,
    upvotedBy: [],
    createdAt: "2026-06-10T11:00:00.000Z",
    resolvedAt: "2026-06-12T16:45:00.000Z",
    neighborhoodId: "dwarka",
    isRecurring: true,
    recurrenceCount: 1
  }
];

const DEFAULT_RESOLUTIONS: Resolution[] = [
  {
    issueId: "issue4",
    beforePhotoURL: "https://images.unsplash.com/photo-1508138221679-760a23a2285b?auto=format&fit=crop&q=80&w=600",
    afterPhotoURL: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=600",
    geminiVerdict: "Genuine Fix",
    verifiedAt: "2026-06-12T16:45:00.000Z",
    reason: "The main water pipeline pipe has been welded, and pavement restoration is completed. Excellent cleanup."
  }
];

const DEFAULT_HISTORY_LOGS: IssueHistoryLog[] = [
  {
    id: "hist1",
    issueId: "issue1",
    event: "reported",
    timestamp: "2026-06-18T10:00:00.000Z",
    actorRole: "citizen",
    details: "Issue reported by RahulS (Guardian Mode)."
  },
  {
    id: "hist2",
    issueId: "issue2",
    event: "reported",
    timestamp: "2026-06-20T14:30:00.000Z",
    actorRole: "citizen",
    details: "Issue reported by RahulS (Guardian Mode)."
  },
  {
    id: "hist3",
    issueId: "issue2",
    event: "assigned",
    timestamp: "2026-06-21T09:00:00.000Z",
    actorRole: "system",
    details: "Assigned to Ward No. 112 electrical maintenance crew."
  },
  {
    id: "hist4",
    issueId: "issue3",
    event: "reported",
    timestamp: "2026-06-19T08:15:00.000Z",
    actorRole: "citizen",
    details: "Anonymously reported in Shadow Mode."
  },
  {
    id: "hist5",
    issueId: "issue3",
    event: "recurred",
    timestamp: "2026-06-19T08:16:00.000Z",
    actorRole: "system",
    details: "Automatic Recurring issue flag applied. This is the 3rd recurrence at this exact spot."
  },
  {
    id: "hist6",
    issueId: "issue4",
    event: "reported",
    timestamp: "2026-06-10T11:00:00.000Z",
    actorRole: "citizen",
    details: "Issue reported by Anjali_G (Guardian Mode)."
  },
  {
    id: "hist7",
    issueId: "issue4",
    event: "resolution_attempted",
    timestamp: "2026-06-12T15:00:00.000Z",
    actorRole: "authority",
    details: "Resolution photo uploaded by Bangalore Water Supply Board."
  },
  {
    id: "hist8",
    issueId: "issue4",
    event: "verified",
    timestamp: "2026-06-12T16:45:00.000Z",
    actorRole: "system",
    details: "Gemini Vision verified resolution. Status updated to Resolved."
  }
];

// Helper to load localStorage state
function getLocalStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(`civisync_${key}`);
  if (!stored) {
    localStorage.setItem(`civisync_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(`civisync_${key}`, JSON.stringify(value));
}

// ---------------------- API CRUD OPERATIONS ----------------------

export const dbService = {
  // --- Anonymous ID ---
  getAnonymousId(): string {
    let anonId = localStorage.getItem("civisync_anonymous_uid");
    if (!anonId) {
      anonId = "anon_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("civisync_anonymous_uid", anonId);
    }
    return anonId;
  },

  // --- Neighborhoods ---
  async getNeighborhoods(): Promise<Neighborhood[]> {
    try {
      const snap = await getDocs(collection(db, "neighborhoods"));
      if (snap.empty) {
        // Seed neighborhoods in Firestore
        for (const nh of DEFAULT_NEIGHBORHOODS) {
          await setDoc(doc(db, "neighborhoods", nh.id), nh);
        }
        return DEFAULT_NEIGHBORHOODS;
      }
      return snap.docs.map(d => d.data() as Neighborhood);
    } catch (e) {
      console.warn("Firestore error getting neighborhoods, falling back:", e);
      return getLocalStorage("neighborhoods", DEFAULT_NEIGHBORHOODS);
    }
  },

  async updateNeighborhoodScore(neighborhoodId: string, diff: number): Promise<void> {
    try {
      const docRef = doc(db, "neighborhoods", neighborhoodId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Neighborhood;
        const newScore = Math.min(100, Math.max(0, data.fixScore + diff));
        const scoreHistory = [...data.scoreHistory, { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), score: newScore }];
        await updateDoc(docRef, { fixScore: newScore, scoreHistory });
      }
    } catch (e) {
      console.warn("Firestore error updating neighborhood score, falling back:", e);
      const list = getLocalStorage("neighborhoods", DEFAULT_NEIGHBORHOODS);
      const updated = list.map(nh => {
        if (nh.id === neighborhoodId) {
          const newScore = Math.min(100, Math.max(0, nh.fixScore + diff));
          return {
            ...nh,
            fixScore: newScore,
            scoreHistory: [...nh.scoreHistory, { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), score: newScore }]
          };
        }
        return nh;
      });
      setLocalStorage("neighborhoods", updated);
    }
  },

  // --- Issues ---
  async getIssues(): Promise<Issue[]> {
    try {
      const snap = await getDocs(collection(db, "issues"));
      if (snap.empty) {
        for (const issue of DEFAULT_ISSUES) {
          await setDoc(doc(db, "issues", issue.id), issue);
        }
        return DEFAULT_ISSUES;
      }
      return snap.docs.map(d => d.data() as Issue);
    } catch (e) {
      console.warn("Firestore error getting issues, falling back:", e);
      return getLocalStorage("issues", DEFAULT_ISSUES);
    }
  },

  async saveIssue(issue: Issue): Promise<void> {
    try {
      await setDoc(doc(db, "issues", issue.id), issue);
    } catch (e) {
      console.warn("Firestore error saving issue, falling back:", e);
      const list = getLocalStorage("issues", DEFAULT_ISSUES);
      setLocalStorage("issues", [issue, ...list]);
    }
  },

  async updateIssueStatus(issueId: string, status: "Open" | "In Progress" | "Resolved", resolvedAt: string | null = null, proofChain: ProofChain | null = null): Promise<void> {
    try {
      const docRef = doc(db, "issues", issueId);
      const updateData: any = { status, resolvedAt };
      if (proofChain) {
        updateData.proofChain = proofChain;
      }
      await updateDoc(docRef, updateData);
    } catch (e) {
      console.warn("Firestore error updating issue status, falling back:", e);
      const list = getLocalStorage("issues", DEFAULT_ISSUES);
      const updated = list.map(issue => {
        if (issue.id === issueId) {
          const updatedIssue = { ...issue, status, resolvedAt };
          if (proofChain) {
            updatedIssue.proofChain = proofChain;
          }
          return updatedIssue;
        }
        return issue;
      });
      setLocalStorage("issues", updated);
    }
  },

  async upvoteIssue(issueId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, "issues", issueId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const issue = docSnap.data() as Issue;
        const upvotedBy = issue.upvotedBy || [];
        if (!upvotedBy.includes(userId)) {
          const updatedUpvotes = [...upvotedBy, userId];
          await updateDoc(docRef, {
            upvotes: issue.upvotes + 1,
            upvotedBy: updatedUpvotes
          });
        }
      }
    } catch (e) {
      console.warn("Firestore error upvoting, falling back:", e);
      const list = getLocalStorage("issues", DEFAULT_ISSUES);
      const updated = list.map(issue => {
        if (issue.id === issueId) {
          const upvotedBy = issue.upvotedBy || [];
          if (!upvotedBy.includes(userId)) {
            return {
              ...issue,
              upvotes: issue.upvotes + 1,
              upvotedBy: [...upvotedBy, userId]
            };
          }
        }
        return issue;
      });
      setLocalStorage("issues", updated);
    }
  },

  // --- Resolutions ---
  async getResolutions(): Promise<Resolution[]> {
    try {
      const snap = await getDocs(collection(db, "resolutions"));
      if (snap.empty) {
        for (const res of DEFAULT_RESOLUTIONS) {
          await setDoc(doc(db, "resolutions", res.issueId), res);
        }
        return DEFAULT_RESOLUTIONS;
      }
      return snap.docs.map(d => d.data() as Resolution);
    } catch (e) {
      console.warn("Firestore error getting resolutions, falling back:", e);
      return getLocalStorage("resolutions", DEFAULT_RESOLUTIONS);
    }
  },

  async saveResolution(resolution: Resolution): Promise<void> {
    try {
      await setDoc(doc(db, "resolutions", resolution.issueId), resolution);
    } catch (e) {
      console.warn("Firestore error saving resolution, falling back:", e);
      const list = getLocalStorage("resolutions", DEFAULT_RESOLUTIONS);
      setLocalStorage("resolutions", [resolution, ...list]);
    }
  },

  // --- History Log ---
  async getHistoryLogs(): Promise<IssueHistoryLog[]> {
    try {
      const snap = await getDocs(collection(db, "history"));
      if (snap.empty) {
        for (const log of DEFAULT_HISTORY_LOGS) {
          await setDoc(doc(db, "history", log.id), log);
        }
        return DEFAULT_HISTORY_LOGS;
      }
      return snap.docs.map(d => d.data() as IssueHistoryLog);
    } catch (e) {
      console.warn("Firestore error getting history, falling back:", e);
      return getLocalStorage("history", DEFAULT_HISTORY_LOGS);
    }
  },

  async addHistoryLog(log: IssueHistoryLog): Promise<void> {
    try {
      await setDoc(doc(db, "history", log.id), log);
    } catch (e) {
      console.warn("Firestore error adding log, falling back:", e);
      const list = getLocalStorage("history", DEFAULT_HISTORY_LOGS);
      setLocalStorage("history", [...list, log]);
    }
  },

  // --- User Profiles ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      console.warn("Firestore error getting user profile, falling back:", e);
      const users = getLocalStorage<UserProfile[]>("users_profiles", []);
      return users.find(u => u.uid === uid) || null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, "users", profile.uid), profile);
    } catch (e) {
      console.warn("Firestore error saving user profile, falling back:", e);
      const users = getLocalStorage<UserProfile[]>("users_profiles", []);
      const index = users.findIndex(u => u.uid === profile.uid);
      if (index !== -1) {
        users[index] = profile;
      } else {
        users.push(profile);
      }
      setLocalStorage("users_profiles", users);
    }
  },

  async updateUserPointsAndStreak(uid: string, pointsEarned: number, shouldIncrementStreak = false): Promise<void> {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const user = docSnap.data() as UserProfile;
        const newPoints = user.points + pointsEarned;
        const newStreak = shouldIncrementStreak ? user.streak + 1 : user.streak;
        
        // Dynamic badges calculation based on total verified issues & category
        const badges = [...(user.badges || [])];
        
        await updateDoc(docRef, { 
          points: newPoints, 
          streak: newStreak,
          badges
        });
      }
    } catch (e) {
      console.warn("Firestore error updating points/streak, falling back:", e);
      const users = getLocalStorage<UserProfile[]>("users_profiles", []);
      const updated = users.map(user => {
        if (user.uid === uid) {
          const newPoints = user.points + pointsEarned;
          const newStreak = shouldIncrementStreak ? user.streak + 1 : user.streak;
          return { ...user, points: newPoints, streak: newStreak };
        }
        return user;
      });
      setLocalStorage("users_profiles", updated);
    }
  }
};

export { auth, db };
