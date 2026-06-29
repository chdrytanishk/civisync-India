import { useMemo } from "react";
import { Issue, Neighborhood, UserProfile } from "../types";
import { Award, Shield, Flame, MapPin, CheckCircle2, TrendingUp, Sparkles, AlertCircle } from "lucide-react";

interface LeaderboardPageProps {
  issues: Issue[];
  neighborhoods: Neighborhood[];
}

export default function LeaderboardPage({ issues, neighborhoods }: LeaderboardPageProps) {
  
  // 1. Calculate dynamic Neighborhood Leaderboard (top wards by FixScore)
  const neighborhoodLeaderboard = useMemo(() => {
    return neighborhoods.map((nh) => {
      // Find all issues in this neighborhood to compute exact current score
      const nhIssues = issues.filter((i) => i.neighborhoodId === nh.id);
      let activePenalty = 0;
      let recurrencePenalty = 0;
      let fakeResolutionPenalty = 0;

      const activeIssues = nhIssues.filter((i) => i.status !== "Resolved");
      activeIssues.forEach((issue) => {
        if (issue.severity === "Critical") activePenalty += 15;
        else if (issue.severity === "High") activePenalty += 8;
        else if (issue.severity === "Medium") activePenalty += 4;
        else activePenalty += 2;

        if (issue.isRecurring) {
          recurrencePenalty += 10;
        }
      });

      if (nh.id === "dwarka") fakeResolutionPenalty = 15;

      const score = Math.min(100, Math.max(15, 100 - activePenalty - recurrencePenalty - fakeResolutionPenalty));

      return {
        ...nh,
        fixScore: score,
        resolvedCount: nhIssues.filter(i => i.status === "Resolved").length,
        openCount: nhIssues.filter(i => i.status !== "Resolved").length
      };
    }).sort((a, b) => b.fixScore - a.fixScore);
  }, [issues, neighborhoods]);

  // 2. Generate Top Guardian Reporters (exclusion of Shadow Mode reports)
  const guardianLeaderboard = useMemo(() => {
    // Collect all reports made by non-null users (Guardian Mode)
    const guardianReports = issues.filter(i => i.reportedBy !== null && i.reportedByUsername);
    
    // Group and count per user
    const userGroups: { [uid: string]: { username: string, total: number, resolved: number, points: number } } = {};
    
    // Seed some high-fidelity mock users for a robust sandbox experience
    const mockLeaders = [
      { uid: "guardian1", username: "RahulS", total: 14, resolved: 8, points: 640 },
      { uid: "guardian2", username: "Anjali_G", total: 11, resolved: 7, points: 510 },
      { uid: "guardian3", username: "Karan_Delhi", total: 8, resolved: 4, points: 340 },
    ];

    mockLeaders.forEach(l => {
      userGroups[l.uid] = l;
    });

    // Accumulate actual reported issues in database
    guardianReports.forEach(issue => {
      const uid = issue.reportedBy!;
      const username = issue.reportedByUsername!;
      const isResolved = issue.status === "Resolved";

      if (!userGroups[uid]) {
        userGroups[uid] = { username, total: 0, resolved: 0, points: 100 };
      }
      userGroups[uid].total += 1;
      if (isResolved) {
        userGroups[uid].resolved += 1;
        userGroups[uid].points += 80; // +80 pts for resolved cases
      } else {
        userGroups[uid].points += 30; // +30 pts for registering reports
      }
    });

    return Object.values(userGroups).sort((a, b) => b.points - a.points);
  }, [issues]);

  // 3. Find Most Impactful Reports (resolved high severity issues with upvotes)
  const impactfulResolvedIssues = useMemo(() => {
    return issues
      .filter((i) => i.status === "Resolved" && (i.severity === "High" || i.severity === "Critical"))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3);
  }, [issues]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-fade-in-premium">
      
      {/* Title */}
      <div className="border-b border-[#0f3d2b]/40 pb-5">
        <h1 className="font-display font-extrabold text-3xl text-emerald-50 flex items-center gap-2">
          <Award className="h-8 w-8 text-[#00ff87] fill-emerald-400/10 animate-pulse" />
          <span>Weekly Civic Leaders</span>
        </h1>
        <p className="text-xs text-emerald-400/80 mt-1">
          Honoring outstanding local Guardians and wards leading municipal corrections across cities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top Guardians Table */}
        <div className="lg:col-span-6 bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl flex flex-col space-y-4 backdrop-blur-md">
          <div className="border-b border-[#0f3d2b]/40 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-[#00ff87]" />
                <span>Guardian Leaders</span>
              </h2>
              <p className="text-[10px] text-emerald-400/70 mt-0.5 font-medium">Top reporters by civic points this month</p>
            </div>
            <span className="text-[8px] uppercase tracking-widest font-extrabold bg-emerald-950/40 text-[#00ff87] px-2.5 py-1 rounded-lg border border-[#0f3d2b]/65">
              Citizens
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {guardianLeaderboard.map((leader, idx) => (
              <div 
                key={idx}
                className="bg-[#02110c]/50 border border-[#0f3d2b]/60 p-4 rounded-xl flex items-center justify-between transition-all hover:border-[#00ff87]/30 hover:bg-[#031d13]/30"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <span className="font-mono text-sm font-extrabold text-emerald-500/40 w-5">
                    #{idx + 1}
                  </span>
                  <div className="h-9 w-9 rounded-full bg-emerald-950/40 border border-[#0f3d2b]/60 flex items-center justify-center font-mono text-xs font-extrabold text-[#00ff87] uppercase">
                    {leader.username[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-xs text-emerald-100 truncate flex items-center gap-1">
                      <span>{leader.username}</span>
                      {idx === 0 && <span className="text-xs text-[#00ff87]">🏆</span>}
                    </p>
                    <p className="text-[10px] text-emerald-400/60 mt-0.5 font-medium">
                      {leader.total} reports · {leader.resolved} resolved
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-[#00ff87]">{leader.points} pts</p>
                  <p className="text-[8px] text-emerald-600/70 uppercase font-bold tracking-wider mt-0.5">Score</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-emerald-950/20 p-3.5 border border-[#0f3d2b]/30 flex items-start space-x-2.5 text-[10px] text-emerald-400 leading-relaxed font-normal">
            <AlertCircle className="h-4.5 w-4.5 text-[#00ff87] shrink-0 mt-0.5" />
            <p>
              <strong>Privacy Notice</strong>: Shadow Mode contributors are completely excluded from leaderboards. 
              Only users operating in public Guardian Mode appear in ranks.
            </p>
          </div>
        </div>

        {/* Top Wards Table */}
        <div className="lg:col-span-6 bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl flex flex-col space-y-4 backdrop-blur-md">
          <div className="border-b border-[#0f3d2b]/40 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                <span>Ward FixScores</span>
              </h2>
              <p className="text-[10px] text-emerald-400/70 mt-0.5 font-medium">Municipal zones ranked by response health</p>
            </div>
            <span className="text-[8px] uppercase tracking-widest font-extrabold bg-emerald-950/40 text-emerald-350 px-2.5 py-1 rounded-lg border border-[#0f3d2b]/65">
              Wards
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {neighborhoodLeaderboard.map((nh, idx) => (
              <div 
                key={nh.id}
                className="bg-[#02110c]/50 border border-[#0f3d2b]/60 p-4 rounded-xl flex items-center justify-between transition-all hover:border-[#00ff87]/30 hover:bg-[#031d13]/30"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <span className="font-mono text-sm font-extrabold text-emerald-500/40 w-5">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-xs text-emerald-100 truncate">{nh.name}</p>
                    <p className="text-[10px] text-emerald-400/60 mt-0.5 font-medium">
                      {nh.resolvedCount} completed · {nh.openCount} open
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-[#00ff87]">{Math.round(nh.fixScore)}/100</p>
                  <p className="text-[8px] text-emerald-600/70 uppercase font-bold tracking-wider mt-0.5">FixScore</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Impactful resolutions highlights */}
      <div className="bg-[#02130c]/85 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl space-y-5 max-w-5xl mx-auto backdrop-blur-md">
        <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5 border-b border-[#0f3d2b]/40 pb-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Hall of Resolution: Most Impactful Citizen Reports</span>
        </h2>

        {impactfulResolvedIssues.length === 0 ? (
          <div className="py-6 text-center text-xs text-emerald-500 italic font-normal">No highly upvoted, resolved issues exist yet in the database.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {impactfulResolvedIssues.map((issue) => (
              <div key={issue.id} className="bg-[#02110c]/50 border border-[#0f3d2b]/60 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-md hover:border-[#00ff87]/30 transition-all">
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#00ff87] capitalize">{issue.category}</span>
                    <span className="text-emerald-400/50 font-mono font-medium">#{issue.id.toUpperCase()}</span>
                  </div>
                  <p className="text-emerald-100 mt-2 line-clamp-3 leading-relaxed font-sans font-normal">{issue.description}</p>
                </div>

                <div className="border-t border-[#0f3d2b]/40 pt-2.5 flex items-center justify-between text-[10px] text-emerald-400/60 font-medium">
                  <span className="flex items-center gap-1">👥 {issue.upvotes} upvotes</span>
                  <span className="text-[#00ff87] font-bold">✔️ Genuine Fix</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
