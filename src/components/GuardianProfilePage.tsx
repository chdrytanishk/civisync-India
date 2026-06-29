import { useMemo } from "react";
import { UserProfile, Issue } from "../types";
import { 
  Award, Flame, Calendar, MapPin, Eye, ThumbsUp, 
  HelpCircle, Sparkles, Star, Tag, ChevronRight, CheckCircle2, AlertCircle 
} from "lucide-react";

interface GuardianProfilePageProps {
  currentUser: UserProfile | null;
  issues: Issue[];
}

export default function GuardianProfilePage({ currentUser, issues }: GuardianProfilePageProps) {
  if (!currentUser) {
    return (
      <div className="p-8 text-center max-w-md mx-auto text-xs text-slate-400 font-normal">
        Please sign in as a Guardian Mode user to view achievements.
      </div>
    );
  }

  // Dynamic user stats from issues
  const userReports = useMemo(() => {
    return issues.filter((i) => i.reportedBy === currentUser.uid);
  }, [issues, currentUser]);

  const totalReportsCount = userReports.length;
  const resolvedReportsCount = userReports.filter((i) => i.status === "Resolved").length;
  const inProgressCount = userReports.filter((i) => i.status === "In Progress").length;

  // Calculate dynamic badge unlock status
  const badgesWithStatus = useMemo(() => {
    const list = [
      {
        id: "streetlight",
        icon: "🔦",
        name: "Streetlight Savior",
        description: "5 lighting issues resolved",
        required: 5,
        current: userReports.filter((i) => i.category === "broken streetlight" && i.status === "Resolved").length,
      },
      {
        id: "pothole",
        icon: "🕳️",
        name: "Pothole Hunter",
        description: "10 road issues reported",
        required: 10,
        current: userReports.filter((i) => i.category === "pothole" || i.category === "damaged road").length,
      },
      {
        id: "water",
        icon: "💧",
        name: "Water Watcher",
        description: "3 water leakage issues verified",
        required: 3,
        current: userReports.filter((i) => i.category === "water leakage" && i.status !== "Open").length,
      },
      {
        id: "guardian",
        icon: "🏆",
        name: "Neighborhood Guardian",
        description: "Top reporter in area for 30 days",
        required: 1,
        current: totalReportsCount >= 5 ? 1 : 0, // unlocks if has at least 5 reports for demonstration
      },
      {
        id: "pattern",
        icon: "🔁",
        name: "Pattern Spotter",
        description: "First to report a recurring issue",
        required: 1,
        current: userReports.filter((i) => i.isRecurring).length,
      }
    ];

    return list.map(b => ({
      ...b,
      unlocked: b.current >= b.required
    }));
  }, [userReports, totalReportsCount]);

  // Streak Tracker details (mock tracker)
  const streakWeeks = [
    { name: "W1", active: true },
    { name: "W2", active: true },
    { name: "W3", active: true },
    { name: "W4", active: currentUser.streak >= 4 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in-premium">
      
      {/* Profile Header Card */}
      <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4.5 text-center sm:text-left">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-[#00ff87] flex items-center justify-center font-mono text-2xl font-extrabold text-slate-950 shadow-md shadow-emerald-500/10">
            {currentUser.username[0]}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-emerald-50">
                {currentUser.username}
              </h1>
              <span className="self-center sm:self-auto inline-flex items-center gap-x-1.5 rounded-md bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-[#00ff87] border border-emerald-800/40">
                🛡️ Active Guardian
              </span>
            </div>
            
            <p className="text-xs text-emerald-400/80 mt-1 flex items-center justify-center sm:justify-start gap-1 font-mono">
              <Calendar className="h-3.5 w-3.5 text-[#00ff87]" />
              <span>Joined: {new Date(currentUser.joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
            </p>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex gap-4 text-center">
          <div className="bg-[#02110c]/50 p-3 sm:px-5 rounded-xl border border-[#0f3d2b]/60">
            <p className="text-xl font-extrabold text-emerald-50 font-display">{currentUser.points}</p>
            <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold">Civic Points</p>
          </div>

          <div className="bg-[#02110c]/50 p-3 sm:px-5 rounded-xl border border-[#0f3d2b]/60">
            <p className="text-xl font-extrabold text-[#00ff87] font-display flex items-center justify-center gap-1">
              <Flame className="h-4.5 w-4.5 text-[#00ff87] animate-pulse fill-[#00ff87]/10" />
              <span>{currentUser.streak}</span>
            </p>
            <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold">Week Streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Streaks */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* STATS BREAKDOWN CARD */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-5 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <h2 className="font-display font-extrabold text-base text-emerald-50 border-b border-[#0f3d2b]/60 pb-2">
              Citizen Impact Metrics
            </h2>

            <div className="space-y-3 text-xs text-emerald-300">
              <div className="flex justify-between items-center bg-[#02110c]/50 p-3 rounded-xl border border-[#0f3d2b]/60 font-normal">
                <span>Total Issues Logged:</span>
                <span className="font-mono font-bold text-emerald-100">{totalReportsCount}</span>
              </div>

              <div className="flex justify-between items-center bg-[#02110c]/50 p-3 rounded-xl border border-[#0f3d2b]/60 font-normal">
                <span>Verified Repairs Completed:</span>
                <span className="font-mono font-bold text-emerald-400">{resolvedReportsCount}</span>
              </div>

              <div className="flex justify-between items-center bg-[#02110c]/50 p-3 rounded-xl border border-[#0f3d2b]/60 font-normal">
                <span>Currently In Progress:</span>
                <span className="font-mono font-bold text-[#00ff87]">{inProgressCount}</span>
              </div>
            </div>
          </div>

          {/* STREAK TRACKER */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-5 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#0f3d2b]/60 pb-2">
              <h2 className="font-display font-bold text-sm text-emerald-50 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#00ff87] fill-[#00ff87]/10" />
                <span>Weekly Activity Streak</span>
              </h2>
              <span className="text-[10px] text-emerald-600/70 font-mono font-bold">Monthly target</span>
            </div>

            <p className="text-[11px] text-emerald-400/80 leading-relaxed font-sans font-normal">
              Log at least one verified incident every week to sustain your multiplier and secure top-priority local grievance ranking.
            </p>

            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              {streakWeeks.map((wk, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg border ${
                    wk.active 
                      ? "bg-emerald-950/40 border border-emerald-800/40 text-[#00ff87] font-bold animate-pulse" 
                      : "bg-[#02110c]/30 border border-[#0f3d2b]/40 text-emerald-700/50"
                  }`}
                >
                  <p className="text-[10px] font-bold">{wk.name}</p>
                  <p className="text-[11px] font-mono font-bold mt-1.5">{wk.active ? "🔥" : "💤"}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Achievements & Rewards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BADGES EARNED */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-5">
            <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5 border-b border-[#0f3d2b]/60 pb-2.5">
              <Award className="h-5 w-5 text-[#00ff87]" />
              <span>Civic Guard Badges</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badgesWithStatus.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all ${
                    badge.unlocked 
                      ? "bg-[#02110c]/50 border border-[#0f3d2b]/60 text-emerald-100 shadow-md" 
                      : "bg-[#02110c]/20 border border-[#0f3d2b]/50 opacity-50 text-emerald-700/30"
                  }`}
                >
                  <span className="text-3xl shrink-0 mt-0.5">{badge.icon}</span>
                  <div className="text-xs flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-display font-extrabold text-sm text-emerald-100">{badge.name}</span>
                      {badge.unlocked && <span className="bg-emerald-950/45 border border-emerald-800/40 text-[8px] text-[#00ff87] font-extrabold px-1.5 py-0.2 rounded uppercase">Unlocked</span>}
                    </div>
                    <p className="text-emerald-400 mt-1 font-normal">{badge.description}</p>
                    
                    {/* Progress slider */}
                    <div className="mt-3.5 flex items-center gap-2">
                      <div className="flex-1 bg-[#010905] h-1.5 rounded-full overflow-hidden border border-[#0f3d2b]/60">
                        <div 
                          className="bg-gradient-to-r from-emerald-600 to-[#00ff87] h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (badge.current / badge.required) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-emerald-400 font-semibold shrink-0">
                        {badge.current}/{badge.required}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REWARDS SECTION (UI ONLY) */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#0f3d2b]/60 pb-2.5">
              <h2 className="font-display font-bold text-sm text-emerald-50 flex items-center gap-1.5">
                <Tag className="h-4.5 w-4.5 text-[#00ff87]" />
                <span>Guardian Rewards Vault</span>
              </h2>
              <span className="text-[9px] font-mono bg-emerald-950/40 text-[#00ff87] px-2 py-0.5 rounded border border-emerald-800/45 uppercase font-bold tracking-wider">
                Coming Soon
              </span>
            </div>

            <p className="text-[11px] text-emerald-400/80 leading-relaxed font-sans font-normal">
              Accumulate points to unlock special local government partnerships, civic certifications, and local business discounts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#02110c]/50 p-4 rounded-xl border border-[#0f3d2b]/60 opacity-95 relative overflow-hidden shadow-md">
                <p className="font-bold text-emerald-100">🏢 Municipal Grievance Priority</p>
                <p className="text-[10px] text-emerald-400 mt-1 leading-relaxed font-normal">Get your reported complaints pushed to the top of authority queues automatically.</p>
              </div>

              <div className="bg-[#02110c]/50 p-4 rounded-xl border border-[#0f3d2b]/60 opacity-95 relative overflow-hidden shadow-md">
                <p className="font-bold text-emerald-100">☕ Café Coffee Day Discount</p>
                <p className="text-[10px] text-emerald-400 mt-1 leading-relaxed font-normal">15% discount on hot brews at any partner CCD outlet in your city ward.</p>
              </div>

              <div className="bg-[#02110c]/50 p-4 rounded-xl border border-[#0f3d2b]/60 opacity-95 relative overflow-hidden shadow-md">
                <p className="font-bold text-emerald-100">📜 Civic Champion Certificate</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-normal">Official quarterly certification endorsed by municipal corporator boards.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
