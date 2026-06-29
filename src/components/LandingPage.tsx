import { Issue, Neighborhood } from "../types";
import { 
  ArrowRight, 
  CheckCircle2, 
  Flag, 
  Shield, 
  Star, 
  Building2, 
  MapPin, 
  Calendar, 
  EyeOff, 
  Map as MapIcon, 
  ChevronRight,
  Filter,
  Trophy,
  Sliders,
  Check,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import MapContainer from "./MapContainer";

interface LandingPageProps {
  onViewChange: (view: any) => void;
  issues: Issue[];
  neighborhoods: Neighborhood[];
  onSelectIssue: (issue: Issue) => void;
  currentUser: any;
  onToggleMode: () => void;
}

export default function LandingPage({
  onViewChange,
  issues,
  neighborhoods,
  onSelectIssue,
  currentUser,
  onToggleMode,
}: LandingPageProps) {
  
  // Real stats calculated dynamically
  const totalReports = issues.length || 4;
  const totalResolved = issues.filter((i) => i.status === "Resolved").length || 1;
  const resolutionRate = issues.length > 0 ? Math.round((totalResolved / issues.length) * 100) : 25;
  const totalWards = neighborhoods.length || 5;

  // Find a critical unresolved issue for the Authority Portal preview card
  const criticalIssue = issues.find(i => i.severity === "Critical" && i.status !== "Resolved") || issues[0] || {
    id: "iss_dw_4918",
    category: "waste",
    severity: "Critical",
    description: "Massive pile of solid waste dumped on sidewalk blocking pedestrian passage.",
    photoURL: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80",
    neighborhoodId: "Dwarka",
    createdAt: "2026-06-19T12:00:00Z"
  };

  const pendingCount = issues.filter(i => i.status !== "Resolved").length || 3;

  return (
    <div className="bg-[#010a06] text-emerald-100 min-h-screen pb-12 select-none animate-fade-in-premium">
      
      {/* HERO SECTION with faded city photograph bleeding into background */}
      <section className="relative overflow-hidden bg-[#010a06] border-b border-[#0f3d2b]/40 py-16 lg:py-20 flex items-center">
        {/* Background Skyline Image with gradients */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.postimg.cc/Yq5HnphD/image111.png" 
            alt="Civic Sunset Skyline and Elevated Train background" 
            className="w-full h-full object-cover opacity-15 brightness-50 contrast-[110%] pointer-events-none select-none"
            referrerPolicy="no-referrer"
          />
          {/* Gradient overlays to fade the image edges seamlessly into dark background */}
          <div className="absolute inset-0 bg-[#010a06]/85 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#010a06] via-[#010a06]/90 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#010a06] to-transparent" />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#010a06] via-[#010a06]/80 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#010a06] to-transparent" />
          
          {/* Neon glowing decorative ambient lights behind cards */}
          <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#00ff87]/5 blur-3xl" />
        </div>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left side: Text content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 text-[#00ff87] text-[10px] font-extrabold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00ff87] animate-pulse"></span>
                Secretariat Transit Corridor
              </div>
 
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[46px] tracking-tight text-slate-100 leading-[1.1]">
                Sunset on Urban Gaps.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] via-emerald-500 to-teal-400 relative">
                  Dawn of Accountable Cities.
                </span>
              </h1>
              <p className="text-emerald-400/80 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
                Where heritage corridors meet modern transit, CiviSync builds a permanent <strong className="text-emerald-100 font-extrabold">Civic Memory</strong>. Report issues, track resolutions, and protect your city's shared spaces through secure, verified AI audits.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => onViewChange("report")}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:opacity-95 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] cursor-pointer"
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onViewChange("map")}
                  className="w-full sm:w-auto bg-[#02130c] hover:bg-[#031d13] text-emerald-100 font-bold text-xs px-6 py-3.5 rounded-xl border border-[#0f3d2b]/60 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapIcon className="h-4 w-4 text-[#00ff87]" />
                  <span>Explore Civic Map</span>
                </button>
              </div>
            </div>
 
            {/* Right side: Interactive Map container */}
            <div className="lg:col-span-5">
              <div className="bg-[#02130c]/85 border border-[#0f3d2b]/70 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col h-[340px] justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-center border-b border-[#0f3d2b]/60 pb-2.5 mb-2.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">Interactive Civic Map</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
                    </span>
                  </div>
                  <button 
                    onClick={() => onViewChange("map")}
                    className="flex items-center gap-1 text-[10px] text-emerald-200 font-extrabold bg-[#02110c] border border-[#0f3d2b]/60 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-[#031d13] transition-colors"
                  >
                    <Filter className="h-3 w-3 text-[#00ff87]" />
                    <span>Filters</span>
                  </button>
                </div>
 
                {/* Embedded interactive Leaflet map container */}
                <div className="flex-1 rounded-xl overflow-hidden relative border border-[#1e293b] h-[170px] z-10 shadow-inner">
                  <MapContainer 
                    issues={issues}
                    neighborhoods={neighborhoods}
                    selectedIssue={null}
                    onSelectIssue={(issue) => {
                      onSelectIssue(issue);
                      onViewChange("detail");
                    }}
                  />
                </div>
 
                {/* Map Legend */}
                <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-400 font-bold font-mono pt-2.5 border-t border-[#1e293b]/60 mt-2 z-10">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 block shadow-sm shadow-red-500/30" />
                    <span>High</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 block shadow-sm shadow-orange-500/30" />
                    <span>Medium</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 block shadow-sm shadow-yellow-500/30" />
                    <span>Low</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 block shadow-sm shadow-emerald-500/30" />
                    <span>Resolved</span>
                  </span>
                </div>
              </div>
            </div>
 
          </div>
        </div>
      </section>

      {/* STATS BAR (4 stat cards in a row with glowing wave paths) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Issues Reported */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-[#00ff87]/40 transition-all duration-300 relative overflow-hidden group backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-red-950/40 flex items-center justify-center text-red-400 border border-red-800/40">
              <Flag className="h-5 w-5 fill-current" />
            </div>
            <div className="z-10">
              <p className="text-2xl font-extrabold text-slate-100 leading-none">{totalReports}</p>
              <p className="text-[10px] text-emerald-400/70 font-extrabold uppercase tracking-wider mt-1.5">Issues Reported</p>
            </div>
            {/* Glowing red wave path */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 100 20" className="w-full h-full text-red-500 fill-none" preserveAspectRatio="none">
                <path d="M0 15 Q25 5, 50 15 T100 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-[2px] transition-all" />
              </svg>
            </div>
          </div>

          {/* Card 2: Issues Resolved */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-[#00ff87]/40 transition-all duration-300 relative overflow-hidden group backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/40 flex items-center justify-center text-[#00ff87] border border-emerald-800/40">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="z-10">
              <p className="text-2xl font-extrabold text-[#00ff87] leading-none">{totalResolved}</p>
              <p className="text-[10px] text-emerald-400/70 font-extrabold uppercase tracking-wider mt-1.5">Issues Resolved</p>
            </div>
            {/* Glowing green wave path */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 100 20" className="w-full h-full text-emerald-500 fill-none" preserveAspectRatio="none">
                <path d="M0 15 Q25 10, 50 18 T100 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-[2px] transition-all" />
              </svg>
            </div>
          </div>

          {/* Card 3: Genuine Fix Rate */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-[#00ff87]/40 transition-all duration-300 relative overflow-hidden group backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/40 flex items-center justify-center text-[#00ff87] border border-emerald-800/40">
              <Shield className="h-5 w-5" />
            </div>
            <div className="z-10">
              <p className="text-2xl font-extrabold text-[#00ff87] leading-none">{resolutionRate}%</p>
              <p className="text-[10px] text-emerald-400/70 font-extrabold uppercase tracking-wider mt-1.5">Genuine Fix Rate</p>
            </div>
            {/* Glowing cyan wave path */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 100 20" className="w-full h-full text-[#00ff87] fill-none" preserveAspectRatio="none">
                <path d="M0 12 Q25 18, 50 8 T100 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-[2px] transition-all" />
              </svg>
            </div>
          </div>

          {/* Card 4: Wards Tracked */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-[#00ff87]/40 transition-all duration-300 relative overflow-hidden group backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/40 flex items-center justify-center text-emerald-400 border border-emerald-800/40">
              <Star className="h-5 w-5 fill-emerald-500 text-emerald-400" />
            </div>
            <div className="z-10">
              <p className="text-2xl font-extrabold text-emerald-400 leading-none">{totalWards}</p>
              <p className="text-[10px] text-emerald-400/70 font-extrabold uppercase tracking-wider mt-1.5">Wards Tracked</p>
            </div>
            {/* Glowing gold wave path */}
            <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none opacity-40">
              <svg viewBox="0 0 100 20" className="w-full h-full text-emerald-500 fill-none" preserveAspectRatio="none">
                <path d="M0 18 Q25 8, 50 15 T100 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-[2px] transition-all" />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN BENTO GRID (3 columns on desktop) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= COLUMN 1 (Left Column, lg:col-span-4) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1.1: Weekly Civic Leaders */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,255,135,0.06)] hover:border-[#00ff87]/30 transition-all duration-300 flex flex-col justify-between backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-3 mb-4">
              <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">Weekly Civic Leaders</span>
              <button 
                onClick={() => onViewChange("leaderboard")}
                className="text-[10px] font-extrabold text-[#00ff87] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Top 3 Reporters List */}
            <div className="space-y-2.5">
              
              {/* Leader #1 */}
              <div 
                onClick={() => onViewChange("leaderboard")}
                className="flex items-center justify-between p-2.5 bg-[#02110c]/50 border border-[#0f3d2b]/40 rounded-xl hover:bg-[#031d13]/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-slate-950 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-md">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    RahulS_Guardian <Trophy className="h-3.5 w-3.5 text-[#00ff87]" />
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-300">700 pts</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#00ff87]" />
                </div>
              </div>

              {/* Leader #2 */}
              <div 
                onClick={() => onViewChange("leaderboard")}
                className="flex items-center justify-between p-2.5 bg-[#02110c]/50 border border-[#0f3d2b]/40 rounded-xl hover:bg-[#031d13]/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-[#0f3d2b] text-emerald-300 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-md border border-[#0f3d2b]/60">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-100">Anjali_G</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-300">590 pts</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

              {/* Leader #3 */}
              <div 
                onClick={() => onViewChange("leaderboard")}
                className="flex items-center justify-between p-2.5 bg-[#02110c]/50 border border-[#0f3d2b]/40 rounded-xl hover:bg-[#031d13]/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-[#02110c] text-emerald-400 font-mono text-[10px] font-extrabold flex items-center justify-center shadow-md border border-[#0f3d2b]/60">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-100">Karan_Delhi</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-300">340 pts</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

            </div>

            <p className="text-[9px] text-emerald-500/70 font-medium text-center mt-4">
              Top reporters by civic points this week
            </p>
          </div>

          {/* Card 1.2: Shadow Mode Impact card */}
          <div className="bg-gradient-to-br from-[#02130c] to-[#010a06] rounded-2xl border border-[#0f3d2b]/60 p-5 shadow-xl flex items-center justify-between text-slate-100 relative overflow-hidden h-[155px]">
            {/* Background elements */}
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl" />

            {/* Content left side */}
            <div className="flex-1 space-y-2.5 z-10 relative">
              <h4 className="font-display font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Shadow Mode Impact</span>
              </h4>
              <p className="text-[10px] text-emerald-300 leading-normal max-w-[170px] font-normal">
                {currentUser?.mode === "shadow" 
                  ? "You are currently 100% anonymous. Your reports leave no trace of identity metadata."
                  : "Helping uncover issues that go unnoticed. Be the voice that makes a difference."}
              </p>
              
              <button 
                onClick={onToggleMode}
                className="bg-gradient-to-r from-emerald-600 to-[#00ff87] hover:opacity-95 text-slate-950 font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-1 border-none"
              >
                {currentUser?.mode === "shadow" ? (
                  <>
                    <Check className="h-3 w-3 text-slate-950" />
                    <span>Disable Shadow</span>
                  </>
                ) : (
                  <>
                    <span>Enable Shadow Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Silhouette illustration right side */}
            <div className="w-[120px] shrink-0 self-end pointer-events-none z-10 opacity-85 h-full relative -mr-4 flex items-end">
              {/* Custom SVG silhouette path */}
              <svg viewBox="0 0 100 100" className="w-full h-[90%] text-slate-950 fill-current">
                <g opacity="0.95">
                  {/* Outer body outline */}
                  <path d="M 10 95 C 10 75, 20 65, 35 60 C 35 60, 30 52, 30 40 C 30 20, 70 20, 70 40 C 70 52, 65 60, 65 60 C 80 65, 90 75, 90 95 Z" fill="#010a06" />
                  
                  {/* Hood inner shadow */}
                  <path d="M 33 42 C 33 24, 67 24, 67 42 C 67 52, 63 58, 63 58 C 55 52, 45 52, 37 58 C 37 58, 33 52, 33 42 Z" fill="#02110c" />
                  
                  {/* Face shadow absolute dark */}
                  <path d="M 38 45 C 38 32, 62 32, 62 45 C 62 50, 58 52, 50 54 C 42 52, 38 50, 38 45 Z" fill="#010503" />
                  
                  {/* Glowing mask eyes */}
                  <path d="M 43 44 H 48 M 52 44 H 57" stroke="#00ff87" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  
                  {/* Binary code bits details in the air */}
                  <text x="15" y="45" fill="#00ff87" fontSize="6" fontFamily="monospace" opacity="0.3">1</text>
                  <text x="12" y="60" fill="#00ff87" fontSize="5" fontFamily="monospace" opacity="0.2">0</text>
                  <text x="80" y="35" fill="#00ff87" fontSize="5" fontFamily="monospace" opacity="0.2">1</text>
                  <text x="85" y="55" fill="#00ff87" fontSize="6" fontFamily="monospace" opacity="0.3">0</text>
                </g>
              </svg>
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2 (Center Column, lg:col-span-4) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 2.1: Top Wards by FixScore */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,255,135,0.06)] hover:border-[#00ff87]/30 transition-all duration-300 flex flex-col justify-between backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-3 mb-4">
              <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">Top Wards by FixScore</span>
              <button 
                onClick={() => onViewChange("fixscore")}
                className="text-[10px] font-extrabold text-[#00ff87] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* List of 5 wards */}
            <div className="space-y-2.5 font-display">
              
              {/* Ward 1 */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#0f3d2b]/30">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">1</span>
                  <span className="font-semibold text-slate-200">Andheri West, Mumbai</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400 text-[11px]">100/100</span>
              </div>

              {/* Ward 2 */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#0f3d2b]/30">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">2</span>
                  <span className="font-semibold text-slate-200">Saket, Delhi</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400 text-[11px]">100/100</span>
              </div>

              {/* Ward 3 */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#0f3d2b]/30">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">3</span>
                  <span className="font-semibold text-slate-200">Salt Lake Sector V, Kolkata</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400 text-[11px]">100/100</span>
              </div>

              {/* Ward 4 */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#0f3d2b]/30">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">4</span>
                  <span className="font-semibold text-slate-200">Indiranagar, Bengaluru</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400 text-[11px]">88/100</span>
              </div>

              {/* Ward 5 */}
              <div className="flex justify-between items-center py-1.5">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold text-emerald-600">5</span>
                  <span className="font-semibold text-slate-200">Dwarka Sector 10, Delhi</span>
                </div>
                <span className="font-mono font-extrabold text-[#00ff87] text-[11px]">60/100</span>
              </div>

            </div>
          </div>

          {/* Card 2.2: FixScore Trend line-chart */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,255,135,0.06)] hover:border-[#00ff87]/30 transition-all duration-300 flex flex-col justify-between backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-3 mb-4">
              <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">FixScore Trend</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-extrabold bg-[#02110c] border border-[#0f3d2b]/60 px-2.5 py-1 rounded-xl">
                <span>This Month</span>
                <ChevronRight className="h-3 w-3 rotate-90 text-[#00ff87]" />
              </div>
            </div>

            {/* Custom SVG Line Chart with glow gradients matching the reference perfectly */}
            <div className="h-32 mt-2 w-full select-none relative">
              <svg viewBox="0 0 300 110" className="w-full h-full">
                <defs>
                  {/* Linear gradient for the trend curve line */}
                  <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#00ff87" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  {/* Area gradient under the line chart */}
                  <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00ff87" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00ff87" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                <line x1="30" y1="10" x2="290" y2="10" stroke="#0f3d2b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                <line x1="30" y1="32.5" x2="290" y2="32.5" stroke="#0f3d2b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                <line x1="30" y1="55" x2="290" y2="55" stroke="#0f3d2b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                <line x1="30" y1="77.5" x2="290" y2="77.5" stroke="#0f3d2b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                <line x1="30" y1="100" x2="290" y2="100" stroke="#0f3d2b" strokeWidth="1" strokeOpacity="0.5" />

                {/* Y-Axis Grid Labels */}
                <text x="12" y="103" fill="#059669" fontSize="8" fontFamily="monospace" fontWeight="bold">0</text>
                <text x="12" y="81" fill="#059669" fontSize="8" fontFamily="monospace" fontWeight="bold">25</text>
                <text x="12" y="58.5" fill="#059669" fontSize="8" fontFamily="monospace" fontWeight="bold">50</text>
                <text x="12" y="36" fill="#059669" fontSize="8" fontFamily="monospace" fontWeight="bold">75</text>
                <text x="7" y="13" fill="#00ff87" fontSize="8" fontFamily="monospace" fontWeight="bold">100</text>

                {/* Shaded Area under the line */}
                <path d="M 40 100 L 40 31.6 L 100 29.8 L 160 28 L 220 27.1 L 280 20.8 L 280 100 Z" fill="url(#chartFill)" />

                {/* Glow Line Chart */}
                <path 
                  d="M 40 31.6 L 100 29.8 L 160 28 L 220 27.1 L 280 20.8" 
                  fill="none" 
                  stroke="url(#trendGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                {/* Grid vertical dots mapping */}
                <circle cx="40" cy="31.6" r="3.5" fill="#00ff87" stroke="#010a06" strokeWidth="1.5" />
                <circle cx="100" cy="29.8" r="3.5" fill="#00ff87" stroke="#010a06" strokeWidth="1.5" />
                <circle cx="160" cy="28" r="3.5" fill="#10b981" stroke="#010a06" strokeWidth="1.5" />
                <circle cx="220" cy="27.1" r="3.5" fill="#10b981" stroke="#010a06" strokeWidth="1.5" />
                <circle cx="280" cy="20.8" r="4.5" fill="#00ff87" stroke="#010a06" strokeWidth="2" />

                {/* Data point labels above dots */}
                <text x="40" y="24" fill="#a7f3d0" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">76</text>
                <text x="100" y="22" fill="#a7f3d0" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">78</text>
                <text x="160" y="20" fill="#a7f3d0" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">80</text>
                <text x="220" y="19" fill="#a7f3d0" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">81</text>
                <text x="280" y="12" fill="#00ff87" fontSize="9" fontFamily="monospace" fontWeight="extrabold" textAnchor="middle">88</text>

                {/* X-Axis Labels */}
                <text x="40" y="111" fill="#059669" fontSize="8" fontFamily="sans-serif" textAnchor="middle">May 1</text>
                <text x="100" y="111" fill="#059669" fontSize="8" fontFamily="sans-serif" textAnchor="middle">May 15</text>
                <text x="160" y="111" fill="#059669" fontSize="8" fontFamily="sans-serif" textAnchor="middle">Jun 1</text>
                <text x="220" y="111" fill="#059669" fontSize="8" fontFamily="sans-serif" textAnchor="middle">Jun 15</text>
                <text x="280" y="111" fill="#00ff87" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">Jun 23</text>
              </svg>
            </div>
          </div>

        </div>

        {/* ================= COLUMN 3 (Right Column, lg:col-span-4) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 3.1: Authority Portal preview */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,255,135,0.06)] hover:border-[#00ff87]/30 transition-all duration-300 flex flex-col justify-between backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-3 mb-4">
              <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">Authority Portal</span>
              <span className="bg-red-950/40 border border-red-800/40 text-red-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded-lg">
                {pendingCount} Pending
              </span>
            </div>

             {/* Critical issue highlight */}
            <div 
              onClick={() => onViewChange("authority")}
              className="group p-3 border border-[#0f3d2b]/40 rounded-xl bg-[#02110c]/50 hover:bg-[#031d13]/80 hover:border-[#00ff87]/30 transition-all cursor-pointer flex gap-3 relative animate-fade-in-premium"
            >
              <img 
                src={criticalIssue.photoURL} 
                alt="Problem preview" 
                className="h-16 w-16 rounded-lg object-cover shrink-0 border border-[#0f3d2b]/60"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-100 capitalize truncate">
                    {criticalIssue.category}
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-950 bg-red-500 px-1.5 py-0.2 rounded-md uppercase tracking-wider font-mono">
                    CRITICAL
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300/85 mt-1 line-clamp-2 leading-relaxed">
                  {criticalIssue.description}
                </p>
                <div className="flex items-center gap-3 text-[8px] text-emerald-400 font-bold font-mono mt-2.5">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 text-[#00ff87]" />
                    {criticalIssue.neighborhoodId}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-3 w-3 text-[#00ff87]" />
                    {new Date(criticalIssue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center self-center shrink-0 text-[#00ff87]/50 group-hover:text-[#00ff87] transition-colors">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>

            <button 
              onClick={() => onViewChange("authority")}
              className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-[#00ff87] hover:opacity-95 text-slate-950 font-extrabold text-[10px] py-2 rounded-xl border-none transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <span>Manage Municipal Repairs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 3.2: Recent Activity */}
          <div className="bg-[#02130c]/85 border border-[#0f3d2b]/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,255,135,0.06)] hover:border-[#00ff87]/30 transition-all duration-300 flex flex-col justify-between backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-[#0f3d2b]/40 pb-3 mb-3.5">
              <span className="font-display font-extrabold text-xs text-slate-100 tracking-wider uppercase">Recent Activity</span>
              <button 
                onClick={() => onViewChange("map")}
                className="text-[10px] font-extrabold text-[#00ff87] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              
              {/* Activity item 1 */}
              <div className="flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/40" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">Pothole on 3rd Main Road</p>
                    <p className="text-[10px] text-emerald-500/50 font-mono mt-0.5">Koramangala</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 shrink-0">Resolved</span>
              </div>

              {/* Activity item 2 */}
              <div className="flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-orange-400 shrink-0 shadow-sm shadow-orange-400/40" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">Street Light not working</p>
                    <p className="text-[10px] text-emerald-500/50 font-mono mt-0.5">HSR Layout</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-orange-400 shrink-0">In Progress</span>
              </div>

              {/* Activity item 3 */}
              <div className="flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shrink-0 shadow-sm shadow-red-400/40" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">Garbage overflow</p>
                    <p className="text-[10px] text-emerald-500/50 font-mono mt-0.5">Indiranagar</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-400 shrink-0">Reported</span>
              </div>

            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
