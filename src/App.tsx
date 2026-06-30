import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Loader2,
  FileText,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { IIssue, IUser, IComment } from "./types";
import IssueMap from "./components/IssueMap";
import DashboardStats from "./components/DashboardStats";

export default function App() {
  // Navigation & Active View State
  const [activeTab, setActiveTab] = useState<"map" | "dashboard" | "feed">("map");

  // Authentication State
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "citizen" as "citizen" | "authority" | "admin"
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Issues State
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Report Issue Form State
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportFileBase64, setReportFileBase64] = useState<string | null>(null);
  const [reportCoords, setReportCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // Interaction States
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);

  // Feed Filter States
  const [feedSearch, setFeedSearch] = useState("");
  const [feedCategoryFilter, setFeedCategoryFilter] = useState("All");
  const [feedStatusFilter, setFeedStatusFilter] = useState("All");

  // Fetch all issues from backend
  const fetchIssues = async () => {
    try {
      setLoadingIssues(true);
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
        // Sync active selected issue if focused
        if (selectedIssue) {
          const fresh = data.find((i: IIssue) => i.id === selectedIssue.id);
          if (fresh) setSelectedIssue(fresh);
        }
      }
    } catch (err) {
      console.error("Error loading issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Check stored credentials on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    fetchIssues();
  }, []);

  // Handle Authentication Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = authMode === "login" 
      ? { email: authForm.email, password: authForm.password }
      : { username: authForm.username, email: authForm.email, password: authForm.password, role: authForm.role };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // Store in State and Local Storage
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Reset Form & Close Modal
      setAuthModalOpen(false);
      setAuthForm({ username: "", email: "", password: "", role: "citizen" });
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Handle placing a pin on the map
  const handlePlacePin = (lat: number, lng: number) => {
    setReportCoords({ latitude: lat, longitude: lng });
    setReportFormOpen(true);
    setDuplicateWarning(null);
  };

  // File Upload Helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReportFile(file);

      // Create local Base64 for visual preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Issue Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }

    setReportLoading(true);
    setReportSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("description", reportDescription);
      formData.append("latitude", (reportCoords?.latitude || 37.7749).toString());
      formData.append("longitude", (reportCoords?.longitude || -122.4194).toString());
      if (reportFile) {
        formData.append("image", reportFile);
      }

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit report");
      }

      setReportSuccessMessage("Issue successfully analyzed & reported!");
      
      // Check duplicate status
      if (data.aiAnalysis && data.aiAnalysis.isDuplicate) {
        const dupIssue = issues.find((i) => i.id === data.aiAnalysis.duplicateOfId);
        setDuplicateWarning(dupIssue || null);
      }

      // Refresh list
      await fetchIssues();

      // Focus the newly created issue
      if (data.issue) {
        setSelectedIssue(data.issue);
      }

      // Reset form variables
      setTimeout(() => {
        setReportFormOpen(false);
        setReportDescription("");
        setReportFile(null);
        setReportFileBase64(null);
        setReportCoords(null);
        setReportSuccessMessage("");
      }, 2500);

    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    } finally {
      setReportLoading(false);
    }
  };

  // Upvote/Like Issue
  const handleVote = async () => {
    if (!token) {
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    if (!selectedIssue) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated);
        // Refresh feed list
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
    } catch (err) {
      console.error("Voting error:", err);
    }
  };

  // Verify Issue
  const handleVerify = async () => {
    if (!token || !user || (user.role !== "authority" && user.role !== "admin")) {
      alert("Only registered Local Authorities or Administrators can verify reports.");
      return;
    }
    if (!selectedIssue) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  // Submit Comments
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    if (!commentText.trim() || !selectedIssue) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setCommentText("");
      }
    } catch (err) {
      console.error("Commenting error:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Update Status Flow
  const handleStatusUpdate = async (status: "Pending" | "In Progress" | "Resolved") => {
    if (!token || !user || (user.role !== "authority" && user.role !== "admin")) {
      alert("Not authorized to change issue status");
      return;
    }
    if (!selectedIssue) return;

    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes: statusNotes || undefined })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setStatusNotes("");
        setShowStatusForm(false);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete Fake/Spam Report
  const handleDeleteReport = async () => {
    if (!token || !user || user.role !== "admin") {
      alert("Only system Administrators can delete reports");
      return;
    }
    if (!selectedIssue) return;

    if (!confirm("Are you absolutely sure you want to permanently delete this report as fake? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setIssues((prev) => prev.filter((i) => i.id !== selectedIssue.id));
        setSelectedIssue(null);
        alert("Report deleted successfully.");
      }
    } catch (err) {
      console.error("Deleting error:", err);
    }
  };

  // Helper styles based on status
  const getStatusBadge = (status: "Pending" | "In Progress" | "Resolved") => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-[#F59E0B] border-amber-200";
      case "In Progress":
        return "bg-blue-50 text-[#3B82F6] border-blue-200";
      case "Resolved":
        return "bg-emerald-50 text-[#10B981] border-emerald-200";
    }
  };

  const getPriorityBadge = (priority: "Low" | "Medium" | "High" | "Urgent") => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-50 text-[#EF4444] border-rose-200";
      case "High":
        return "bg-amber-50 text-[#F59E0B] border-amber-200";
      case "Medium":
        return "bg-blue-50 text-[#3B82F6] border-blue-200";
      case "Low":
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // Filtering reports for the incident feed
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
      issue.description.toLowerCase().includes(feedSearch.toLowerCase()) ||
      issue.department.toLowerCase().includes(feedSearch.toLowerCase());

    const matchesCategory = feedCategoryFilter === "All" || issue.category === feedCategoryFilter;
    const matchesStatus = feedStatusFilter === "All" || issue.status === feedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex flex-col h-screen w-full bg-natural-bg text-natural-text font-sans overflow-hidden">
      {/* Header Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-natural-border bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-natural-primary rounded-full flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-natural-text tracking-tight flex items-center gap-1.5">
              Community Hero
              <span className="text-[10px] bg-natural-accent/10 text-natural-accent font-bold px-2 py-0.5 rounded-full border border-natural-accent/20 uppercase tracking-widest">
                AI Powered
              </span>
            </h1>
            <p className="text-[10px] text-natural-badge font-bold uppercase tracking-widest">
              Hyperlocal Problem Solver
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex gap-6 items-center">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "map"
                ? "bg-natural-primary text-white shadow-sm"
                : "text-natural-badge hover:text-natural-primary"
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "feed"
                ? "bg-natural-primary text-white shadow-sm"
                : "text-natural-badge hover:text-natural-primary"
            }`}
          >
            Incidents Feed
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-natural-primary text-white shadow-sm"
                : "text-natural-badge hover:text-natural-primary"
            }`}
          >
            Statistics Panel
          </button>
        </nav>

        {/* User Auth Info Bar */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-natural-border">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-bold uppercase tracking-wider text-natural-badge">
                  {user.role === "admin" ? "🛡️ SYSTEM ADMIN" : user.role === "authority" ? "🏛️ LOCAL AUTHORITY" : "👋 CITIZEN"}
                </p>
                <p className="text-xs font-bold text-natural-text">{user.username}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white font-bold"
                style={{ backgroundColor: user.avatarColor || "#2E7D32" }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-natural-badge hover:text-natural-accent hover:bg-natural-bg rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthModalOpen(true);
              }}
              className="bg-natural-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-natural-primary-dark transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Mobile Navigation Bar */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-natural-border flex gap-4">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "map" ? "bg-natural-primary text-white" : "text-natural-badge"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "feed" ? "bg-natural-primary text-white" : "text-natural-badge"
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === "dashboard" ? "bg-natural-primary text-white" : "text-natural-badge"
            }`}
          >
            Stats
          </button>
        </div>

        {/* Dynamic Inner Layout based on Active Tab */}
        <div className="flex-1 flex overflow-hidden">
          {/* Active Screen Tab View */}
          {activeTab === "map" && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar: Recent local incidents */}
              <aside className="w-80 border-r border-natural-border flex flex-col bg-natural-card hidden lg:flex">
                <div className="p-5 border-b border-natural-border flex items-center justify-between">
                  <h2 className="font-serif text-base font-bold text-natural-text">Live Incidents</h2>
                  <span className="text-[9px] bg-natural-badge/20 text-natural-primary px-2 py-0.5 rounded-full font-bold">
                    {issues.length} ACTIVES
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingIssues ? (
                    <div className="py-20 text-center text-xs text-natural-badge font-semibold">
                      Loading reported incidents...
                    </div>
                  ) : issues.length === 0 ? (
                    <div className="py-20 text-center px-4">
                      <p className="text-xs text-natural-badge font-bold">No issues reported yet.</p>
                      <p className="text-[11px] text-natural-light mt-1">Be the first to help your community by clicking the map to pin a problem!</p>
                    </div>
                  ) : (
                    issues.slice(0, 15).map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`bg-white rounded-xl p-3 border cursor-pointer transition-all hover:shadow-xs hover:border-natural-primary ${
                          selectedIssue?.id === issue.id
                            ? "border-natural-accent bg-natural-accent/5 shadow-xs"
                            : "border-natural-border"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-natural-bg border border-natural-border rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {issue.imageUrl ? (
                              <img src={issue.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-natural-badge" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug truncate text-natural-text">
                              {issue.title}
                            </p>
                            <p className="text-[10px] text-natural-badge mt-0.5">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(issue.status)}`}>
                                {issue.status}
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(issue.priority)}`}>
                                {issue.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-white border-t border-natural-border">
                  <button
                    onClick={() => {
                      setReportCoords({ latitude: 37.7749, longitude: -122.4194 });
                      setReportFormOpen(true);
                      setDuplicateWarning(null);
                    }}
                    className="w-full bg-natural-accent hover:bg-natural-accent-dark text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Report Local Issue
                  </button>
                </div>
              </aside>

              {/* Central Map Workspace */}
              <section className="flex-1 relative bg-natural-bg p-4 flex flex-col">
                <IssueMap
                  issues={issues}
                  selectedIssue={selectedIssue}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onPlacePin={handlePlacePin}
                  newPinCoordinates={reportCoords}
                />
              </section>

              {/* Right Sidebar: Selected Active Issue Details */}
              <aside className="w-96 border-l border-natural-border bg-white flex flex-col overflow-y-auto hidden xl:flex">
                {selectedIssue ? (
                  <div className="flex-1 flex flex-col">
                    {/* Header bar */}
                    <div className="p-4 border-b border-natural-border flex items-center justify-between bg-natural-card">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(selectedIssue.status)}`}>
                          {selectedIssue.status}
                        </span>
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getPriorityBadge(selectedIssue.priority)}`}>
                          {selectedIssue.priority}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedIssue(null)}
                        className="text-natural-badge hover:text-natural-accent"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Image / Graphic block */}
                    <div className="h-44 bg-natural-bg relative overflow-hidden flex items-center justify-center border-b border-natural-border">
                      {selectedIssue.imageUrl ? (
                        <img
                          src={selectedIssue.imageUrl}
                          alt={selectedIssue.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-natural-badge">
                          <ImageIcon className="w-10 h-10 stroke-1" />
                          <span className="text-[10px] font-semibold">No citizen image uploaded</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-natural-border shadow-xs text-[10px] font-bold text-natural-primary flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}
                      </div>
                    </div>

                    {/* Meta info body */}
                    <div className="p-5 space-y-5 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-natural-accent uppercase tracking-wider mb-0.5">
                          {selectedIssue.category.toUpperCase()}
                        </p>
                        <h3 className="font-serif font-bold text-xl leading-tight text-natural-text">
                          {selectedIssue.title}
                        </h3>
                        <p className="text-[11px] text-natural-badge mt-1.5 flex items-center gap-1">
                          <span>Reported by <strong>{selectedIssue.reporterName}</strong></span>
                          <span>•</span>
                          <span>{new Date(selectedIssue.createdAt).toLocaleString()}</span>
                        </p>
                      </div>

                      {/* Gemini AI summary block */}
                      <div className="p-4 bg-natural-card rounded-2xl border border-natural-border/70 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1 text-natural-accent font-bold text-[10px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Gemini AI Intelligent Audit
                          </div>
                          <span className="text-[9px] bg-natural-primary/10 text-natural-primary px-1.5 py-0.5 rounded font-bold">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-natural-text leading-relaxed italic">
                          "{selectedIssue.description}"
                        </p>
                        <div className="mt-3 pt-3 border-t border-natural-border/50 grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-natural-badge block font-bold uppercase">Responsible Bureau</span>
                            <span className="font-bold text-natural-text">{selectedIssue.department}</span>
                          </div>
                          <div>
                            <span className="text-natural-badge block font-bold uppercase">Upvotes Log</span>
                            <span className="font-bold text-natural-text">{selectedIssue.upvotes} active citizens</span>
                          </div>
                        </div>
                      </div>

                      {/* Voter Interaction Controls */}
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={handleVote}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            user && selectedIssue.upvoters?.includes(user.id)
                              ? "bg-natural-accent/10 border-natural-accent/40 text-natural-accent"
                              : "bg-natural-bg border-natural-border hover:bg-white text-natural-primary"
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${user && selectedIssue.upvoters?.includes(user.id) ? "fill-current" : ""}`} />
                          Upvote ({selectedIssue.upvotes})
                        </button>

                        <button
                          onClick={handleVerify}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            selectedIssue.verifiedBy?.length > 0
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-natural-bg border-natural-border hover:bg-white text-natural-primary"
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Verify ({selectedIssue.verifiedBy?.length || 0})
                        </button>
                      </div>

                      {/* Timeline status tracker */}
                      <div className="pt-2">
                        <h4 className="text-[11px] font-bold text-natural-badge uppercase tracking-wider mb-3">
                          Incident Action Timeline
                        </h4>
                        <div className="space-y-4 border-l-2 border-natural-border pl-4 ml-2">
                          {selectedIssue.timeline?.map((event, i) => (
                            <div key={i} className="relative">
                              <span className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-natural-primary border-2 border-white shadow-xs" />
                              <div className="flex justify-between text-[10px] font-bold text-natural-badge">
                                <span className="text-natural-text uppercase">{event.status}</span>
                                <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-natural-text mt-0.5 font-medium leading-relaxed">
                                {event.notes}
                              </p>
                              <p className="text-[9px] text-natural-badge mt-0.5">
                                Updated by staff: {event.updatedBy}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Staff & Admin Actions Box */}
                      {user && (user.role === "authority" || user.role === "admin") && (
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                            🏛️ Municipal Staff Control Deck
                          </p>
                          
                          {showStatusForm ? (
                            <div className="space-y-3">
                              <textarea
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                placeholder="Add optional official remarks/action notes..."
                                className="w-full text-xs p-2 bg-white rounded-xl border border-natural-border focus:outline-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusUpdate("In Progress")}
                                  className="flex-1 bg-natural-primary text-white py-1.5 rounded-lg text-[10px] font-bold"
                                >
                                  Mark In Progress
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate("Resolved")}
                                  className="flex-1 bg-emerald-700 text-white py-1.5 rounded-lg text-[10px] font-bold"
                                >
                                  Mark Resolved
                                </button>
                                <button
                                  onClick={() => setShowStatusForm(false)}
                                  className="px-2 bg-gray-200 text-gray-700 rounded-lg text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowStatusForm(true)}
                                className="flex-1 bg-natural-primary hover:bg-natural-primary-dark text-white py-2 rounded-xl text-xs font-bold transition-colors"
                              >
                                Modify Status
                              </button>

                              {user.role === "admin" && (
                                <button
                                  onClick={handleDeleteReport}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-200 transition-colors"
                                  title="Delete Report as Fake"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comment Thread */}
                      <div className="pt-2">
                        <h4 className="text-[11px] font-bold text-natural-badge uppercase tracking-wider mb-3">
                          Community Comments ({selectedIssue.comments?.length || 0})
                        </h4>

                        <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
                          <input
                            type="text"
                            placeholder={user ? "Write a community remark..." : "Sign in to join discussion"}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={!user}
                            className="flex-1 text-xs p-2.5 bg-natural-bg rounded-xl border border-natural-border focus:outline-none text-natural-text"
                          />
                          <button
                            type="submit"
                            disabled={!user || commentLoading}
                            className="bg-natural-primary text-white px-3.5 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            Post
                          </button>
                        </form>

                        <div className="space-y-3">
                          {selectedIssue.comments?.map((comment) => (
                            <div key={comment.id} className="bg-natural-bg p-3 rounded-xl border border-natural-border/40 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-natural-text">{comment.username}</span>
                                <span className="text-[9px] text-natural-badge">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-natural-text leading-relaxed font-medium">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-natural-badge">
                    <MapPin className="w-12 h-12 stroke-1 mb-3 animate-pulse text-natural-light" />
                    <h3 className="font-serif font-bold text-lg text-natural-text leading-tight">
                      No Incident Focused
                    </h3>
                    <p className="text-xs text-natural-badge mt-1.5 max-w-xs leading-relaxed">
                      Select any pinpoint on the map or click a report in the sidebar to review verified local issues and staff notes.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-7xl mx-auto w-full space-y-6">
              {/* Header search & filter controls */}
              <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search incidents by keyword..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="w-full text-xs p-3 pl-4 bg-natural-bg rounded-xl border border-natural-border focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1 bg-natural-bg px-3 py-1.5 rounded-xl border border-natural-border">
                    <Filter className="w-3.5 h-3.5 text-natural-badge" />
                    <select
                      value={feedCategoryFilter}
                      onChange={(e) => setFeedCategoryFilter(e.target.value)}
                      className="text-xs bg-transparent focus:outline-none font-bold text-natural-primary"
                    >
                      <option value="All">All Categories</option>
                      <option value="Roads & Potholes">Roads & Potholes</option>
                      <option value="Streetlights & Electricity">Streetlights & Electricity</option>
                      <option value="Water Leakage & Sewage">Water Leakage & Sewage</option>
                      <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                      <option value="Public Parks & Trees">Public Parks & Trees</option>
                      <option value="Vandalism & Safety">Vandalism & Safety</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-natural-bg px-3 py-1.5 rounded-xl border border-natural-border">
                    <select
                      value={feedStatusFilter}
                      onChange={(e) => setFeedStatusFilter(e.target.value)}
                      className="text-xs bg-transparent focus:outline-none font-bold text-natural-primary"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feed Grid View */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {loadingIssues ? (
                  <div className="col-span-full py-40 text-center text-sm font-semibold text-natural-badge">
                    Loading feed incidents...
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="col-span-full py-40 text-center text-natural-badge">
                    No reports match your filters.
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setActiveTab("map");
                      }}
                      className="bg-white rounded-2xl border border-natural-border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="text-[9px] bg-natural-accent/10 text-natural-accent px-2 py-0.5 rounded font-bold uppercase">
                            {issue.category}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-lg leading-snug mb-2 text-natural-text">
                          {issue.title}
                        </h3>

                        <p className="text-xs text-natural-text/80 line-clamp-3 mb-4 font-medium">
                          {issue.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-natural-border/50 flex items-center justify-between text-[11px] text-natural-badge">
                        <span>By {issue.reporterName}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {issue.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {issue.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6 pb-24">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif font-bold text-2xl text-natural-text">Analytics Workspace</h2>
                  <p className="text-xs text-natural-badge font-semibold uppercase tracking-wider mt-0.5">
                    Real-time Civic Incident Assessment
                  </p>
                </div>
              </div>

              <DashboardStats issues={issues} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Status Footer Overlay */}
      <footer className="h-12 bg-white border-t border-natural-border flex items-center px-6 justify-between z-15 hidden sm:flex">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-natural-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-natural-badge">
              Active Complaints: {issues.filter((i) => i.status !== "Resolved").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-natural-badge" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-natural-badge">
              Resolved System: {issues.filter((i) => i.status === "Resolved").length}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-natural-badge font-bold italic">
          Empowering communities through responsive civic transparency
        </p>
      </footer>

      {/* Report Issue Drawer Form Overlay */}
      <AnimatePresence>
        {reportFormOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-natural-border w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="bg-natural-primary px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-natural-badge" />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Incident Reporter</span>
                </div>
                <button
                  onClick={() => setReportFormOpen(false)}
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div>
                  <label className="block text-xs font-bold text-natural-badge uppercase mb-1.5">
                    1. Upload Proof Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-natural-border rounded-2xl p-4 cursor-pointer hover:bg-natural-bg/50 transition-colors">
                      <ImageIcon className="w-8 h-8 text-natural-light mb-1" />
                      <span className="text-xs font-semibold text-natural-text">Click to choose image</span>
                      <span className="text-[9px] text-natural-badge uppercase tracking-wide mt-0.5">JPEG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {reportFileBase64 && (
                      <div className="w-24 h-24 rounded-2xl border border-natural-border overflow-hidden relative flex-shrink-0">
                        <img src={reportFileBase64} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => {
                            setReportFile(null);
                            setReportFileBase64(null);
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-badge uppercase mb-1.5">
                    2. Describe the Incident (Our AI will automatically categorize and detail this)
                  </label>
                  <textarea
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide a description of the problem (e.g., severe potholes blocking the road, water line leaking onto street, street lights out since Monday...)"
                    className="w-full text-xs p-3 bg-natural-bg rounded-xl border border-natural-border focus:outline-none min-h-[90px]"
                  />
                </div>

                {reportCoords && (
                  <div className="p-3 bg-natural-bg rounded-xl border border-natural-border flex items-center justify-between text-xs text-natural-primary font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-natural-accent" />
                      <span>GPS Coordinates Automatically Captured</span>
                    </div>
                    <span className="font-bold">
                      {reportCoords.latitude.toFixed(5)}, {reportCoords.longitude.toFixed(5)}
                    </span>
                  </div>
                )}

                {/* Intelligent AI Audit Feedback Warning */}
                {reportLoading && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 items-center">
                    <Loader2 className="w-5 h-5 text-natural-accent animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-[#F59E0B]">AI Audit Analysis in Progress...</p>
                      <p className="text-[10px] text-natural-badge">Gemini is classifying the image, routing to responsible department, and checking duplicate reports.</p>
                    </div>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      AI Duplicate Warning Check
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1 leading-normal">
                      Our systems detected a similar report near your location. Upvote <strong>"{duplicateWarning.title}"</strong> to draw municipal attention faster instead of submitting a duplicate!
                    </p>
                  </div>
                )}

                {reportSuccessMessage && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-800 text-center">
                    {reportSuccessMessage}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReportFormOpen(false)}
                    className="flex-1 bg-natural-bg hover:bg-natural-light/20 py-3 rounded-xl text-xs font-bold border border-natural-border transition-colors text-natural-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="flex-[2] bg-natural-accent hover:bg-natural-accent-dark text-white py-3 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {reportLoading ? "Auditing report..." : "Submit Incident Report"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-natural-border w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-natural-border bg-natural-card flex justify-between items-center">
                <h3 className="font-serif font-bold text-lg text-natural-text">
                  {authMode === "login" ? "Welcome Back" : "Join Community Hero"}
                </h3>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className="text-natural-badge hover:text-natural-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                    {authError}
                  </div>
                )}

                {authMode === "register" && (
                  <div>
                    <label className="block text-[10px] font-bold text-natural-badge uppercase mb-1">
                      Choose Username
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Enter username"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      className="w-full text-xs p-3 bg-natural-bg rounded-xl border border-natural-border focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-natural-badge uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="Enter email address"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full text-xs p-3 bg-natural-bg rounded-xl border border-natural-border focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-natural-badge uppercase mb-1">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Enter password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full text-xs p-3 bg-natural-bg rounded-xl border border-natural-border focus:outline-none"
                  />
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="block text-[10px] font-bold text-natural-badge uppercase mb-1">
                      Role Verification
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthForm({ ...authForm, role: "citizen" })}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                          authForm.role === "citizen"
                            ? "bg-natural-primary text-white border-transparent"
                            : "bg-natural-bg border-natural-border text-natural-badge"
                        }`}
                      >
                        Citizen
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthForm({ ...authForm, role: "authority" })}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                          authForm.role === "authority"
                            ? "bg-natural-primary text-white border-transparent"
                            : "bg-natural-bg border-natural-border text-natural-badge"
                        }`}
                      >
                        Local Authority
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-natural-primary hover:bg-natural-primary-dark text-white py-3 rounded-xl font-bold text-xs transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5"
                >
                  {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === "login" ? "Sign In" : "Register Account"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setAuthError("");
                    }}
                    className="text-[10px] font-bold text-natural-accent hover:underline uppercase tracking-wider"
                  >
                    {authMode === "login" ? "Create an account" : "Have an account? Log In"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
