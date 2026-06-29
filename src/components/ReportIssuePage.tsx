import React, { useState, useEffect } from "react";
import { Issue, IssueCategory, IssueSeverity, LatLng, UserProfile } from "../types";
import { dbService } from "../lib/firebase";
import MapContainer from "./MapContainer";
import { 
  Camera, Mic, MicOff, MapPin, AlertCircle, Sparkles, Loader2, 
  HelpCircle, CheckCircle2, ShieldAlert, ArrowRight, ArrowLeft, ThumbsUp
} from "lucide-react";

interface ReportIssuePageProps {
  currentUser: UserProfile | null;
  issues: Issue[];
  neighborhoods: any[];
  onIssueAdded: (newIssue: Issue) => void;
  onViewChange: (view: any) => void;
  onSelectIssue: (issue: Issue) => void;
}

export default function ReportIssuePage({
  currentUser,
  issues,
  neighborhoods,
  onIssueAdded,
  onViewChange,
  onSelectIssue,
}: ReportIssuePageProps) {
  // Form State
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [severity, setSeverity] = useState<IssueSeverity | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [autoLocationName, setAutoLocationName] = useState("");

  // UI Processing states
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribingVoice, setTranscribingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Duplicate Check / Submit States
  const [submitting, setSubmitting] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    isDuplicate: boolean;
    duplicateIssueId: string | null;
    reasoning: string;
  } | null>(null);
  const [matchedDuplicateIssue, setMatchedDuplicateIssue] = useState<Issue | null>(null);

  // Status Message
  const [formError, setFormError] = useState("");

  // 1. Haversine Distance Helper to find issues within 100 meters
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 2. Auto-Detect Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setAutoLocationName("Auto-detected via GPS");
        },
        () => {
          // Fallback to central Indiranagar Bengaluru coordinate
          setLocation({ lat: 12.9716, lng: 77.6400 });
          setAutoLocationName("Indiranagar, Bengaluru (Default Location)");
        }
      );
    } else {
      setLocation({ lat: 12.9716, lng: 77.6400 });
      setAutoLocationName("Indiranagar, Bengaluru (Default Location)");
    }
  }, []);

  // 3. Handle File Upload and Gemini Vision Auto-classification
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    setFormError("");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoBase64(base64);

      // Trigger Gemini Vision Photo Analysis
      setAnalyzingPhoto(true);
      setPhotoAnalysisResult(null);
      
      try {
        // Fetch API key securely from the backend
        const keyResponse = await fetch("/api/gemini/get-key");
        const { apiKey } = await keyResponse.json();

        if (!apiKey) {
          throw new Error("Gemini API key is not configured on the server.");
        }

        const cleanBase64 = base64.split(",")[1];
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let response = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
          try {
            const tempResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      inline_data: {
                        mime_type: file.type || "image/jpeg",
                        data: cleanBase64,
                      }
                    },
                    {
                      text: 'Analyze this image. Is this a civic infrastructure problem (pothole, broken streetlight, water leakage, garbage/waste)? Return ONLY valid JSON: {"isCivicIssue": boolean, "category": "Pothole|Streetlight|Water Leakage|Waste|Unknown", "severity": "Low|Medium|High|Critical|None", "description": "one sentence"}'
                    }
                  ]
                }]
              })
            });

            if (tempResponse.ok) {
              response = tempResponse;
              break;
            } else {
              const errBody = await tempResponse.json().catch(() => ({}));
              lastError = new Error(`API returned status ${tempResponse.status}: ${errBody?.error?.message || "Unknown error"}`);
            }
          } catch (e: any) {
            lastError = e;
          }
        }

        if (!response) {
          throw lastError || new Error("All Gemini model attempts failed.");
        }

        const resData = await response.json();
        const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Clean markdown code blocks from the response text if present
        const cleanText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();
        const data = JSON.parse(cleanText);

        const isCivic = data.isCivicIssue === true || String(data.isCivicIssue).toLowerCase() === "true";
        const geminiCat = (data.category || "").trim().toLowerCase();
        const geminiSev = (data.severity || "").trim();
        const geminiDesc = data.description || "";

        if (isCivic && geminiCat !== "unknown" && geminiCat !== "none") {
          // Map category to the dropdown options
          let mappedCategory: IssueCategory | "" = "";
          if (geminiCat.includes("pothole")) {
            mappedCategory = "pothole";
          } else if (geminiCat.includes("streetlight") || geminiCat.includes("light")) {
            mappedCategory = "broken streetlight";
          } else if (geminiCat.includes("leakage") || geminiCat.includes("water")) {
            mappedCategory = "water leakage";
          } else if (geminiCat.includes("waste") || geminiCat.includes("garbage") || geminiCat.includes("trash") || geminiCat.includes("dump") || geminiCat.includes("debris")) {
            mappedCategory = "waste";
          } else if (geminiCat.includes("road") || geminiCat.includes("pavement")) {
            mappedCategory = "damaged road";
          } else {
            mappedCategory = "other";
          }

          setCategory(mappedCategory);

          // Map severity
          let mappedSeverity: IssueSeverity | "" = "";
          const sevLower = geminiSev.toLowerCase();
          if (sevLower.includes("critical")) {
            mappedSeverity = "Critical";
          } else if (sevLower.includes("high")) {
            mappedSeverity = "High";
          } else if (sevLower.includes("medium")) {
            mappedSeverity = "Medium";
          } else if (sevLower.includes("low")) {
            mappedSeverity = "Low";
          } else {
            mappedSeverity = "Low";
          }

          setSeverity(mappedSeverity);
          setPhotoAnalysisResult(geminiDesc);
        } else {
          // Not a civic issue
          setCategory("");
          setSeverity("");
          setPhotoAnalysisResult("This doesn't appear to be a civic issue");
        }
      } catch (err: any) {
        console.error("Gemini Vision error:", err);
        setCategory("");
        setSeverity("");
        setPhotoAnalysisResult("This doesn't appear to be a civic issue");
      } finally {
        setAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 4. Handle Voice Recording & Transcription with Web Speech API (SpeechRecognition)
  const startRecording = () => {
    setFormError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFormError("Voice not supported on this browser");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "hi-IN";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          await processTranscriptWithGemini(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setFormError("Microphone access was denied.");
        } else {
          setFormError(`Speech recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error("Failed to start SpeechRecognition:", err);
      setFormError(err.message || "Failed to start speech recognition.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping SpeechRecognition:", err);
      }
      setIsRecording(false);
    }
  };

  const processTranscriptWithGemini = async (transcript: string) => {
    setTranscribingVoice(true);
    setFormError("");
    try {
      const res = await fetch("/api/gemini/clean-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        throw new Error("Failed to process speech with Gemini API");
      }

      const data = await res.json();
      if (data.cleaned) {
        setDescription(data.cleaned);
      }
    } catch (err: any) {
      console.error("Error in processTranscriptWithGemini:", err);
      // Fallback: use transcript as is
      setDescription(transcript);
      setFormError("Gemini was unable to clean up the voice description, inserted raw transcript instead.");
    } finally {
      setTranscribingVoice(false);
    }
  };

  // 5. Submit Form with Duplicate Checking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!photoBase64) {
      setFormError("A before photo is mandatory to report a civic issue.");
      return;
    }
    if (!category) {
      setFormError("Please select a category.");
      return;
    }
    if (!severity) {
      setFormError("Please select a severity score.");
      return;
    }
    if (!description.trim()) {
      setFormError("Please describe the issue in detail.");
      return;
    }
    if (!location) {
      setFormError("GPS coordinates are required. Pick on map.");
      return;
    }

    setSubmitting(true);

    try {
      // DUPLICATE DETECTION CHECK (Proximity check 100 meters)
      const nearby = issues.filter(issue => {
        if (issue.status === "Resolved") return false; // ignore resolved duplicates
        const dist = getDistanceInMeters(location.lat, location.lng, issue.location.lat, issue.location.lng);
        return dist <= 100;
      });

      if (nearby.length > 0 && !duplicateCheckResult) {
        // Run Gemini Duplicate Detection
        const response = await fetch("/api/gemini/detect-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newDescription: description,
            nearbyIssues: nearby.map(n => ({
              id: n.id,
              category: n.category,
              description: n.description,
              distance: Math.round(getDistanceInMeters(location.lat, location.lng, n.location.lat, n.location.lng))
            }))
          })
        });

        if (response.ok) {
          const check = await response.json();
          if (check.isDuplicate && check.duplicateIssueId) {
            const matchedIssue = nearby.find(n => n.id === check.duplicateIssueId) || nearby[0];
            setDuplicateCheckResult({
              isDuplicate: true,
              duplicateIssueId: matchedIssue.id,
              reasoning: check.reasoning
            });
            setMatchedDuplicateIssue(matchedIssue);
            setSubmitting(false);
            return; // Halt submission to show warning panel
          }
        }
      }

      // No duplicate or ignored duplicate -> Submit New Issue
      const issueId = "issue_" + Math.random().toString(36).substr(2, 9);
      
      // Check if this location had prior resolved issues (Civic Memory Recurrence)
      const priorResolvedAtSameSpot = issues.filter(i => {
        if (i.status !== "Resolved") return false;
        const dist = getDistanceInMeters(location.lat, location.lng, i.location.lat, i.location.lng);
        return dist <= 100;
      });

      const isRecur = priorResolvedAtSameSpot.length > 0;
      const recurCount = priorResolvedAtSameSpot.length;

      // Assign to closest seed neighborhood
      let selectedNh = neighborhoods[0]?.id || "indiranagar";
      let minDist = Infinity;
      neighborhoods.forEach(nh => {
        if (nh.boundaries && nh.boundaries[0]) {
          const dist = getDistanceInMeters(location.lat, location.lng, nh.boundaries[0].lat, nh.boundaries[0].lng);
          if (dist < minDist) {
            minDist = dist;
            selectedNh = nh.id;
          }
        }
      });

      const newIssue: Issue = {
        id: issueId,
        location,
        category: category as IssueCategory,
        severity: severity as IssueSeverity,
        description,
        photoURL: photoBase64,
        status: "Open",
        reportedBy: currentUser ? (currentUser.mode === "guardian" ? currentUser.uid : null) : null,
        reportedByUsername: currentUser && currentUser.mode === "guardian" ? currentUser.username : undefined,
        upvotes: 0,
        upvotedBy: [],
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        neighborhoodId: selectedNh,
        isRecurring: isRecur,
        recurrenceCount: recurCount,
      };

      // Save issue to DB
      await dbService.saveIssue(newIssue);

      // Add report history log
      const logId = "log_" + Math.random().toString(36).substr(2, 9);
      await dbService.addHistoryLog({
        id: logId,
        issueId,
        event: "reported",
        timestamp: new Date().toISOString(),
        actorRole: "citizen",
        details: currentUser?.mode === "guardian" ? `Reported by Guardian ${currentUser.username}` : "Anonymously reported in Shadow Mode."
      });

      if (isRecur) {
        // Add recurrence log
        const recurLogId = "log_" + Math.random().toString(36).substr(2, 9);
        await dbService.addHistoryLog({
          id: recurLogId,
          issueId,
          event: "recurred",
          timestamp: new Date().toISOString(),
          actorRole: "system",
          details: `System flagged as a Recurring Issue. There are ${recurCount} prior resolutions here.`
        });
      }

      // Award points if Guardian mode
      if (currentUser && currentUser.mode === "guardian") {
        await dbService.updateUserPointsAndStreak(currentUser.uid, 50, true); // +50 pts, weekly streak
      }

      // Deduct neighborhood FixScore slightly due to new Open issue
      await dbService.updateNeighborhoodScore(selectedNh, -3);

      onIssueAdded(newIssue);
      onViewChange("map");
    } catch (err: any) {
      setFormError(err.message || "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote Existing Issue Bypass Action
  const handleUpvoteExisting = async () => {
    if (!matchedDuplicateIssue) return;
    setSubmitting(true);
    try {
      const userUid = currentUser?.uid || dbService.getAnonymousId();
      await dbService.upvoteIssue(matchedDuplicateIssue.id, userUid);
      
      const logId = "log_" + Math.random().toString(36).substr(2, 9);
      await dbService.addHistoryLog({
        id: logId,
        issueId: matchedDuplicateIssue.id,
        event: "upvoted",
        timestamp: new Date().toISOString(),
        actorRole: "citizen",
        details: "Upvoted as duplicate report merge."
      });

      onSelectIssue(matchedDuplicateIssue);
      onViewChange("map");
    } catch (err: any) {
      setFormError(err.message || "Upvote failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in-premium">
      
      {/* DUPLICATE WARNING MODAL OVERLAY (INLINE PANEL) */}
      {duplicateCheckResult && matchedDuplicateIssue && (
        <div className="mb-8 p-6 rounded-2xl border border-emerald-500/30 bg-[#02130c]/95 shadow-2xl max-w-3xl mx-auto text-emerald-50 backdrop-blur-md animate-fade-in">
          <div className="flex items-start space-x-4">
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 text-[#00ff87]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-extrabold text-lg text-emerald-50">Possible Duplicate Detected within 100 meters</h3>
              <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed font-normal">
                Gemini compares reports dynamically. A highly similar, active <strong className="font-bold text-[#00ff87]">{matchedDuplicateIssue.category}</strong> 
                report already exists at this location.
              </p>

              {/* Duplicate Details */}
              <div className="mt-4 bg-[#02110c]/50 p-4 rounded-xl border border-[#0f3d2b]/60 flex items-center space-x-4">
                <img 
                  src={matchedDuplicateIssue.photoURL} 
                  alt="Existing duplicate" 
                  className="h-16 w-16 rounded-lg object-cover border border-[#0f3d2b]/70"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#00ff87] capitalize bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {matchedDuplicateIssue.category}
                    </span>
                    <span className="text-emerald-400/85 font-medium">
                      Reported {new Date(matchedDuplicateIssue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-emerald-200 mt-1.5 line-clamp-2 font-normal">{matchedDuplicateIssue.description}</p>
                </div>
              </div>

              <p className="text-xs text-[#00ff87] mt-3 font-semibold">
                Reason: {duplicateCheckResult.reasoning}
              </p>

              {/* Action Choices */}
              <div className="mt-5 flex items-center gap-x-4">
                <button
                  type="button"
                  onClick={handleUpvoteExisting}
                  disabled={submitting}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 py-2 px-4 rounded-lg text-xs font-bold text-slate-950 shadow transition-colors cursor-pointer"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Upvote Existing Report Instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Bypass check and force submit
                    setDuplicateCheckResult(null);
                    setMatchedDuplicateIssue(null);
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-200 underline transition-colors cursor-pointer"
                >
                  Report as New Unique Issue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
        
        {/* Form Controls Column */}
        <div className="lg:col-span-7 bg-[#02130c]/80 border border-[#0f3d2b]/70 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-md space-y-6">
          
          <div className="flex items-center justify-between border-b border-[#0f3d2b]/60 pb-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl text-emerald-50">Report Hyperlocal Issue</h1>
              <p className="text-xs text-emerald-400/80 mt-1">Submit authentic data. Supported by Gemini audits.</p>
            </div>
            <button
              onClick={() => onViewChange("map")}
              className="text-xs text-emerald-400 hover:text-emerald-250 flex items-center gap-1 hover:underline font-bold cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Map</span>
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/35 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. PHOTO UPLOAD (MANDATORY) */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-emerald-100 uppercase tracking-wide">
                1. Before Photo <span className="text-rose-400 font-bold">*Mandatory</span>
              </label>
              
              <div className="flex items-center justify-center w-full">
                {photoBase64 ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#0f3d2b]/75 shadow-sm">
                    <img 
                      src={photoBase64} 
                      alt="Before Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-955/80 to-transparent flex items-end p-4 justify-between">
                      <span className="text-[10px] text-emerald-205 bg-[#02130c]/90 px-2 py-1 rounded border border-[#0f3d2b]/60 truncate max-w-[200px] font-mono">
                        {photoName}
                      </span>
                      <label className="text-[10px] font-bold text-[#00ff87] hover:text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40 cursor-pointer shadow transition-colors">
                        Change Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#0f3d2b]/70 hover:border-[#00ff87]/30 rounded-xl cursor-pointer bg-[#02110c]/30 hover:bg-[#021a11]/40 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <Camera className="h-10 w-10 text-[#00ff87]/50 mb-3" />
                      <p className="text-sm font-bold text-emerald-100">Click to Snap or Upload Photo</p>
                      <p className="text-[10px] text-emerald-400 mt-1 leading-relaxed font-normal max-w-sm">
                        Camera input required. Gemini automatically processes photos for category & severity.
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Gemini Vision Processing Alert */}
              {analyzingPhoto && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center space-x-2 text-xs text-[#00ff87] font-medium animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00ff87] shrink-0" />
                  <span>Gemini Vision AI: Analyzing Photo to determine category & severity...</span>
                </div>
              )}

              {photoAnalysisResult && !analyzingPhoto && (
                <div className="p-3 bg-[#02110c]/40 border border-[#0f3d2b]/60 rounded-xl text-xs text-emerald-200">
                  <div className="flex items-center space-x-1.5 font-extrabold text-[#00ff87] mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gemini Vision Verdict</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-emerald-400 font-normal">{photoAnalysisResult}</p>
                </div>
              )}
            </div>

            {/* 2. CATEGORY & SEVERITY */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="block w-full rounded-xl bg-[#02110c]/50 border border-[#0f3d2b]/70 text-emerald-200 py-2.5 px-3 text-xs focus:border-[#00ff87] focus:ring-0 mt-1.5 capitalize font-medium transition-all"
                >
                  <option value="" className="bg-[#02110c] text-emerald-400">-- Choose Category --</option>
                  <option value="pothole" className="bg-[#02110c] text-emerald-100">🕳️ Pothole</option>
                  <option value="broken streetlight" className="bg-[#02110c] text-emerald-100">🔦 Broken Streetlight</option>
                  <option value="water leakage" className="bg-[#02110c] text-emerald-100">💧 Water Leakage</option>
                  <option value="waste" className="bg-[#02110c] text-emerald-100">🗑️ Waste / Garbage</option>
                  <option value="damaged road" className="bg-[#02110c] text-emerald-100">🛣️ Damaged Road</option>
                  <option value="other" className="bg-[#02110c] text-emerald-100">⚙️ Other Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wide">Severity Score</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                  className="block w-full rounded-xl bg-[#02110c]/50 border border-[#0f3d2b]/70 text-emerald-200 py-2.5 px-3 text-xs focus:border-[#00ff87] focus:ring-0 mt-1.5 font-medium transition-all"
                >
                  <option value="" className="bg-[#02110c] text-emerald-400">-- Choose Severity --</option>
                  <option value="Low" className="bg-[#02110c] text-emerald-100">🟢 Low</option>
                  <option value="Medium" className="bg-[#02110c] text-emerald-100">🟡 Medium</option>
                  <option value="High" className="bg-[#02110c] text-emerald-100">🟠 High</option>
                  <option value="Critical" className="bg-[#02110c] text-emerald-100">🔴 Critical</option>
                </select>
              </div>
            </div>

            {/* 3. VOICE INPUT BUTTON & DESCRIPTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wide">
                  Description
                </label>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={transcribingVoice}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    isRecording 
                      ? "bg-rose-955/40 border-rose-800/45 text-rose-400 animate-pulse" 
                      : "bg-emerald-950/40 border border-emerald-800/40 text-[#00ff87] hover:bg-emerald-900/40"
                  }`}
                >
                  {isRecording ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5 text-[#00ff87]" />}
                  <span>{isRecording ? "Stop Recording (Tap to Transcribe)" : "Speak (Hindi/English)"}</span>
                </button>
              </div>

              {transcribingVoice && (
                <div className="p-2 bg-emerald-950/20 border border-emerald-800/30 rounded-lg flex items-center space-x-2 text-xs text-[#00ff87] font-medium">
                  <Loader2 className="h-3 w-3 animate-spin text-[#00ff87]" />
                  <span>Gemini Audio AI: Transcribing spoken Hindi/English to text...</span>
                </div>
              )}

              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue... e.g. Location landmarks, safety hazards, or duration since active. Voice input will append here."
                className="block w-full rounded-xl bg-[#02110c]/50 border border-[#0f3d2b]/70 text-emerald-100 p-3.5 text-xs focus:border-[#00ff87] focus:ring-0 placeholder:text-emerald-600 transition-colors"
              />
            </div>

            {/* 4. SUBMIT ACTION */}
            <button
              type="submit"
              disabled={submitting || analyzingPhoto}
              className="w-full flex justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-[#00ff87] hover:opacity-95 py-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Detecting duplicates & submitting issue...</span>
                </>
              ) : (
                <>
                  <span>File Civic Complaint</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Map Location Coordinates Pick Column */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-[#02130c]/80 border border-[#0f3d2b]/75 p-5 rounded-2xl shadow-xl backdrop-blur-md flex-1 flex flex-col justify-between">
            <div className="mb-3">
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-4 w-4 text-[#00ff87]" />
                2. Geo-Location coordinates
              </span>
              <p className="text-[11px] text-emerald-400 leading-relaxed font-normal">
                We've pinned your current GPS location coordinates. Drag the blue marker point on the map below to pinpoint the pothole or streetlight exactly.
              </p>
              {location && (
                <div className="mt-2.5 font-mono text-[10px] text-emerald-300 bg-emerald-950/15 px-2.5 py-1.5 rounded-xl border border-emerald-800/20 flex items-center justify-between">
                  <span>Lat: {location.lat.toFixed(6)}</span>
                  <span>Lng: {location.lng.toFixed(6)}</span>
                </div>
              )}
            </div>

            {/* Interactive Selector Map Container */}
            <div className="w-full h-72 md:h-80 rounded-xl overflow-hidden border border-[#0f3d2b]/70">
              {location && (
                <MapContainer
                  issues={[]}
                  neighborhoods={[]}
                  selectedIssue={null}
                  onSelectIssue={() => {}}
                  isSelectorMode={true}
                  selectorLocation={location}
                  onLocationSelect={(loc) => setLocation(loc)}
                  center={location}
                  zoom={15}
                />
              )}
            </div>
            
            <p className="text-[10px] text-emerald-500 mt-2.5 text-center italic font-semibold">
              {autoLocationName || "Detecting GPS location..."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
