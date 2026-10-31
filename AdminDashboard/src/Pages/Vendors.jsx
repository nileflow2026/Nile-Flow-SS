import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getVendors,
  getVendorStats,
  toggleVendorStatus,
  resetVendorPassword,
  sendVendorForgotPasswordCode,
} from "../../adminService";
import {
  Search,
  Store,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  RefreshCw,
  ChevronDown,
  Eye,
  UserCheck,
  UserX,
  Download,
  Key,
  Lock,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  active: "bg-[#27AE60]",
  inactive: "bg-[#E74C3C]",
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [resetModal, setResetModal] = useState(null); // vendor object or null
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const itemsPerPage = 10;

  const fetchData = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = { page, limit: itemsPerPage };
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;

      const [vendorData, statsData] = await Promise.all([
        getVendors(filters),
        getVendorStats(),
      ]);

      setVendors(vendorData.vendors || []);
      setTotalPages(vendorData.totalPages || 1);
      setStats(statsData);
    } catch (err) {

      setError(err);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handleToggleStatus = async (vendorId, currentStatus) => {
    setUpdatingId(vendorId);
    try {
      const newStatus = !currentStatus;
      await toggleVendorStatus(vendorId, newStatus);
      setVendors((prev) =>
        prev.map((v) =>
          v.$id === vendorId ? { ...v, isActive: newStatus } : v
        )
      );
      toast.success(
        `Vendor ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch {
      toast.error("Failed to update vendor status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPassword = async (vendorId, email) => {
    setResetLoading(true);
    setResetError("");
    try {
      await sendVendorForgotPasswordCode(email);
      setResetSent(true);
      toast.success("Reset code sent to vendor email");
    } catch (err) {
      setResetError(err.message || "Failed to send reset code");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDirectReset = async () => {
    if (!resetModal) return;
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      await resetVendorPassword(resetModal.$id, resetPassword);
      toast.success(`Password reset for ${resetModal.storeName}`);
      setResetModal(null);
      setResetPassword("");
    } catch (err) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        !searchTerm ||
        vendor.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && vendor.isActive !== false) ||
        (statusFilter === "inactive" && vendor.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter]);

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "V";
  };

  const exportToCSV = () => {
    if (!vendors.length) return;
    const headers = [
      "Store Name",
      "Owner Name",
      "Email",
      "Phone",
      "Location",
      "Category",
      "Status",
      "Joined",
    ];
    const rows = vendors.map((v) => [
      v.storeName || "",
      v.name || "",
      v.email || "",
      v.phone || "",
      v.location || "",
      v.category || "",
      v.isActive !== false ? "Active" : "Inactive",
      v.$createdAt
        ? new Date(v.$createdAt).toLocaleDateString()
        : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading skeleton
  if (isLoading && vendors.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
              ></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && vendors.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-8 shadow-xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Vendors
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error.message || "An error occurred while loading vendors"}
          </p>
          <button
            onClick={() => fetchData(1)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
              Vendor Management
            </h2>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
              Manage all registered vendors and their stores
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Vendors
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1A2C1A] dark:to-[#0A1C0A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Active
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FDEDED] to-[#F5D6D6] dark:from-[#3A1A1A] dark:to-[#2A0A0A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Inactive
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search vendors by store name, owner, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="space-y-4">
        {filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => (
            <div
              key={vendor.$id}
              className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-200"
            >
              {/* Main row */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 ${
                        vendor.isActive !== false
                          ? "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"
                          : "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]"
                      }`}
                    >
                      {getInitials(vendor.storeName || vendor.name)}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                          {vendor.storeName || vendor.name || "Unnamed Store"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            vendor.isActive !== false
                              ? "bg-[#27AE60]/10 text-[#27AE60]"
                              : "bg-[#E74C3C]/10 text-[#E74C3C]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              statusColors[
                                vendor.isActive !== false
                                  ? "active"
                                  : "inactive"
                              ]
                            }`}
                          ></span>
                          {vendor.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-3">
                        {vendor.name && (
                          <span className="font-medium">
                            {vendor.name}
                            {vendor.name && " · "}
                          </span>
                        )}
                        {vendor.category && (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {vendor.category}
                          </span>
                        )}
                      </p>

                      {/* Contact chips */}
                      <div className="flex flex-wrap gap-2">
                        {vendor.email && (
                          <a
                            href={`mailto:${vendor.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8D6B5]/20 dark:bg-[#3A3A3A]/50 text-xs font-medium text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/40 dark:hover:bg-[#3A3A3A] transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#3498DB]" />
                            {vendor.email}
                          </a>
                        )}

                        {vendor.phone && (
                          <a
                            href={`tel:${vendor.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8D6B5]/20 dark:bg-[#3A3A3A]/50 text-xs font-medium text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/40 dark:hover:bg-[#3A3A3A] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#27AE60]" />
                            {vendor.phone}
                          </a>
                        )}

                        {vendor.location && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8D6B5]/20 dark:bg-[#3A3A3A]/50 text-xs font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            <MapPin className="w-3.5 h-3.5 text-[#E74C3C]" />
                            {vendor.location}
                          </span>
                        )}

                        {vendor.$createdAt && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8D6B5]/20 dark:bg-[#3A3A3A]/50 text-xs font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            <Calendar className="w-3.5 h-3.5 text-[#9B59B6]" />
                            Joined{" "}
                            {new Date(vendor.$createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        setExpandedVendor(
                          expandedVendor === vendor.$id
                            ? null
                            : vendor.$id
                        )
                      }
                      className="p-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[#3498DB]" />
                    </button>

                    <button
                      onClick={() =>
                        handleToggleStatus(
                          vendor.$id,
                          vendor.isActive !== false
                        )
                      }
                      disabled={updatingId === vendor.$id}
                      className={`p-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors disabled:opacity-50`}
                      title={
                        vendor.isActive !== false
                          ? "Deactivate Vendor"
                          : "Activate Vendor"
                      }
                    >
                      {updatingId === vendor.$id ? (
                        <div className="w-4 h-4 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin"></div>
                      ) : vendor.isActive !== false ? (
                        <UserX className="w-4 h-4 text-[#E74C3C]" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-[#27AE60]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setResetModal(vendor);
                        setResetPassword("");
                        setResetSent(false);
                        setResetError("");
                      }}
                      className="p-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4 text-[#D4A017]" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVendor === vendor.$id && (
                  <div className="mt-6 pt-6 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendor.storeDescription && (
                        <div className="col-span-full">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Store Description
                          </p>
                          <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                            {vendor.storeDescription}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                          Vendor ID
                        </p>
                        <p className="text-sm font-mono text-[#2C1810] dark:text-[#F5E6D3]">
                          {vendor.$id}
                        </p>
                      </div>

                      {vendor.profileImage && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Profile Image
                          </p>
                          <img
                            src={vendor.profileImage}
                            alt="Profile"
                            className="w-16 h-16 rounded-lg object-cover border border-[#E8D6B5]"
                          />
                        </div>
                      )}

                      {vendor.socialLinks && Object.keys(vendor.socialLinks).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-1">
                            Social Links
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(vendor.socialLinks).map(([platform, url]) => (
                              url && (
                                <a
                                  key={platform}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#3498DB] hover:text-[#2980B9] underline"
                                >
                                  {platform}
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-12 text-center shadow-xl">
            <Store className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
            <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
              No vendors found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No vendors have registered yet"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Page{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm font-medium text-[#8B4513] dark:text-[#D4A017]"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm font-medium text-[#8B4513] dark:text-[#D4A017]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setResetModal(null)}
          />
          <div className="relative bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] shadow-2xl w-full max-w-md p-6">
            <button
              onClick={() => setResetModal(null)}
              className="absolute top-4 right-4 text-[#8B4513]/50 dark:text-[#D4A017]/50 hover:text-[#E74C3C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  Reset Password
                </h3>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  {resetModal.storeName || resetModal.name}
                </p>
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {resetError}
              </div>
            )}

            {!resetSent ? (
              <div className="space-y-4">
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Send a reset code to the vendor's email so they can set a new password?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResetModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResetPassword(resetModal.$id, resetModal.email)}
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Reset code sent to {resetModal.email}
                </div>
                <button
                  onClick={() => setResetModal(null)}
                  className="w-full py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
