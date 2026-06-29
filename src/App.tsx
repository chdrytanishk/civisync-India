import React, { useState, useEffect } from "react";
import { UserProfile, Issue, Neighborhood } from "./types";
import { dbService } from "./lib/firebase";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import ReportIssuePage from "./components/ReportIssuePage";
import MapPage from "./components/MapPage";
import IssueDetailPage from "./components/IssueDetailPage";
import AuthorityDashboard from "./components/AuthorityDashboard";
import FixScorePage from "./components/FixScorePage";
import LeaderboardPage from "./components/LeaderboardPage";
import GuardianProfilePage from "./components/GuardianProfilePage";
import { 
  Home, 
  Map as MapIcon, 
  TrendingUp, 
  Award, 
  Building2, 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Info, 
  Menu, 
  X,
  UserCheck,
  Activity
} from "lucide-react";

export default function App() {
  // Current logged in user: default loaded as a public Guardian profile for instant premium exploration!
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Attempt local storage cache
    const stored = localStorage.getItem("civisync_current_user");
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    // Default fallback mock user so the preview is instantly alive and fully personalized!
    return {
      uid: "guardian_demo_rahul",
      email: "rahuls@civisync.gov.in",
      mode: "guardian",
      username: "RahulS_Guardian",
      points: 240,
      streak: 3,
      badges: ["🔦 Streetlight Savior", "🕳️ Pothole Hunter"],
      joinedAt: new Date().toISOString(),
    };
  });

  const [currentView, setCurrentView] = useState<
    "landing" | "map" | "report" | "detail" | "authority" | "fixscore" | "leaderboard" | "auth" | "profile"
  >("landing");

  const [issues, setIssues] = useState<Issue[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Welcome to CiviSync! Your neighborhood has a new pothole report.",
    "Malleswaram's streetlight repair audit succeeded! FixScore increased."
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  // Sync current user to local storage for persistent testing
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("civisync_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("civisync_current_user");
    }
  }, [currentUser]);

  // Load Firestore / Local persistence data
  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      const issuesList = await dbService.getIssues();
      const neighborhoodsList = await dbService.getNeighborhoods();
      setIssues(issuesList);
      setNeighborhoods(neighborhoodsList);

      // Restore selected issue reference if active
      if (selectedIssue) {
        const fresh = issuesList.find((i) => i.id === selectedIssue.id);
        if (fresh) setSelectedIssue(fresh);
      }
    } catch (err) {
      console.error("Failed to fetch Firestore collections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView("landing");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("auth");
    setDropdownOpen(false);
  };

  const handleIssueAdded = (newIssue: Issue) => {
    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssue(newIssue);
    loadDatabaseData(); // refresh scores
  };

  const handleUpvote = async (issueId: string) => {
    const userUid = currentUser?.uid || dbService.getAnonymousId();
    
    // Optimistic UI updates
    setIssues((prev) => 
      prev.map((i) => {
        if (i.id === issueId && !i.upvotedBy?.includes(userUid)) {
          return {
            ...i,
            upvotes: i.upvotes + 1,
            upvotedBy: [...(i.upvotedBy || []), userUid]
          };
        }
        return i;
      })
    );

    try {
      await dbService.upvoteIssue(issueId, userUid);
      
      // Update local timeline event log
      const logId = "log_" + Math.random().toString(36).substr(2, 9);
      await dbService.addHistoryLog({
        id: logId,
        issueId,
        event: "upvoted",
        timestamp: new Date().toISOString(),
        actorRole: "citizen",
        details: currentUser?.mode === "guardian" ? `Upvoted by Guardian ${currentUser.username}` : "Upvoted anonymously."
      });

      // Refresh database to sync upvote states
      const refreshedIssues = await dbService.getIssues();
      setIssues(refreshedIssues);
      const updatedSelect = refreshedIssues.find(i => i.id === issueId);
      if (updatedSelect) setSelectedIssue(updatedSelect);
    } catch (err) {
      console.error("Failed to register upvote:", err);
    }
  };

  const handleRefreshData = () => {
    loadDatabaseData();
  };

  const toggleUserMode = () => {
    if (!currentUser) return;
    const newMode = currentUser.mode === "guardian" ? "shadow" : "guardian";
    const updatedUser: UserProfile = {
      ...currentUser,
      mode: newMode,
      username: newMode === "shadow" ? "Shadow_Guardian" : "RahulS_Guardian",
      points: newMode === "shadow" ? 0 : 240
    };
    setCurrentUser(updatedUser);
    localStorage.setItem("civisync_current_user", JSON.stringify(updatedUser));
    setDropdownOpen(false);
  };

  // Main navigation view routing
  const renderActiveView = () => {
    switch (currentView) {
      case "landing":
        return (
          <LandingPage
            onViewChange={(view) => {
              if (view === "report" && !currentUser) {
                setCurrentView("auth");
              } else {
                setCurrentView(view);
              }
            }}
            issues={issues}
            neighborhoods={neighborhoods}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setCurrentView("detail");
            }}
            currentUser={currentUser}
            onToggleMode={toggleUserMode}
          />
        );

      case "auth":
        return (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            onViewChange={setCurrentView}
          />
        );

      case "report":
        return (
          <ReportIssuePage
            currentUser={currentUser}
            issues={issues}
            neighborhoods={neighborhoods}
            onIssueAdded={handleIssueAdded}
            onViewChange={setCurrentView}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
          />
        );

      case "map":
        return (
          <MapPage
            issues={issues}
            neighborhoods={neighborhoods}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onViewChange={setCurrentView}
            currentUser={currentUser}
            onUpvote={handleUpvote}
          />
        );

      case "detail":
        return (
          <IssueDetailPage
            selectedIssue={selectedIssue}
            issues={issues}
            onViewChange={setCurrentView}
            currentUser={currentUser}
            onUpvote={handleUpvote}
          />
        );

      case "authority":
        return (
          <AuthorityDashboard
            issues={issues}
            neighborhoods={neighborhoods}
            onIssueUpdated={(issue) => loadDatabaseData()}
            onRefreshData={handleRefreshData}
          />
        );

      case "fixscore":
        return <FixScorePage issues={issues} neighborhoods={neighborhoods} />;

      case "leaderboard":
        return <LeaderboardPage issues={issues} neighborhoods={neighborhoods} />;

      case "profile":
        return <GuardianProfilePage currentUser={currentUser} issues={issues} />;

      default:
        return (
          <div className="py-20 text-center">
            <p className="text-slate-400">View not implemented yet.</p>
          </div>
        );
    }
  };

  const navItems = [
    { id: "landing" as const, label: "Home", icon: Home },
    { id: "map" as const, label: "Civic Map", icon: MapIcon },
    { id: "fixscore" as const, label: "FixScores", icon: TrendingUp },
    { id: "leaderboard" as const, label: "Leaderboard", icon: Award },
    { id: "authority" as const, label: "Authority Portal", icon: Building2 },
    { id: "profile" as const, label: "My Activity", icon: Activity },
    { id: "notifications_trigger" as const, label: "Notifications", icon: Bell },
  ];

  // If auth page, render without persistent sidebar layout
  if (currentView === "auth") {
    return (
      <div className="min-h-screen bg-[#010a06] text-emerald-100 flex flex-col justify-center animate-fade-in-premium">
        {renderActiveView()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010a06] text-emerald-100 flex font-sans antialiased selection:bg-emerald-500/20">
      
      {/* 1. LEFT SIDEBAR (fixed, ~180px wide - w-[200px] for elegant spacing, glassy deep emerald dark bg) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[200px] bg-[#02130c]/90 border-r border-[#0f3d2b]/60 z-30 justify-between select-none shadow-2xl backdrop-blur-xl">
        <div>
          {/* Logo Brand top */}
          <div 
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-2.5 px-5 py-6 cursor-pointer hover:opacity-95 transition-opacity border-b border-[#0f3d2b]/40"
          >
            <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0">
              <defs>
                <linearGradient id="logo-grad-s" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff87" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path d="M30 20 C30 20, 50 10, 70 20 L65 35 C65 35, 55 28, 45 32 C35 36, 50 45, 65 48 C80 51, 75 75, 55 80 C35 85, 25 75, 25 75 L35 60 C35 60, 45 68, 55 64 C65 60, 50 52, 38 48 C25 44, 25 24, 30 20 Z" fill="url(#logo-grad-s)" />
            </svg>
            <div>
              <span className="font-display font-black text-sm text-slate-100 tracking-wider block uppercase leading-none">CiviSync</span>
              <span className="text-[8px] font-mono font-black text-[#00ff87] tracking-widest uppercase block mt-1">INDIA</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === "notifications_trigger" && notificationsOpen);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "authority" && !currentUser) {
                      setCurrentView("auth");
                    } else if (item.id === "notifications_trigger") {
                      setNotificationsOpen(!notificationsOpen);
                    } else {
                      setCurrentView(item.id as any);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 border border-[#00ff87]/20" 
                      : "text-emerald-400/80 hover:text-emerald-100 hover:bg-[#031d13]/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-slate-950" : "text-emerald-500/60 group-hover:text-emerald-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card block */}
        <div className="p-3">
          <div className="bg-[#031d13]/50 border border-[#0f3d2b]/50 rounded-2xl p-4 text-center shadow-xs backdrop-blur-md">
            {/* Elegant temple / assembly vector SVG */}
            <svg viewBox="0 0 100 45" className="h-10 w-full text-emerald-400/30 mx-auto mb-2 fill-none stroke-current" strokeWidth="1.2">
              <path d="M10 40 h80 M15 40 v-15 h70 v15 M25 25 v-10 h50 v10 M35 15 a15 15 0 0 1 30 0" />
              <line x1="50" y1="10" x2="50" y2="2" strokeWidth="1.5" />
              <circle cx="50" cy="1" r="1" />
              <line x1="30" y1="25" x2="30" y2="40" />
              <line x1="40" y1="25" x2="40" y2="40" />
              <line x1="50" y1="25" x2="50" y2="40" />
              <line x1="60" y1="25" x2="60" y2="40" />
              <line x1="70" y1="25" x2="70" y2="40" />
            </svg>
            <h4 className="text-[10px] font-extrabold text-emerald-100 leading-tight">Civic Memory is Stronger Together</h4>
            <p className="text-[8px] text-emerald-400/60 mt-1.5 leading-relaxed font-normal">
              Every report. Every resolution. Every neighborhood.
            </p>
            <button 
              onClick={() => setShowLearnMoreModal(true)}
              className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950 font-extrabold text-[9px] py-1.5 rounded-lg border-none cursor-pointer hover:opacity-90 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER/NAVBAR FOR RESPONSIVE */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#02130c] border-b border-[#0f3d2b]/60 z-50 flex items-center justify-between px-4 text-emerald-100 shadow-md">
        <div className="flex items-center gap-2" onClick={() => setCurrentView("landing")}>
          <ShieldCheck className="h-5 w-5 text-[#00ff87]" />
          <span className="font-display font-black text-xs tracking-tight">CIVISYNC INDIA</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView("report")}
            className="bg-gradient-to-r from-emerald-600 to-[#00ff87] px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-slate-950 flex items-center gap-1 shadow-md shadow-emerald-500/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Report</span>
          </button>
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-[#031d13]"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex animate-fade-in-premium">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-[220px] w-full bg-[#02130c] p-4 text-emerald-100 z-50 shadow-2xl border-r border-[#0f3d2b]">
            <div className="flex items-center justify-between pb-4 border-b border-[#0f3d2b]/40 mb-4">
              <span className="font-display font-black text-sm tracking-tight text-[#00ff87]">CiviSync India</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-emerald-400 hover:text-emerald-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive ? "bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950" : "text-emerald-300 hover:text-white hover:bg-[#031d13]/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="bg-[#031d13]/50 border border-[#0f3d2b]/40 rounded-xl p-3 text-center mt-auto shadow-md">
              <h4 className="text-[9px] font-extrabold text-emerald-200">Civic Memory is Stronger</h4>
              <button 
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setShowLearnMoreModal(true);
                }}
                className="mt-2 w-full bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950 text-[8px] py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[200px] pt-14 lg:pt-0 bg-[#010a06]">
        
        {/* TOP HEADER BAR (search bar (center), user avatar + dropdown (right), notification bell, Report CTA) */}
        <header className="h-16 border-b border-[#0f3d2b]/60 bg-[#010a06]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 select-none">
          
          {/* Search Bar - centered or left-aligned with absolute max-width */}
          <div className="flex-1 max-w-lg relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500/85 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search reports, wards, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#02140e]/85 border border-[#0f3d2b]/60 text-emerald-100 pl-9 pr-14 py-2.5 rounded-xl text-xs focus:bg-[#02140e] focus:border-[#00ff87] focus:ring-1 focus:ring-[#00ff87]/25 outline-none transition-all placeholder:text-emerald-600/70"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-400 bg-[#010e09] border border-[#0f3d2b]/60 px-1.5 py-0.5 rounded shadow-sm font-mono">
              ⌘K
            </span>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center space-x-3.5 ml-4">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-emerald-400 hover:text-emerald-100 hover:bg-[#031d13]/50 rounded-xl transition-all relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#00ff87] text-[8px] font-black text-slate-950 flex items-center justify-center border-2 border-[#010a06]">
                  3
                </span>
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-[#02130c]/90 border border-[#0f3d2b]/60 rounded-2xl shadow-2xl z-50 p-4 space-y-3 text-slate-200 animate-fade-in-premium backdrop-blur-md">
                  <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-2">
                    <span className="font-extrabold text-[10px] text-[#00ff87] uppercase tracking-wider">Citizen Inbox</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[9px] text-[#00ff87] font-extrabold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-emerald-500/80 text-center py-2">No new notifications.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className="p-2.5 bg-[#02110b] border border-[#0f3d2b]/60 rounded-xl text-[9px] text-emerald-300 leading-normal">
                          {notif}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Dropdown Profile Badge */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 bg-[#02130c]/90 border border-[#0f3d2b]/60 rounded-xl hover:border-emerald-600 transition-all cursor-pointer shadow-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-md">
                    {currentUser.username[0]}
                  </div>
                  <span className="text-xs font-bold text-emerald-200 max-w-[110px] truncate">
                    {currentUser.username}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#00ff87]" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#02130c]/90 border border-[#0f3d2b]/60 rounded-2xl shadow-2xl z-50 p-2 space-y-1 text-emerald-200 animate-fade-in-premium backdrop-blur-md">
                    {currentUser.mode === "guardian" && (
                      <button
                        onClick={() => {
                          setCurrentView("profile");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-[#031d13]/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5 text-[#00ff87]" />
                        <span>My Profile</span>
                      </button>
                    )}
                    <button
                      onClick={toggleUserMode}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-[#031d13]/60 rounded-xl transition-colors cursor-pointer"
                    >
                      {currentUser.mode === "guardian" ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Switch to Shadow</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-[#00ff87]" />
                          <span>Switch to Guardian</span>
                        </>
                      )}
                    </button>
                    <hr className="border-[#0f3d2b]/40 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setCurrentView("auth")}
                className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-[#00ff87] text-slate-950 px-3.5 py-1.5 rounded-xl hover:opacity-90 cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            )}

            {/* "Report Issue" CTA button (gradient background matching layout perfectly) */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setCurrentView("auth");
                } else {
                  setCurrentView("report");
                }
              }}
              className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:opacity-95 text-white font-extrabold text-xs rounded-xl px-4.5 py-2.5 flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer select-none"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Report an Issue</span>
            </button>

          </div>
        </header>

        {/* Content canvas viewport */}
        <main className="flex-1 overflow-y-auto bg-[#010a06] animate-fade-in-premium">
          {loading && issues.length === 0 ? (
            <div className="flex h-[75vh] items-center justify-center flex-col space-y-3">
              <div className="h-10 w-10 animate-spin text-[#00ff87] rounded-full border-4 border-[#0f3d2b]/60 border-t-[#00ff87]" />
              <span className="text-xs text-emerald-400 font-mono font-bold">Initializing CiviSync Database...</span>
            </div>
          ) : (
            renderActiveView()
          )}

          {/* Standard Footer */}
          <footer className="bg-[#010a06] border-t border-[#0f3d2b]/40 py-6 text-center text-[10px] text-emerald-600/60 font-mono tracking-wider">
            © {new Date().getFullYear()} CiviSync India · Secure Hyperlocal Citizen Accountability Portal
          </footer>
        </main>
      </div>

      {/* Learn More info popup modal */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md animate-fade-in-premium">
          <div className="bg-[#02130c]/95 rounded-2xl max-w-md w-full border border-[#0f3d2b]/60 p-6 shadow-2xl relative text-slate-100 backdrop-blur-xl">
            <button 
              onClick={() => setShowLearnMoreModal(false)}
              className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/40 text-[#00ff87] mb-4 border border-emerald-800/40">
              <Info className="h-5 w-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-emerald-50 mb-2">How CiviSync Works</h3>
            <p className="text-xs text-emerald-300 leading-relaxed space-y-3 font-normal">
              CiviSync transforms citizen reports into a permanent Civic Memory. 
              <br /><br />
              <strong>1. Report Issue:</strong> Upload a photo and describe the problem in any language. 
              Our Gemini AI automatically transcribes, identifies the category, and sets severity.
              <br /><br />
              <strong>2. Automated Auditing:</strong> To close an issue, Ward Engineers must submit an after photo. 
              Gemini Vision verifies the "Before" vs "After" images to ensure a genuine fix.
              <br /><br />
              <strong>3. Trust score:</strong> Repair resolutions dynamically increase the ward's public FixScore.
            </p>
            <button 
              onClick={() => setShowLearnMoreModal(false)}
              className="mt-5 w-full bg-gradient-to-r from-emerald-600 to-[#00ff87] hover:opacity-95 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}


// Inline Loader Icon Helper
function Loader2({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
