import { useState, useEffect, useMemo } from "react";
import { Issue, Resolution, IssueHistoryLog, UserProfile, HistoryEvent, ActorRole } from "../types";
import { dbService } from "../lib/firebase";
import { 
  ArrowLeft, ThumbsUp, Calendar, MapPin, Eye, Clock, Award, 
  Sparkles, ShieldAlert, CheckCircle2, History, AlertTriangle, Loader2 
} from "lucide-react";

interface IssueDetailPageProps {
  selectedIssue: Issue | null;
  issues: Issue[];
  onViewChange: (view: any) => void;
  currentUser: UserProfile | null;
  onUpvote: (issueId: string) => void;
}

export default function IssueDetailPage({
  selectedIssue,
  issues,
  onViewChange,
  currentUser,
  onUpvote,
}: IssueDetailPageProps) {
  const [historyLogs, setHistoryLogs] = useState<IssueHistoryLog[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [civicSummary, setCivicSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // If no issue selected, fail gracefully
  if (!selectedIssue) {
    return (
      <div className="p-8 text-center max-w-md mx-auto text-slate-300">
        <p className="text-sm text-slate-450 font-normal">No issue selected.</p>
        <button onClick={() => onViewChange("map")} className="mt-4 text-cyan-405 hover:underline font-bold">
          Go back to Map
        </button>
      </div>
    );
  }

  // Find all historical issues within 100m of this coordinate (Civic Memory)
  const nearbyHistoricalIssues = useMemo(() => {
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    return issues.filter((i) => {
      const dist = getDistance(selectedIssue.location.lat, selectedIssue.location.lng, i.location.lat, i.location.lng);
      return dist <= 100; // 100m radius
    });
  }, [issues, selectedIssue]);

  const recurringCount = nearbyHistoricalIssues.length;
  const resolvedCount = nearbyHistoricalIssues.filter(i => i.status === "Resolved").length;

  // 1. Load Issue history logs & resolution details
  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      try {
        const logs = await dbService.getHistoryLogs();
        const resList = await dbService.getResolutions();
        
        if (active) {
          // Filter logs for this specific issue
          const filteredLogs = logs
            .filter((l) => l.issueId === selectedIssue.id)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setHistoryLogs(filteredLogs);

          // Find resolution if resolved
          const filteredResolutions = resList.filter((r) => r.issueId === selectedIssue.id);
          setResolutions(filteredResolutions);
        }
      } catch (err) {
        console.error("Error loading issue details:", err);
      }
    };

    loadDetails();
    return () => {
      active = false;
    };
  }, [selectedIssue]);

  // 2. Fetch Gemini Civic Memory Summary
  useEffect(() => {
    let active = true;
    const fetchCivicSummary = async () => {
      setLoadingSummary(true);
      try {
        const response = await fetch("/api/gemini/summarize-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issues: nearbyHistoricalIssues.map(i => ({
              category: i.category,
              status: i.status,
              createdAt: i.createdAt,
              resolvedAt: i.resolvedAt,
              severity: i.severity,
              isRecurring: i.isRecurring
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (active && data.summary) {
            setCivicSummary(data.summary);
          }
        } else {
          throw new Error("Summary API failed");
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setCivicSummary(`This municipal location has had ${recurringCount} issues reported in total. ${resolvedCount} were marked resolved but infrastructure failures continue to be reported at this coordinate.`);
        }
      } finally {
        if (active) setLoadingSummary(false);
      }
    };

    if (nearbyHistoricalIssues.length > 0) {
      fetchCivicSummary();
    }
    return () => {
      active = false;
    };
  }, [nearbyHistoricalIssues]);

  const getTimelineIcon = (event: HistoryEvent) => {
    switch (event) {
      case "reported":
        return "📝";
      case "upvoted":
        return "ThumbsUp";
      case "assigned":
        return "⚙️";
      case "resolution_attempted":
        return "👷";
      case "verified":
        return "🛡️";
      case "recurred":
        return "🔁";
      default:
        return "📍";
    }
  };

  const getActorLabel = (role: ActorRole) => {
    switch (role) {
      case "authority":
        return <span className="bg-emerald-950/40 border border-emerald-800/40 text-[#00ff87] text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Authority</span>;
      case "citizen":
        return <span className="bg-emerald-950/40 border border-[#0f3d2b]/50 text-emerald-400 text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Citizen</span>;
      default:
        return <span className="bg-emerald-950/20 border border-[#0f3d2b]/40 text-emerald-500 text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">System</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in-premium">
      
      {/* Return Button */}
      <div className="mb-6 flex items-center justify-between max-w-5xl mx-auto">
        <button
          onClick={() => onViewChange("map")}
          className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-200 transition-colors font-bold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Civic Map Feed</span>
        </button>

        {selectedIssue.isRecurring && (
          <span className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-800/40 text-rose-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Recurring Problem: {selectedIssue.recurrenceCount} Recurrences</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
        
        {/* Left column: Core Details & Timeline */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Issue Header and Photos */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-[#00ff87] font-mono font-bold tracking-wider bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-800/40">
                  Case ID: #{selectedIssue.id.toUpperCase()}
                </span>
                <h1 className="font-display font-extrabold text-2xl text-emerald-50 capitalize mt-3">
                  {selectedIssue.category}
                </h1>
                <p className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-0.5 mt-1 font-medium">
                  <MapPin className="h-3 w-3 text-[#00ff87]" />
                  <span>GPS Coordinate: {selectedIssue.location.lat.toFixed(5)}, {selectedIssue.location.lng.toFixed(5)}</span>
                </p>
              </div>

              <div className="flex flex-col items-end text-xs">
                {selectedIssue.status === "Resolved" ? (
                  <span className="bg-emerald-950/40 border border-emerald-805 text-[#00ff87] px-3 py-1 rounded-full font-bold">Resolved</span>
                ) : selectedIssue.status === "In Progress" ? (
                  <span className="bg-amber-950/40 border border-amber-800/40 text-amber-400 px-3 py-1 rounded-full font-bold">In Progress</span>
                ) : (
                  <span className="bg-rose-950/40 border border-rose-800/40 text-rose-400 px-3 py-1 rounded-full font-bold">Open</span>
                )}
                <span className="text-[10px] text-emerald-500 mt-2 font-bold font-mono">
                  {new Date(selectedIssue.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Photo & Description */}
            <div className="aspect-[16/10] rounded-xl overflow-hidden border border-[#0f3d2b]/70 relative bg-[#010905] shadow-sm">
              <img 
                src={selectedIssue.photoURL} 
                alt="Civic issue" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#02130c]/90 px-2.5 py-1 rounded text-[10px] font-bold border border-[#0f3d2b]/70 text-emerald-200 shadow-sm">
                BEFORE photo
              </div>
            </div>

            <div className="bg-[#02110c]/50 p-4 rounded-xl border border-[#0f3d2b]/60">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Citizen Description</p>
              <p className="text-xs text-emerald-100 leading-relaxed font-sans font-normal">{selectedIssue.description}</p>
              
              {/* Reported By Meta (Guardian Mode or Shadow Mode) */}
              <div className="border-t border-[#0f3d2b]/70 mt-3 pt-2.5 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  Reporter Mode: 
                  {selectedIssue.reportedByUsername ? (
                    <span className="text-[#00ff87] font-extrabold">🛡️ Guardian ({selectedIssue.reportedByUsername})</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">🔒 Anonymous Shadow Mode</span>
                  )}
                </span>
                
                <button
                  onClick={() => onUpvote(selectedIssue.id)}
                  disabled={currentUser && selectedIssue.upvotedBy?.includes(currentUser.uid)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                    currentUser && selectedIssue.upvotedBy?.includes(currentUser.uid)
                      ? "border-emerald-800 bg-emerald-950/30 text-[#00ff87]"
                      : "border-[#0f3d2b]/70 hover:border-[#00ff87]/30 bg-[#010905] text-emerald-300 shadow-md"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>Upvoted ({selectedIssue.upvotes})</span>
                </button>
              </div>
            </div>

          </div>

          {/* CHRONOLOGICAL TIMELINE */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            <h2 className="font-display font-extrabold text-lg text-emerald-50 flex items-center gap-2 mb-6">
              <History className="h-5 w-5 text-[#00ff87]" />
              <span>Civic Action Timeline</span>
            </h2>

            {historyLogs.length === 0 ? (
              <div className="py-4 text-center text-xs text-emerald-600 italic font-normal">No timeline entries available.</div>
            ) : (
              <div className="relative border-l border-[#0f3d2b]/60 ml-3 pl-6 space-y-6">
                {historyLogs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Circle Ping Indicator */}
                    <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#010905] border border-[#0f3d2b]/60 text-xs shadow-md">
                      {log.event === "reported" ? "📝" :
                       log.event === "upvoted" ? "👍" :
                       log.event === "assigned" ? "⚙️" :
                       log.event === "resolution_attempted" ? "👷" :
                       log.event === "verified" ? "🛡️" : "🔁"}
                    </span>

                    <div className="text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-emerald-200 capitalize">{log.event.replace("_", " ")}</span>
                        {getActorLabel(log.actorRole)}
                        <span className="text-[10px] text-emerald-500 font-mono font-bold">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-emerald-300 mt-1 leading-relaxed text-[11px] font-normal">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Civic Memory (Gemini summary) & ProofChain */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CIVIC MEMORY PANEL (GEMINI SUMMARY) */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#0f3d2b]/60 pb-3">
              <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#00ff87] animate-pulse" />
                <span>Gemini Civic Memory AI</span>
              </h2>
              <span className="text-[9px] font-mono bg-[#02130c]/90 text-[#00ff87] px-2 py-0.5 rounded border border-[#0f3d2b]/60 uppercase font-bold">
                Analytical
              </span>
            </div>

            <div className="text-xs">
              <div className="flex items-center gap-1.5 mb-2 font-bold text-emerald-200">
                <span>Location Profile Summary</span>
              </div>
              
              {loadingSummary ? (
                <div className="py-4 text-emerald-400/80 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00ff87]" />
                  <span className="text-[11px] italic font-medium">Gemini is compiling neighborhood history logs...</span>
                </div>
              ) : (
                <p className="text-emerald-200 leading-relaxed text-[11px] bg-[#02110c]/50 p-3.5 rounded-xl border border-[#0f3d2b]/60 shadow-inner font-normal">
                  {civicSummary || "Civic memory summary not generated yet."}
                </p>
              )}
            </div>

            {/* Quick Location stats */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#02110c]/50 p-3 rounded-xl border border-[#0f3d2b]/60 text-center shadow-xs">
                <p className="text-lg font-extrabold text-emerald-50 font-display">{recurringCount}</p>
                <p className="text-[9px] text-emerald-450 uppercase tracking-wider font-semibold">Reports at Spot</p>
              </div>
              <div className="bg-[#02110c]/50 p-3 rounded-xl border border-[#0f3d2b]/60 text-center shadow-xs">
                <p className="text-lg font-extrabold text-[#00ff87] font-display">{resolvedCount}</p>
                <p className="text-[9px] text-emerald-450 uppercase tracking-wider font-semibold">Resolved Prior</p>
              </div>
            </div>
          </div>

          {/* PROOFCHAIN VERIFICATION PANEL */}
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#0f3d2b]/60 pb-3">
              <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#00ff87]" />
                <span>ProofChain Auditing</span>
              </h2>
              <span className="text-[9px] font-mono bg-emerald-950/40 text-[#00ff87] px-2 py-0.5 rounded border border-emerald-800/40 uppercase font-bold">
                Verified
              </span>
            </div>

            {resolutions.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-600 bg-[#02110c]/50 rounded-xl border border-[#0f3d2b]/60 italic font-normal shadow-xs">
                No resolution audit records exist. Waiting for municipal crew to upload "After" resolution photos.
              </div>
            ) : (
              <div className="space-y-4">
                {resolutions.map((res, index) => (
                  <div key={index} className="space-y-4 text-xs">
                    
                    {/* Before vs After Side-by-side images */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="rounded-lg overflow-hidden border border-[#0f3d2b]/70 h-28 relative bg-[#010905] shadow-sm">
                        <img 
                          src={res.beforePhotoURL} 
                          alt="Before" 
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-[#02130c]/90 text-[8px] font-mono px-1.5 py-0.2 rounded text-emerald-200 font-bold border border-[#0f3d2b]/70 shadow-sm">
                          Before
                        </span>
                      </div>

                      <div className="rounded-lg overflow-hidden border border-[#0f3d2b]/70 h-28 relative bg-[#010905] shadow-sm">
                        <img 
                          src={res.afterPhotoURL} 
                          alt="After" 
                          className="w-full h-full object-cover animate-pulse"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-emerald-950 border border-emerald-800/40 text-[8px] font-mono px-1.5 py-0.2 rounded text-[#00ff87] font-bold shadow-sm">
                          Resolution
                        </span>
                      </div>
                    </div>

                    {/* Gemini Supervision Verdict block */}
                    <div className={`p-4 rounded-xl border ${
                      res.geminiVerdict === "Genuine Fix" 
                        ? "bg-emerald-950/30 border border-emerald-800/40 text-emerald-300" 
                        : "bg-rose-950/30 border border-rose-800/40 text-rose-300"
                    }`}>
                      <div className="flex items-center space-x-1.5 font-extrabold mb-1">
                        <Sparkles className="h-4 w-4 animate-spin text-[#00ff87] shrink-0" />
                        <span>Gemini Vision Audit Verdict:</span>
                        <span className="underline font-extrabold">{res.geminiVerdict}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 mt-1 leading-relaxed font-normal">{res.reason}</p>
                    </div>

                    <div className="text-[9px] text-emerald-500 font-mono text-center font-bold">
                      Audit Timestamp: {new Date(res.verifiedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
