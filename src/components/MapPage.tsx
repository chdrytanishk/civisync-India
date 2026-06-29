import { useState, useMemo } from "react";
import { Issue, IssueCategory, IssueSeverity, IssueStatus, Neighborhood } from "../types";
import MapContainer from "./MapContainer";
import { 
  Filter, Calendar, Eye, ThumbsUp, MapPin, Search, Grid, 
  List, Sliders, ChevronRight, Activity, Clock
} from "lucide-react";

interface MapPageProps {
  issues: Issue[];
  neighborhoods: Neighborhood[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue | null) => void;
  onViewChange: (view: any) => void;
  currentUser: any;
  onUpvote: (issueId: string) => void;
}

export default function MapPage({
  issues,
  neighborhoods,
  selectedIssue,
  onSelectIssue,
  onViewChange,
  currentUser,
  onUpvote,
}: MapPageProps) {
  // Filters State
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const matchSeverity = severityFilter === "all" || issue.severity === severityFilter;
      const matchSearch = 
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchStatus && matchCategory && matchSeverity && matchSearch;
    });
  }, [issues, statusFilter, categoryFilter, severityFilter, searchQuery]);

  // Center position calculation
  const mapCenter = useMemo(() => {
    if (selectedIssue) {
      return selectedIssue.location;
    }
    if (filteredIssues.length > 0) {
      return filteredIssues[0].location;
    }
    return { lat: 12.9716, lng: 77.6400 }; // Indiranagar
  }, [selectedIssue, filteredIssues]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Resolved":
        return <span className="text-[10px] bg-emerald-950/40 border border-emerald-800/40 text-[#00ff87] px-2 py-0.5 rounded font-bold">Resolved</span>;
      case "In Progress":
        return <span className="text-[10px] bg-emerald-950/30 border border-emerald-800/35 text-[#10b981] px-2 py-0.5 rounded font-bold">In Progress</span>;
      default:
        return <span className="text-[10px] bg-rose-955/30 border border-rose-800/40 text-rose-400 px-2 py-0.5 rounded font-bold">Open</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="text-[9px] bg-rose-950/45 border border-rose-800/40 text-rose-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Critical</span>;
      case "High":
        return <span className="text-[9px] bg-amber-950/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">High</span>;
      case "Medium":
        return <span className="text-[9px] bg-emerald-950/45 border border-[#0f3d2b]/60 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Medium</span>;
      default:
        return <span className="text-[9px] bg-emerald-955/20 border border-emerald-950/40 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Low</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#010905] overflow-hidden">
      
      {/* FILTER BAR ROW */}
      <div className="bg-[#02130c]/85 border-b border-[#0f3d2b]/65 px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md z-10 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#00ff87]">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="block w-full rounded-lg bg-[#02110c] border border-[#0f3d2b]/65 pl-8 pr-3 py-1.5 text-xs text-emerald-50 focus:border-[#00ff87]/50 focus:ring-0 placeholder:text-emerald-600 transition-colors"
            />
          </div>

          <div className="h-4 w-px bg-[#0f3d2b]/60 hidden md:block" />

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-[#02110c] px-2.5 py-1.5 rounded-lg border border-[#0f3d2b]/65">
            <span className="text-emerald-400/85 text-[10px] uppercase font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-emerald-200 focus:ring-0 font-semibold cursor-pointer outline-none"
            >
              <option className="bg-[#02110c] text-emerald-200" value="all">All Statuses</option>
              <option className="bg-[#02110c] text-emerald-200" value="Open">🔴 Open</option>
              <option className="bg-[#02110c] text-emerald-200" value="In Progress">🟡 In Progress</option>
              <option className="bg-[#02110c] text-emerald-200" value="Resolved">🟢 Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 bg-[#02110c] px-2.5 py-1.5 rounded-lg border border-[#0f3d2b]/65">
            <span className="text-emerald-400/85 text-[10px] uppercase font-bold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-emerald-200 focus:ring-0 font-semibold cursor-pointer capitalize outline-none"
            >
              <option className="bg-[#02110c] text-emerald-200" value="all">All Categories</option>
              <option className="bg-[#02110c] text-emerald-200" value="pothole">🕳️ Potholes</option>
              <option className="bg-[#02110c] text-emerald-200" value="broken streetlight">🔦 Streetlights</option>
              <option className="bg-[#02110c] text-emerald-200" value="water leakage">💧 Leakages</option>
              <option className="bg-[#02110c] text-emerald-200" value="waste">🗑️ Waste</option>
              <option className="bg-[#02110c] text-emerald-200" value="damaged road">🛣️ Damaged Road</option>
              <option className="bg-[#02110c] text-emerald-200" value="other">⚙️ Other</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1.5 bg-[#02110c] px-2.5 py-1.5 rounded-lg border border-[#0f3d2b]/65">
            <span className="text-emerald-400/85 text-[10px] uppercase font-bold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-transparent text-emerald-200 focus:ring-0 font-semibold cursor-pointer outline-none"
            >
              <option className="bg-[#02110c] text-emerald-200" value="all">All Severities</option>
              <option className="bg-[#02110c] text-emerald-200" value="Low">Low</option>
              <option className="bg-[#02110c] text-emerald-200" value="Medium">Medium</option>
              <option className="bg-[#02110c] text-emerald-200" value="High">High</option>
              <option className="bg-[#02110c] text-emerald-200" value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Dynamic counter info */}
        <div className="text-[10px] font-mono text-emerald-400/85 uppercase tracking-wider self-end md:self-auto font-bold">
          Showing <span className="text-[#00ff87] font-extrabold">{filteredIssues.length}</span> matching incidents
        </div>
      </div>

      {/* SPLIT SCREEN MAP + LIST FEED */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Hand: Scrollable Issue Feed List */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-[#02130c]/90 border-r border-[#0f3d2b]/65 flex flex-col overflow-y-auto backdrop-blur-md">
          {filteredIssues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
              <Filter className="h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-sm font-bold text-emerald-200">No matching issues</p>
              <p className="text-xs text-emerald-400 mt-1 max-w-xs font-normal">
                Try loosening your filters or clear your search query to find more reports.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#0f3d2b]/40">
              {filteredIssues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                return (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className={`p-4 flex items-start space-x-3.5 cursor-pointer transition-all hover:bg-[#02110c]/50 ${
                      isSelected ? "bg-emerald-950/20 border-l-4 border-[#00ff87]" : ""
                    }`}
                  >
                    {/* Compact Image thumbnail */}
                    <img
                      referrerPolicy="no-referrer"
                      src={issue.photoURL}
                      alt={issue.category}
                      className="h-14 w-14 rounded-lg object-cover border border-[#0f3d2b]/70 shrink-0 mt-0.5"
                    />

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display font-extrabold text-xs text-emerald-50 capitalize truncate">
                          {issue.category}
                        </span>
                        {getStatusBadge(issue.status)}
                      </div>

                      <p className="text-emerald-300 text-[11px] leading-relaxed line-clamp-2 mt-1 font-normal">
                        {issue.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-emerald-500 font-mono mt-2.5">
                        <div className="flex items-center space-x-1.5">
                          {getSeverityBadge(issue.severity)}
                          {issue.isRecurring && (
                            <span className="bg-rose-955/30 border border-rose-800/40 text-[9px] text-rose-400 font-bold px-1.5 py-0.2 rounded">
                              🔁 Recurring
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 font-medium text-emerald-500">
                          <ThumbsUp className="h-3 w-3 text-[#00ff87]" />
                          <span>{issue.upvotes} upvotes</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center Canvas: Leaflet Map Container */}
        <div className="flex-1 h-full relative">
          <MapContainer
            issues={filteredIssues}
            neighborhoods={neighborhoods}
            selectedIssue={selectedIssue}
            onSelectIssue={onSelectIssue}
            center={mapCenter}
            zoom={selectedIssue ? 16 : 13}
          />

          {/* SELECTED ISSUE FLOATING CARD OVERLAY */}
          {selectedIssue && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:left-4 md:w-[380px] z-20 bg-[#02130c]/90 backdrop-blur-md p-4 rounded-xl border border-[#0f3d2b]/70 shadow-2xl flex flex-col space-y-3.5 max-w-md animate-fade-in-premium">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-extrabold text-sm text-emerald-50 capitalize">
                      {selectedIssue.category}
                    </span>
                    {getStatusBadge(selectedIssue.status)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 mt-0.5 font-medium">
                    <MapPin className="h-3 w-3 text-[#00ff87]" />
                    <span>GPS Coordinates: {selectedIssue.location.lat.toFixed(5)}, {selectedIssue.location.lng.toFixed(5)}</span>
                  </span>
                </div>
                <button
                  onClick={() => onSelectIssue(null)}
                  className="text-emerald-400 hover:text-emerald-200 font-mono text-sm leading-none p-1.5 rounded-lg hover:bg-emerald-950/40 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Grid content */}
              <div className="flex gap-3">
                <img
                  referrerPolicy="no-referrer"
                  src={selectedIssue.photoURL}
                  alt="Incident photo"
                  className="h-20 w-20 rounded-lg object-cover border border-[#0f3d2b]/70 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between text-xs">
                  <p className="text-emerald-200 leading-relaxed line-clamp-3 font-normal">
                    {selectedIssue.description}
                  </p>
                  <p className="text-[10px] text-[#10b981] font-mono mt-1 font-medium">
                    Reported on: {new Date(selectedIssue.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="border-t border-[#0f3d2b]/60 pt-3 flex items-center justify-between text-xs">
                {/* Upvote Button */}
                <button
                  onClick={() => onUpvote(selectedIssue.id)}
                  disabled={currentUser && selectedIssue.upvotedBy?.includes(currentUser.uid)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    currentUser && selectedIssue.upvotedBy?.includes(currentUser.uid)
                      ? "border-emerald-800 bg-emerald-955/30 text-[#00ff87] cursor-default font-extrabold"
                      : "border-[#0f3d2b]/75 hover:border-[#00ff87]/30 bg-[#02110c] text-emerald-300 hover:text-emerald-100 shadow-sm"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Upvoted ({selectedIssue.upvotes})</span>
                </button>

                {/* View Details Page Link */}
                <button
                  onClick={() => onViewChange("detail")}
                  className="flex items-center space-x-1 font-bold text-[#00ff87] hover:text-emerald-300 cursor-pointer"
                >
                  <span>Civic Memory & Timeline</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
