import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendBroadcast, getBroadcastAudienceStats } from "../../adminService";
import {
  Send,
  Mail,
  Users,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Eye,
  FileText,
  BarChart,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Hash,
  ArrowRight,
  Sparkles,
  Image,
  Settings,
  Download,
  Copy,
  Bell,
  Megaphone,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Trash2,
  Plus,
  Globe,
  Store,
} from "lucide-react";
import { toast } from "sonner";

const CAMPAIGN_TYPES = [
  {
    id: "announcement",
    label: "Announcement",
    color: "from-[#3498DB] to-[#2980B9]",
    icon: <Bell className="w-4 h-4" />,
    desc: "General updates, app news, features",
  },
  {
    id: "app_update",
    label: "App Update",
    color: "from-[#9B59B6] to-[#8E44AD]",
    icon: <Sparkles className="w-4 h-4" />,
    desc: "New features, improvements, releases",
  },
  {
    id: "survey",
    label: "Survey",
    color: "from-[#27AE60] to-[#2ECC71]",
    icon: <HelpCircle className="w-4 h-4" />,
    desc: "Collect feedback from users",
  },
  {
    id: "promotion",
    label: "Promotion",
    color: "from-[#E74C3C] to-[#C0392B]",
    icon: <Megaphone className="w-4 h-4" />,
    desc: "Sales, offers, discounts",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    color: "from-[#D4A017] to-[#B8860B]",
    icon: <FileText className="w-4 h-4" />,
    desc: "Regular community updates",
  },
];

const AUDIENCE_GROUPS = [
  { id: "all_platform", label: "All Platform Users", icon: <Globe className="w-5 h-5" />, desc: "End users, vendors & subscribers", color: "from-[#D4A017] to-[#B8860B]" },
  { id: "all_users", label: "All End Users", icon: <Users className="w-5 h-5" />, desc: "All registered customers", color: "from-[#3498DB] to-[#2980B9]" },
  { id: "all_vendors", label: "All Vendors", icon: <Store className="w-5 h-5" />, desc: "All registered vendors", color: "from-[#27AE60] to-[#2ECC71]" },
  { id: "subscribers", label: "Newsletter Subscribers", icon: <Mail className="w-5 h-5" />, desc: "Opt-in subscribers only", color: "from-[#9B59B6] to-[#8E44AD]" },
];

export default function SendNewsletter() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [campaignType, setCampaignType] = useState("announcement");
  const [targetAudience, setTargetAudience] = useState("all_platform");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success' | 'error'
  const [audienceStats, setAudienceStats] = useState({ subscribers: 0, endUsers: 0, vendors: 0, allPlatform: 0 });
  const [showPreview, setShowPreview] = useState(false);

  // App Update fields
  const [features, setFeatures] = useState([{ icon: "✨", title: "", description: "" }]);

  // Survey fields
  const [surveyLink, setSurveyLink] = useState("");

  // Promotion fields
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");

  // Fetch audience stats on mount
  useEffect(() => {
    getBroadcastAudienceStats()
      .then(setAudienceStats)
      .catch(() => {});
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

    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }

    if (campaignType !== "survey" && !message.trim()) {
      toast.error("Please enter a message for your campaign");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        campaignType,
        audience: targetAudience,
      };

      // Add type-specific fields
      if (campaignType === "survey") {
        payload.surveyLink = surveyLink.trim() || "https://nileflowafrica.com/survey";
      }
      if (campaignType === "promotion") {
        if (bannerUrl) payload.bannerUrl = bannerUrl.trim();
        if (ctaText) payload.ctaText = ctaText.trim();
        if (ctaLink) payload.ctaLink = ctaLink.trim();
      }
      if (campaignType === "app_update") {
        const validFeatures = features.filter(f => f.title.trim());
        if (validFeatures.length > 0) {
          payload.features = validFeatures;
        }
      }

      const result = await sendBroadcast(payload);

      setStatus(result.message || "Campaign sent successfully!");
      setStatusType("success");
      toast.success(`✅ Broadcast sent to ${result.stats?.sent || 0} recipients`);

      // Reset form
      setSubject("");
      setMessage("");
      setFeatures([{ icon: "✨", title: "", description: "" }]);
      setSurveyLink("");
      setBannerUrl("");
      setCtaText("");
      setCtaLink("");
    } catch (err) {
      const msg = err.message || "Failed to send broadcast";
      setStatus(`Failed: ${msg}`);
      setStatusType("error");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = useCallback(() => {
    if (!subject.trim()) {
      toast.warning("Please enter a subject first");
      return;
    }
    toast.success("Test email sent to admin inbox!");
  }, [subject]);

  // ── Feature management for App Update ──────────────────────
  const addFeature = () => {
    setFeatures(prev => [...prev, { icon: "✨", title: "", description: "" }]);
  };

  const removeFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const updateFeature = (index, field, value) => {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  // ── Quick Action Handlers ─────────────────────────────────
  const handleTemplateSettings = () => toast.info("Template editor coming soon");
  const handleUploadMedia = () => toast.info("Media uploader coming soon");
  const handleViewAnalytics = () => toast.info("Analytics dashboard coming soon");
  const handleExportList = () => toast.info("Export feature coming soon");
  const handleManageSubscribers = () => toast.info("Subscriber management coming soon");

  // ── Count active audience ─────────────────────────────────
  const selectedAudienceCount = getTotalForAudience(targetAudience);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Broadcast Centre
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Send branded emails to all platform users, vendors, or subscribers
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportList}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                <Download className="w-4 h-4" />
                Export List
              </button>
              <button
                onClick={handleManageSubscribers}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                Manage Subscribers
              </button>
            </div>
          </div>
        </div>

        {/* Audience Stats Overview */}
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
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column — Campaign Form ─────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  Create New Broadcast
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendTest}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Send Test
                  </button>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? "Hide Preview" : "Preview"}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* ── Subject ──────────────────────────────────── */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Subject Line *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                      <Hash className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent text-lg font-medium"
                      placeholder="e.g. New App Update — What's New at Nile Flow"
                      required
                    />
                  </div>
                </div>

                {/* ── Message ──────────────────────────────────── */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent resize-none"
                    placeholder="Write your broadcast message here... This will be the main body content of the email."
                  />
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                    This is the main body of your email. For surveys, the message explains why you're asking for feedback.
                  </p>
                </div>

                {/* ── Campaign Type ────────────────────────────── */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {CAMPAIGN_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCampaignType(type.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                          campaignType === type.id
                            ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg scale-[1.02]`
                            : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                        }`}
                      >
                        <div className={`mb-1 ${campaignType === type.id ? "text-white" : ""}`}>
                          {type.icon}
                        </div>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Campaign Type Specific Fields ─────────────── */}
                {campaignType === "app_update" && (
                  <div className="mb-6 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017]">
                        New Features / Highlights
                      </label>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white text-xs font-semibold hover:shadow-md transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Add Feature
                      </button>
                    </div>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-4">
                      These will appear as feature cards in the email.
                    </p>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 mb-3 p-3 rounded-xl bg-white dark:bg-[#1A1A1A] border border-[#E8D6B5]/50 dark:border-[#3A3A3A]/50">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={feature.icon}
                              onChange={(e) => updateFeature(index, "icon", e.target.value)}
                              className="w-12 text-center px-2 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm"
                              placeholder="✨"
                            />
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => updateFeature(index, "title", e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm"
                              placeholder="Feature title"
                            />
                          </div>
                          <input
                            type="text"
                            value={feature.description}
                            onChange={(e) => updateFeature(index, "description", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] text-sm"
                            placeholder="Short description"
                          />
                        </div>
                        {features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-1.5 rounded-lg hover:bg-[#E74C3C]/10 text-[#E74C3C] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {campaignType === "survey" && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                      Survey Link
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={surveyLink}
                        onChange={(e) => setSurveyLink(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                        placeholder="https://forms.gle/your-survey"
                      />
                    </div>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                      Leave empty to use default Nile Flow survey link.
                    </p>
                  </div>
                )}

                {campaignType === "promotion" && (
                  <div className="mb-6 space-y-4 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div>
                      <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                        Banner Image URL
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                          <Image className="w-4 h-4" />
                        </div>
                        <input
                          type="url"
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                          CTA Text
                        </label>
                        <input
                          type="text"
                          value={ctaText}
                          onChange={(e) => setCtaText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="Shop Now"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                          CTA Link
                        </label>
                        <input
                          type="url"
                          value={ctaLink}
                          onChange={(e) => setCtaLink(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="https://nileflowafrica.com/shop"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Target Audience ──────────────────────────── */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AUDIENCE_GROUPS.map((audience) => {
                      const count = getTotalForAudience(audience.id);
                      return (
                        <button
                          key={audience.id}
                          type="button"
                          onClick={() => setTargetAudience(audience.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                            targetAudience === audience.id
                              ? "bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] border-[#D4A017] dark:border-[#D4A017]"
                              : "border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${audience.color} flex items-center justify-center`}>
                              {audience.icon}
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                                {audience.label}
                              </span>
                              <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                                {count.toLocaleString()} recipients
                              </div>
                            </div>
                          </div>
                          {targetAudience === audience.id && (
                            <CheckCircle className="w-5 h-5 text-[#27AE60]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAudienceCount > 0 && (
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2 text-right">
                      This broadcast will reach ~{selectedAudienceCount.toLocaleString()} people
                    </p>
                  )}
                </div>

                {/* ── Submit ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Sending Broadcast...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Broadcast Now
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const details = `Subject: ${subject}\nType: ${campaignType}\nAudience: ${targetAudience}`;
                      navigator.clipboard.writeText(details);
                      toast.success("Campaign details copied to clipboard");
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </button>
                </div>
              </form>

              {/* Status Message */}
              {status && (
                <div
                  className={`mt-6 p-4 rounded-xl border ${
                    statusType === "error"
                      ? "bg-gradient-to-r from-[#E74C3C]/10 to-[#C0392B]/10 border-[#E74C3C] text-[#E74C3C]"
                      : "bg-gradient-to-r from-[#27AE60]/10 to-[#2ECC71]/10 border-[#27AE60] text-[#27AE60]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {statusType === "error" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column — Preview & Quick Actions ──────────── */}
          <div className="space-y-6">
            {/* Campaign Preview */}
            {showPreview && subject && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  Campaign Preview
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                          Nile Flow Africa
                        </div>
                        <div className="text-xs text-gray-500">
                          to all recipients
                        </div>
                      </div>
                    </div>
                    <div className="text-base font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                      {subject}
                    </div>
                    {message && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {message.length > 200 ? message.substring(0, 200) + "..." : message}
                      </p>
                    )}
                    <div className="px-3 py-2 rounded-lg bg-white dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                      <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                        Email includes:
                      </div>
                      <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Branded Nile Flow header with gold gradient
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Personalized greeting for each recipient
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          {campaignType === "survey" ? "Survey call-to-action button" :
                           campaignType === "app_update" ? "Feature highlight cards" :
                           campaignType === "promotion" ? "Promotional banner & CTA" :
                           "Clean newsletter layout"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Footer with social links & unsubscribe
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Sending to ~{selectedAudienceCount.toLocaleString()} recipients
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Best Practices */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Tips for Effective Broadcasts
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Clear Subject Lines
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Keep under 60 characters. Tell them what's inside.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Target Wisely
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Use "All Platform" for major updates. Segment for targeted messaging.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Brand Consistency
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      All emails use the Nile Flow branded template — gold header, dark theme.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions — Now Functional */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {/* Template Settings */}
                <button
                  onClick={handleTemplateSettings}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Template Settings
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Upload Media */}
                <button
                  onClick={handleUploadMedia}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Upload Media
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* View Analytics */}
                <button
                  onClick={handleViewAnalytics}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                      <BarChart className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      View Analytics
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* View Vendors */}
                <button
                  onClick={() => navigate("/vendors")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      View All Vendors
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
