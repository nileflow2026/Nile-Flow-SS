import { useState, useCallback, useEffect } from "react";
import { sendBroadcast, uploadNewsletterBanner, getBroadcastAudienceStats, listSubscribers, removeSubscriber, exportSubscribersCSV } from "../../adminService";
import {
  Send, Mail, Users, TrendingUp, Target, Eye, FileText, BarChart,
  RefreshCw, CheckCircle, AlertCircle, Hash, ArrowRight, Sparkles,
  Image, Settings, Download, Copy, Bell, Megaphone, HelpCircle,
  ExternalLink, Trash2, Plus, Globe, Store, X, Search, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const CAMPAIGN_TYPES = [
  { id: "announcement", label: "Announcement", color: "from-[#3498DB] to-[#2980B9]", icon: <Bell className="w-4 h-4" /> },
  { id: "app_update", label: "App Update", color: "from-[#9B59B6] to-[#8E44AD]", icon: <Sparkles className="w-4 h-4" /> },
  { id: "survey", label: "Survey", color: "from-[#27AE60] to-[#2ECC71]", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "promotion", label: "Promotion", color: "from-[#E74C3C] to-[#C0392B]", icon: <Megaphone className="w-4 h-4" /> },
  { id: "newsletter", label: "Newsletter", color: "from-[#D4A017] to-[#B8860B]", icon: <FileText className="w-4 h-4" /> },
];

const AUDIENCE_GROUPS = [
  { id: "all_platform", label: "All Platform Users", icon: <Globe className="w-5 h-5" />, color: "from-[#D4A017] to-[#B8860B]" },
  { id: "all_users", label: "All End Users", icon: <Users className="w-5 h-5" />, color: "from-[#3498DB] to-[#2980B9]" },
  { id: "all_vendors", label: "All Vendors", icon: <Store className="w-5 h-5" />, color: "from-[#27AE60] to-[#2ECC71]" },
  { id: "subscribers", label: "Newsletter Subscribers", icon: <Mail className="w-5 h-5" />, color: "from-[#9B59B6] to-[#8E44AD]" },
];

export default function SendNewsletter({ setSection }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [campaignType, setCampaignType] = useState("announcement");
  const [targetAudience, setTargetAudience] = useState("all_platform");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [audienceStats, setAudienceStats] = useState({ subscribers: 0, endUsers: 0, vendors: 0, allPlatform: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [features, setFeatures] = useState([{ icon: "✨", title: "", description: "" }]);
  const [surveyLink, setSurveyLink] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");

  // Modal states
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);
  const [localBannerPreview, setLocalBannerPreview] = useState("");
  const [readingBanner, setReadingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsSearch, setSubsSearch] = useState("");

  useEffect(() => {
    getBroadcastAudienceStats().then(setAudienceStats).catch(() => {});
  }, []);

  const getTotalForAudience = (id) => {
    switch (id) {
      case "all_platform": return audienceStats.allPlatform || 0;
      case "all_users": return audienceStats.endUsers || 0;
      case "all_vendors": return audienceStats.vendors || 0;
      case "subscribers": return audienceStats.subscribers || 0;
      default: return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!subject.trim()) { toast.error("Please enter a subject line"); return; }
    if (campaignType !== "survey" && !message.trim()) { toast.error("Please enter a message"); return; }
    setLoading(true);
    try {
      const payload = { subject: subject.trim(), message: message.trim(), campaignType, audience: targetAudience };
      if (campaignType === "survey") payload.surveyLink = surveyLink.trim() || "https://nileflowafrica.com/survey";
      if (campaignType === "promotion") {
        if (bannerUrl) payload.bannerUrl = bannerUrl.trim();
        if (ctaText) payload.ctaText = ctaText.trim();
        if (ctaLink) payload.ctaLink = ctaLink.trim();
      }
      if (campaignType === "app_update") {
        const validFeatures = features.filter(f => f.title.trim());
        if (validFeatures.length > 0) payload.features = validFeatures;
      }
      const result = await sendBroadcast(payload);
      setStatus(result.message || "Campaign sent successfully!");
      setStatusType("success");
      toast.success(`✅ Sent to ${result.stats?.sent || 0} recipients`);
      setSubject(""); setMessage(""); setFeatures([{ icon: "✨", title: "", description: "" }]);
      setSurveyLink(""); setBannerUrl(""); setCtaText(""); setCtaLink("");
    } catch (err) {
      setStatus(`Failed: ${err.message}`); setStatusType("error"); toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleSendTest = useCallback(() => {
    if (!subject.trim()) { toast.warning("Enter a subject first"); return; }
    toast.success("Test email sent to admin inbox!");
  }, [subject]);

  const addFeature = () => setFeatures(prev => [...prev, { icon: "✨", title: "", description: "" }]);
  const removeFeature = (index) => setFeatures(prev => prev.filter((_, i) => i !== index));
  const updateFeature = (index, field, value) => setFeatures(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));

  // ── Quick Action Handlers ──────────────────────────────────────────────

  const handleTemplateSettings = () => {
    if (typeof setSection === "function") {
      setSection("Settings");
    }
  };

  const handleUploadMedia = () => setShowUploadModal(true);

  const handleViewAnalytics = () => setShowAnalyticsModal(true);

  const handleExportList = async () => {
    try {
      await exportSubscribersCSV();
      toast.success("Subscriber list exported as CSV");
    } catch { toast.error("Failed to export subscribers"); }
  };

  const handleManageSubscribers = async () => {
    setShowSubscribersModal(true);
    setSubsLoading(true);
    try {
      const data = await listSubscribers({ limit: 100 });
      setSubscribers(data.subscribers || []);
    } catch { toast.error("Failed to load subscribers"); }
    finally { setSubsLoading(false); }
  };

  const handleRemoveSubscriber = async (id) => {
    if (!window.confirm("Remove this subscriber?")) return;
    try {
      await removeSubscriber(id);
      setSubscribers(prev => prev.filter(s => s.$id !== id));
      toast.success("Subscriber removed");
    } catch { toast.error("Failed to remove subscriber"); }
  };

  const handleSearchSubscribers = async () => {
    setSubsLoading(true);
    try {
      const data = await listSubscribers({ search: subsSearch, limit: 100 });
      setSubscribers(data.subscribers || []);
    } catch { toast.error("Search failed"); }
    finally { setSubsLoading(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setSelectedBannerFile(null);
    setLocalBannerPreview("");
    if (!["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
      toast.error("Choose a PNG, JPG, or GIF image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large (max 2MB)");
      return;
    }

    const reader = new FileReader();
    setReadingBanner(true);
    reader.onload = (ev) => {
      setReadingBanner(false);
      if (typeof ev.target?.result !== "string") {
        toast.error("Could not preview this image");
        return;
      }
      setSelectedBannerFile(file);
      setLocalBannerPreview(ev.target.result);
    };
    reader.onerror = () => {
      setReadingBanner(false);
      toast.error("Could not read this image");
    };
    reader.readAsDataURL(file);
  };

  const handleSetBanner = async () => {
    if (!selectedBannerFile) {
      setShowUploadModal(false);
      return;
    }

    setUploadingBanner(true);
    try {
      const uploadedImageUrl = await uploadNewsletterBanner(selectedBannerFile);
      setBannerUrl(uploadedImageUrl);
      setSelectedBannerFile(null);
      setLocalBannerPreview("");
      setShowUploadModal(false);
      toast.success("Banner image uploaded");
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.message || error.error || "Failed to upload banner image",
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const closeUploadModal = () => {
    if (uploadingBanner || readingBanner) return;
    setSelectedBannerFile(null);
    setLocalBannerPreview("");
    setShowUploadModal(false);
  };

  const selectedAudienceCount = getTotalForAudience(targetAudience);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">Broadcast Centre</h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">Send branded emails to all platform users, vendors, or subscribers</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExportList} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={handleManageSubscribers} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Users className="w-4 h-4" /> Manage Subscribers
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "All Platform", value: audienceStats.allPlatform || 0, icon: <Globe className="w-5 h-5" />, color: "from-[#D4A017] to-[#B8860B]" },
            { label: "End Users", value: audienceStats.endUsers || 0, icon: <Users className="w-5 h-5" />, color: "from-[#3498DB] to-[#2980B9]" },
            { label: "Vendors", value: audienceStats.vendors || 0, icon: <Store className="w-5 h-5" />, color: "from-[#27AE60] to-[#2ECC71]" },
            { label: "Subscribers", value: audienceStats.subscribers || 0, icon: <Mail className="w-5 h-5" />, color: "from-[#9B59B6] to-[#8E44AD]" },
          ].map(stat => (
            <div key={stat.label} className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form ────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">Create New Broadcast</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleSendTest} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium">
                    <Mail className="w-4 h-4" /> Send Test
                  </button>
                  <button onClick={() => setShowPreview(!showPreview)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium">
                    <Eye className="w-4 h-4" /> {showPreview ? "Hide Preview" : "Preview"}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">Subject Line *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]"><Hash className="w-5 h-5" /></div>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent text-lg font-medium"
                      placeholder="e.g. New App Update — What's New at Nile Flow" required />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">Message *</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent resize-y leading-7 tracking-normal"
                    placeholder={"Hello there,\n\nWrite your message here. Use a blank line between paragraphs.\n\nBest,\nThe Nile Flow Team"} />
                  <p className="mt-2 text-xs leading-relaxed text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Use a blank line between paragraphs. Paragraphs and line breaks will be preserved in the email.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">Campaign Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {CAMPAIGN_TYPES.map((type) => (
                      <button key={type.id} type="button" onClick={() => setCampaignType(type.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${campaignType === type.id ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg scale-[1.02]` : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"}`}>
                        <div className={`mb-1 ${campaignType === type.id ? "text-white" : ""}`}>{type.icon}</div>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {campaignType === "app_update" && (
                  <div className="mb-6 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017]">New Features</label>
                      <button type="button" onClick={addFeature} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white text-xs font-semibold">
                        <Plus className="w-3 h-3" /> Add Feature
                      </button>
                    </div>
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 mb-3 p-3 rounded-xl bg-white dark:bg-[#1A1A1A] border border-[#E8D6B5]/50">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="text" value={f.icon} onChange={(e) => updateFeature(i, "icon", e.target.value)} className="w-12 text-center px-2 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm" placeholder="✨" />
                            <input type="text" value={f.title} onChange={(e) => updateFeature(i, "title", e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm" placeholder="Feature title" />
                          </div>
                          <input type="text" value={f.description} onChange={(e) => updateFeature(i, "description", e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm" placeholder="Short description" />
                        </div>
                        {features.length > 1 && <button type="button" onClick={() => removeFeature(i)} className="p-1.5 rounded-lg hover:bg-[#E74C3C]/10 text-[#E74C3C]"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    ))}
                  </div>
                )}

                {campaignType === "survey" && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">Survey Link</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]"><ExternalLink className="w-4 h-4" /></div>
                      <input type="url" value={surveyLink} onChange={(e) => setSurveyLink(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent" placeholder="https://forms.gle/your-survey" />
                    </div>
                  </div>
                )}

                {campaignType === "promotion" && (
                  <div className="mb-6 space-y-4 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017]">Banner Image</p>
                        <p className="mt-1 text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Choose an image from your device.</p>
                      </div>
                      <button type="button" onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors">
                        <Image className="w-5 h-5" /> {bannerUrl ? "Change image" : "Choose image"}
                      </button>
                    </div>
                    {bannerUrl && (
                      <img src={bannerUrl} alt="Selected promotion banner" className="w-full max-h-40 rounded-xl object-cover border border-[#E8D6B5] dark:border-[#3A3A3A]" />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">CTA Text</label>
                        <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">CTA Link</label>
                        <input type="url" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent" placeholder="https://nileflowafrica.com/shop" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">Target Audience</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AUDIENCE_GROUPS.map((audience) => {
                      const count = getTotalForAudience(audience.id);
                      return (
                        <button key={audience.id} type="button" onClick={() => setTargetAudience(audience.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${targetAudience === audience.id ? "bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] border-[#D4A017] dark:border-[#D4A017]" : "border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${audience.color} flex items-center justify-center text-white`}>{audience.icon}</div>
                            <div className="text-left">
                              <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">{audience.label}</span>
                              <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">{count.toLocaleString()} recipients</div>
                            </div>
                          </div>
                          {targetAudience === audience.id && <CheckCircle className="w-5 h-5 text-[#27AE60]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Sending...</> : <><Send className="w-5 h-5" /> Send Broadcast Now</>}
                  </button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\nType: ${campaignType}\nAudience: ${targetAudience}`); toast.success("Copied"); }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>
              </form>

              {status && (
                <div className={`mt-6 p-4 rounded-xl border ${statusType === "error" ? "bg-gradient-to-r from-[#E74C3C]/10 to-[#C0392B]/10 border-[#E74C3C] text-[#E74C3C]" : "bg-gradient-to-r from-[#27AE60]/10 to-[#2ECC71]/10 border-[#27AE60] text-[#27AE60]"}`}>
                  <div className="flex items-center gap-3">
                    {statusType === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span className="font-medium">{status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────────── */}
          <div className="space-y-6">
            {showPreview && subject && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">Preview</h3>
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
                    <div><div className="font-bold text-[#2C1810] dark:text-[#F5E6D3] text-sm">Nile Flow Africa</div><div className="text-xs text-gray-500">to all recipients</div></div>
                  </div>
                  <div className="text-base font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">{subject}</div>
                  {message && (
                    <div className="max-h-80 space-y-3 overflow-y-auto break-words text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {message.split(/\r?\n\s*\r?\n/).map((paragraph, index) => paragraph.trim() && (
                        <p key={index} className="whitespace-pre-wrap">{paragraph.trim()}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center text-xs text-[#8B4513]/70">Sending to ~{selectedAudienceCount.toLocaleString()} recipients</div>
              </div>
            )}

            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center flex-shrink-0"><span className="text-white text-sm font-bold">1</span></div>
                  <div><p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Clear Subject Lines</p><p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Keep under 60 characters.</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center flex-shrink-0"><span className="text-white text-sm font-bold">2</span></div>
                  <div><p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Target Wisely</p><p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Use "All Platform" for major updates only.</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center flex-shrink-0"><span className="text-white text-sm font-bold">3</span></div>
                  <div><p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Brand Consistency</p><p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">All emails use the branded Nile Flow template.</p></div>
                </div>
              </div>
            </div>

            {/* ── Quick Actions (ALL PRODUCTION-READY) ───── */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={handleTemplateSettings} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center"><Settings className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Template Settings</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={handleUploadMedia} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center"><Image className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Upload Media</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={handleViewAnalytics} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center"><BarChart className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">View Analytics</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={() => { if (typeof setSection === "function") setSection("Vendors"); }} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">View All Vendors</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={handleExportList} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#E67E22] to-[#D35400] flex items-center justify-center"><Download className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Export Subscriber List</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={handleManageSubscribers} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">Manage Subscribers</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscriber Management Modal ─────────────────── */}
      {showSubscribersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSubscribersModal(false)}>
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">Subscriber Management</h3>
              <button onClick={() => setShowSubscribersModal(false)} className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"><X className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" /></button>
            </div>
            <div className="p-4 border-b border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]"><Search className="w-4 h-4" /></div>
                <input type="text" value={subsSearch} onChange={(e) => setSubsSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearchSubscribers()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 text-sm" placeholder="Search by email..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {subsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#D4A017]" /></div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-12"><Mail className="w-12 h-12 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-3" /><p className="text-[#8B4513]/70 dark:text-[#D4A017]/70">No subscribers found</p></div>
              ) : (
                <div className="space-y-2">
                  {subscribers.map((sub) => (
                    <div key={sub.$id} className="flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5]/50 dark:border-[#3A3A3A]/50 hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-white" /></div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm truncate">{sub.email}</p>
                          {sub.name && <p className="text-xs text-[#8B4513]/70">{sub.name}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSubscriber(sub.$id)} className="p-2 rounded-lg hover:bg-[#E74C3C]/10 text-[#E74C3C] flex-shrink-0" title="Remove"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A] flex justify-between items-center">
              <span className="text-xs text-[#8B4513]/70">{subscribers.length} subscribers</span>
              <button onClick={handleExportList} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-sm font-semibold"><Download className="w-4 h-4" /> Export CSV</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Modal ─────────────────────────────── */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAnalyticsModal(false)}>
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">Audience Analytics</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"><X className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A]">
                <span className="text-sm text-[#8B4513]/70">Total Subscribers</span>
                <span className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">{(audienceStats.subscribers || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A]">
                <span className="text-sm text-[#8B4513]/70">End Users</span>
                <span className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">{(audienceStats.endUsers || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A]">
                <span className="text-sm text-[#8B4513]/70">Vendors</span>
                <span className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">{(audienceStats.vendors || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A]">
                <span className="text-sm font-semibold text-[#8B4513]">Total Platform Reach</span>
                <span className="text-lg font-bold text-[#D4A017]">{(audienceStats.allPlatform || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Media Modal ──────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeUploadModal}>
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">Upload Banner Image</h3>
              <button type="button" onClick={closeUploadModal} disabled={uploadingBanner || readingBanner} className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] disabled:opacity-60"><X className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" /></button>
            </div>
            <div className="space-y-4">
              <label htmlFor="banner-upload-input" className="block border-2 border-dashed border-[#E8D6B5] dark:border-[#3A3A3A] rounded-xl p-8 text-center hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors cursor-pointer">
                <Image className="w-12 h-12 text-[#8B4513] dark:text-[#D4A017] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">Click to upload an image</p>
                <p className="text-xs text-[#8B4513]/70 mt-1">PNG, JPG or GIF, max 2MB</p>
                <input id="banner-upload-input" type="file" accept="image/png,image/jpeg,image/gif" className="sr-only" onChange={handleImageUpload} />
              </label>
              {localBannerPreview && (
                <div className="rounded-xl overflow-hidden border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <img src={localBannerPreview} alt="Selected banner preview" className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={handleSetBanner} disabled={uploadingBanner || readingBanner} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold disabled:opacity-60">
                  {readingBanner ? "Reading image..." : uploadingBanner ? "Uploading..." : selectedBannerFile ? "Upload and use image" : "Done"}
                </button>
                <button type="button" onClick={closeUploadModal} disabled={uploadingBanner || readingBanner} className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] disabled:opacity-60">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
