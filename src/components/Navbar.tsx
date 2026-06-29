import { UserProfile } from "../types";
import { Shield, EyeOff, LayoutDashboard, Map, Award, TrendingUp, PlusCircle, LogIn, LogOut, FileText } from "lucide-react";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0f3d2b]/60 bg-[#010a06]/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div 
          onClick={() => onViewChange("landing")} 
          className="flex items-center space-x-2.5 cursor-pointer select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-[#00ff87] shadow-md shadow-emerald-500/20">
            <Shield className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-100">
              Civi<span className="text-[#00ff87]">Sync</span>
            </span>
            <span className="ml-1 text-[9px] font-mono tracking-wider bg-emerald-950/40 text-[#00ff87] px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-800/40">
              India
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => onViewChange("landing")}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              currentView === "landing" ? "text-[#00ff87] bg-emerald-950/20 border border-[#00ff87]/15" : "text-emerald-300 hover:text-emerald-100 hover:bg-[#031d13]/50"
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => onViewChange("map")}
            className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              currentView === "map" ? "text-[#00ff87] bg-emerald-950/20 border border-[#00ff87]/15" : "text-emerald-300 hover:text-emerald-100 hover:bg-[#031d13]/50"
            }`}
          >
            <Map className="h-4 w-4 text-[#00ff87]" />
            <span>Civic Map</span>
          </button>

          <button
            onClick={() => onViewChange("fixscore")}
            className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              currentView === "fixscore" ? "text-[#00ff87] bg-emerald-950/20 border border-[#00ff87]/15" : "text-emerald-300 hover:text-emerald-100 hover:bg-[#031d13]/50"
            }`}
          >
            <TrendingUp className="h-4 w-4 text-[#00ff87]" />
            <span>FixScores</span>
          </button>

          <button
            onClick={() => onViewChange("leaderboard")}
            className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              currentView === "leaderboard" ? "text-[#00ff87] bg-emerald-950/20 border border-[#00ff87]/15" : "text-emerald-300 hover:text-emerald-100 hover:bg-[#031d13]/50"
            }`}
          >
            <Award className="h-4 w-4 text-[#00ff87]" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => onViewChange("authority")}
            className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-bold rounded-lg transition-colors text-emerald-400 hover:text-emerald-350 bg-emerald-950/40 hover:bg-emerald-900/30 border border-[#00ff87]/30`}
          >
            <LayoutDashboard className="h-4 w-4 text-[#00ff87]" />
            <span>Authority Portal</span>
          </button>
        </nav>

        {/* User Auth Action Area */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <>
              {/* Profile Shortcut */}
              {currentUser.mode === "guardian" ? (
                <button
                  onClick={() => onViewChange("profile")}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    currentView === "profile" 
                      ? "border-[#00ff87]/40 bg-emerald-950/30 text-emerald-300" 
                      : "border-[#0f3d2b]/60 bg-[#02130c] text-emerald-300 hover:border-emerald-600 hover:text-emerald-100"
                  }`}
                >
                  <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center font-mono text-xs font-bold text-slate-950 uppercase">
                    {currentUser.username[0]}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">
                    {currentUser.username}
                  </span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#00ff87]/30 bg-[#02110a] text-emerald-300 cursor-default text-xs">
                  <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">Shadow Mode</span>
                </div>
              )}

              {/* Quick Report CTA */}
              <button
                onClick={() => onViewChange("report")}
                className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/10 hover:opacity-95 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Report Issue</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 text-emerald-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onViewChange("auth")}
              className="flex items-center space-x-1.5 rounded-lg bg-[#02130c] hover:bg-[#031d13] border border-[#0f3d2b]/60 px-4 py-1.5 text-xs font-semibold text-[#00ff87] transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4 text-[#00ff87]" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Nav Links */}
      <div className="flex md:hidden border-t border-[#0f3d2b]/40 bg-[#010a06]/95 px-4 py-2 justify-around text-xs text-slate-400">
        <button 
          onClick={() => onViewChange("landing")} 
          className={currentView === "landing" ? "text-[#00ff87] font-bold" : "text-emerald-400 hover:text-emerald-200"}
        >
          Home
        </button>
        <button 
          onClick={() => onViewChange("map")} 
          className={currentView === "map" ? "text-[#00ff87] font-bold" : "text-emerald-400 hover:text-emerald-200"}
        >
          Map
        </button>
        <button 
          onClick={() => onViewChange("fixscore")} 
          className={currentView === "fixscore" ? "text-[#00ff87] font-bold" : "text-emerald-400 hover:text-emerald-200"}
        >
          FixScores
        </button>
        <button 
          onClick={() => onViewChange("leaderboard")} 
          className={currentView === "leaderboard" ? "text-[#00ff87] font-bold" : "text-emerald-400 hover:text-emerald-200"}
        >
          Leaderboard
        </button>
        <button 
          onClick={() => onViewChange("authority")} 
          className={currentView === "authority" ? "text-[#00ff87] font-bold" : "text-emerald-400 hover:text-emerald-200"}
        >
          Portal
        </button>
      </div>
    </header>
  );
}
