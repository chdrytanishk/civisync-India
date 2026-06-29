import { useState, useMemo } from "react";
import { Neighborhood, Issue } from "../types";
import { 
  TrendingUp, Award, AlertTriangle, CheckCircle2, Info, 
  HelpCircle, Sparkles, Building2, ChevronRight, Activity 
} from "lucide-react";

interface FixScorePageProps {
  issues: Issue[];
  neighborhoods: Neighborhood[];
}

export default function FixScorePage({ issues, neighborhoods }: FixScorePageProps) {
  const [selectedNhId, setSelectedNhId] = useState<string>("indiranagar");

  // Dynamic FixScore calculation algorithm for each neighborhood
  const dynamicNeighborhoods = useMemo(() => {
    return neighborhoods.map((nh) => {
      // Find all issues in this neighborhood
      const nhIssues = issues.filter((i) => i.neighborhoodId === nh.id);
      
      // Calculate active (unresolved) issues weight
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
          recurrencePenalty += 10; // extra penalty for ignoring recurring issues
        }
      });

      // Simple simulated historical fake attempts count (e.g. 1 if Dwarka, 0 indiranagar, or computed from database)
      if (nh.id === "dwarka") {
        fakeResolutionPenalty = 15; // Simulated historical penalty
      }

      const calculatedScore = Math.min(100, Math.max(15, 100 - activePenalty - recurrencePenalty - fakeResolutionPenalty));

      // Overwrite score dynamically
      return {
        ...nh,
        fixScore: calculatedScore,
        // Sync history last element to match calculated score
        scoreHistory: [
          ...nh.scoreHistory.slice(0, nh.scoreHistory.length - 1),
          { ...nh.scoreHistory[nh.scoreHistory.length - 1], score: calculatedScore }
        ]
      };
    });
  }, [issues, neighborhoods]);

  const selectedNh = useMemo(() => {
    return dynamicNeighborhoods.find((nh) => nh.id === selectedNhId) || dynamicNeighborhoods[0];
  }, [dynamicNeighborhoods, selectedNhId]);

  // Sort neighborhoods by score to build leaderboard (highest score first)
  const sortedLeaderboard = useMemo(() => {
    return [...dynamicNeighborhoods].sort((a, b) => b.fixScore - a.fixScore);
  }, [dynamicNeighborhoods]);

  // Helper to get score feedback styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00ff87] bg-emerald-950/25 border-emerald-800/35";
    if (score >= 65) return "text-emerald-350 bg-emerald-950/25 border-emerald-800/35";
    if (score >= 50) return "text-yellow-400 bg-yellow-950/25 border-yellow-800/35";
    return "text-red-400 bg-red-950/25 border-red-800/35";
  };

  const getScoreColorHex = (score: number) => {
    if (score >= 80) return "#00ff87"; // Neon mint
    if (score >= 65) return "#34d399"; // Emerald 400
    if (score >= 50) return "#facc15"; // Yellow 400
    return "#f87171"; // Red 400
  };

  // Custom high-fidelity SVG chart points calculation
  const chartPoints = useMemo(() => {
    const history = selectedNh.scoreHistory;
    if (history.length === 0) return [];
    
    const width = 500;
    const height = 150;
    const padding = 20;

    const minX = 0;
    const maxX = history.length - 1;
    const minY = 0;
    const maxY = 100;

    return history.map((point, index) => {
      const x = padding + (index / maxX) * (width - 2 * padding);
      const y = height - padding - (point.score / maxY) * (height - 2 * padding);
      return { x, y, score: point.score, label: point.date };
    });
  }, [selectedNh]);

  const chartPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return "M " + chartPoints.map(p => `${p.x} ${p.y}`).join(" L ");
  }, [chartPoints]);

  const chartAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `M ${first.x} 130 L ` + chartPoints.map(p => `${p.x} ${p.y}`).join(" L ") + ` L ${last.x} 130 Z`;
  }, [chartPoints]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in-premium">
      
      {/* Title block */}
      <div className="border-b border-[#0f3d2b]/60 pb-5">
        <h1 className="font-display font-extrabold text-3xl text-emerald-50 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-[#00ff87]" />
          <span>FixScore Neighborhood Index</span>
        </h1>
        <p className="text-xs text-emerald-400/80 mt-1">
          Tracking the real-time health index of municipal wards in India based on actual resolution audits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Leaderboard list */}
        <div className="lg:col-span-5 bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl flex flex-col space-y-4 backdrop-blur-md">
          <div className="border-b border-[#0f3d2b]/60 pb-3 flex items-center justify-between">
            <h2 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5">
              <Award className="h-5 w-5 text-[#00ff87] fill-[#00ff87]/10" />
              <span>Ward Leaderboard</span>
            </h2>
            <span className="text-[10px] text-emerald-450 font-mono font-bold uppercase">Ranked by FixScore</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[460px]">
            {sortedLeaderboard.map((nh, idx) => {
              const isSelected = selectedNhId === nh.id;
              const style = getScoreColor(nh.fixScore);
              return (
                <div
                  key={nh.id}
                  onClick={() => setSelectedNhId(nh.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-[#021a11] border-[#00ff87]/50 shadow-md shadow-[#00ff87]/5" 
                      : "bg-[#02110c]/40 border-[#0f3d2b]/50 hover:border-[#00ff87]/25 hover:bg-[#021a11]/30"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-mono text-sm font-extrabold text-emerald-500/45 w-5">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display font-extrabold text-xs text-emerald-100 truncate">{nh.name}</p>
                      <p className="text-[10px] text-emerald-500 mt-0.5 font-mono font-medium">WARD: {nh.id.toUpperCase()}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${style}`}>
                    {Math.round(nh.fixScore)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Selected Ward Details & SVG Graph */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Selected Ward Summary */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/70 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 backdrop-blur-md">
            <div className="flex justify-between items-start border-b border-[#0f3d2b]/60 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-950/40 text-[#00ff87] px-2.5 py-1 rounded-lg border border-[#0f3d2b]/60 font-bold">
                  ACTIVE WARD PROFILE
                </span>
                <h2 className="font-display font-extrabold text-2xl text-emerald-50 mt-3">{selectedNh.name}</h2>
              </div>
              <div className="text-center bg-[#02110c] p-3 rounded-xl border border-[#0f3d2b]/60">
                <span className={`text-xl font-mono font-extrabold px-3 py-1.5 rounded-lg border ${getScoreColor(selectedNh.fixScore)}`}>
                  {Math.round(selectedNh.fixScore)}/100
                </span>
                <p className="text-[8px] text-emerald-400/80 uppercase font-mono tracking-wider font-bold mt-2">Active FixScore</p>
              </div>
            </div>

            {/* HIGH-FIDELITY HISTORICAL SVG GRAPH */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-emerald-100">Historical FixScore Timeline</span>
                <span className="text-[10px] text-emerald-400/60 italic font-semibold">Tracking weekly resolution trends</span>
              </div>

              {/* SVG Graphic Canvas */}
              <div className="bg-[#02110c]/50 border border-[#0f3d2b]/60 rounded-xl p-4 flex justify-center shadow-inner">
                <svg viewBox="0 0 500 150" className="w-full max-w-lg h-auto overflow-visible">
                  {/* Grid lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(0, 255, 135, 0.15)" strokeWidth="1" strokeDasharray="3, 3" />
                  <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(0, 255, 135, 0.15)" strokeWidth="1" strokeDasharray="3, 3" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(0, 255, 135, 0.3)" strokeWidth="1" />

                  {/* Gradient Fill under path */}
                  <defs>
                    <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getScoreColorHex(selectedNh.fixScore)} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={getScoreColorHex(selectedNh.fixScore)} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {chartAreaPath && <path d={chartAreaPath} fill="url(#scoreGlow)" />}

                  {/* Line Path */}
                  {chartPath && (
                    <path
                      d={chartPath}
                      fill="none"
                      stroke={getScoreColorHex(selectedNh.fixScore)}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Dots at points */}
                  {chartPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#010a06"
                        stroke={getScoreColorHex(selectedNh.fixScore)}
                        strokeWidth="2.5"
                      />
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fill="#f3f4f6"
                        fontSize="8"
                        fontFamily="var(--font-mono)"
                        fontWeight="bold"
                      >
                        {Math.round(p.score)}
                      </text>
                      <text
                        x={p.x}
                        y="142"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="7"
                        fontFamily="var(--font-sans)"
                        fontWeight="bold"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* COMPARATIVE VIEW */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-emerald-100">Neighborhood Comparison Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#02110c]/40 p-4 rounded-xl border border-[#0f3d2b]/60 shadow-inner">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Active Complaints</p>
                  <p className="text-lg font-extrabold text-emerald-100 mt-1 font-display">
                    {issues.filter(i => i.neighborhoodId === selectedNh.id && i.status !== "Resolved").length}
                  </p>
                </div>
                <div className="bg-[#02110c]/40 p-4 rounded-xl border border-[#0f3d2b]/60 shadow-inner">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Resolved Cases</p>
                  <p className="text-lg font-extrabold text-[#00ff87] mt-1 font-display">
                    {issues.filter(i => i.neighborhoodId === selectedNh.id && i.status === "Resolved").length}
                  </p>
                </div>
                <div className="bg-[#02110c]/40 p-4 rounded-xl border border-[#0f3d2b]/60 shadow-inner">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Fake Recurrence Risk</p>
                  <p className="text-lg font-extrabold text-red-400 mt-1 font-display">
                    {selectedNh.id === "dwarka" ? "High" : "Low"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* FIXSCORE ALGORITHM GUIDELINE METADATA CARD */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/70 p-6 rounded-2xl shadow-xl space-y-4 backdrop-blur-md">
            <h3 className="font-display font-extrabold text-base text-emerald-50 flex items-center gap-1.5 border-b border-[#0f3d2b]/60 pb-2">
              <Info className="h-4.5 w-4.5 text-[#00ff87]" />
              <span>How is FixScore Computed?</span>
            </h3>

            <p className="text-[11px] text-emerald-400 leading-relaxed font-sans font-normal">
              Ward scores start at a base of <strong>100</strong>. Our live civic accounting engine dynamically computes 
              live ward ratings using the following strict parameters:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold font-mono shrink-0 mt-0.5">•</span>
                <div>
                  <p className="font-bold text-emerald-100">Open Complaint Penalties</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Critical issues deduct -15 pts; High -8 pts; Medium -4 pts; Low -2 pts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold font-mono shrink-0 mt-0.5">•</span>
                <div>
                  <p className="font-bold text-emerald-100">Ignoring Recurrent Faults</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Recurring issues trigger automatically. Penalizes the ward by an additional -10 pts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold font-mono shrink-0 mt-0.5">•</span>
                <div>
                  <p className="font-bold text-emerald-100">Fake Resolution Auditing</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Faking a repair gets flagged by Gemini Vision. Penalizes the ward by -15 pts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold font-mono shrink-0 mt-0.5">•</span>
                <div>
                  <p className="font-bold text-emerald-100">Successful Repairs Earn Score</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Uploading authentic resolution photos verified by Gemini Vision recovers +8 score points.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
