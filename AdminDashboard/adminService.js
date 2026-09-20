// adminService.js — Consolidated service module for AdminDashboard
// Contains all API calls used across pages and components

import axiosClient from './api';

// ─── Authentication & User Profile ──────────────────────────────────────────

export const login = async (credentials) => {
  try {
    const response = await axiosClient.post('/api/admin/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = async () => {
  try {
    await axiosClient.post('/api/admin/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosClient.get('/api/admin/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Team Members ───────────────────────────────────────────────────────────

export const getTeamMembers = async () => {
  const response = await axiosClient.get('/api/v1/team-members');
  return response.data?.data || [];
};

export const createTeamMember = async (payload) => {
  const response = await axiosClient.post('/api/v1/team-members', payload);
  return response.data;
};

export const updateTeamMember = async (teamMemberId, payload) => {
  const response = await axiosClient.patch(`/api/v1/team-members/${teamMemberId}`, payload);
  return response.data;
};

export const deleteTeamMember = async (teamMemberId) => {
  const response = await axiosClient.delete(`/api/v1/team-members/${teamMemberId}`);
  return response.data;
};

export const getProfile = async (userId) => {
  try {
    const response = await axiosClient.get(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateUserPreferences = async (userId, preferences) => {
  try {
    const response = await axiosClient.patch(`/api/admin/users/${userId}/preferences`, preferences);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const fetchUsers = async () => {
  try {
    const response = await axiosClient.get('/api/admin/users');
    return response.data?.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// ─── Vendors ─────────────────────────────────────────────────────────────────

export const getVendors = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/vendors', { params: filters });
    return response.data?.vendors || [];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
};

export const getVendorStats = async () => {
  try {
    const response = await axiosClient.get('/api/admin/vendors/stats');
    return response.data?.stats || {};
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return {};
  }
};

export const toggleVendorStatus = async (vendorId, newStatus) => {
  try {
    const response = await axiosClient.patch(`/api/admin/vendors/${vendorId}/status`, { status: newStatus });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetVendorPassword = async (vendorId, newPassword) => {
  try {
    const response = await axiosClient.post('/api/vendor/auth/reset-vendor-password', { vendorId, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const sendVendorForgotPasswordCode = async (email) => {
  try {
    const response = await axiosClient.post('/api/vendor/auth/forgot-password/send-code', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const getOrders = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/orders', { params: filters });
    return response.data?.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getCancelledOrders = async () => {
  try {
    const response = await axiosClient.get('/api/admin/orders/cancelled');
    return response.data?.orders || [];
  } catch (error) {
    console.error('Error fetching cancelled orders:', error);
    return [];
  }
};

export const getRiders = async () => {
  try {
    const response = await axiosClient.get('/api/admin/riders');
    return response.data?.riders || [];
  } catch (error) {
    console.error('Error fetching riders:', error);
    return [];
  }
};

export const assignRiderToOrder = async (orderId, riderId) => {
  try {
    const response = await axiosClient.post('/api/admin/orders/assign-delivery', { orderId, riderId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axiosClient.post('/api/admin/orderStatus', { orderId, status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCustomerAddress = async (customerId) => {
  try {
    const response = await axiosClient.get(`/api/admin/customers/${customerId}/address`);
    return response.data?.address || null;
  } catch (error) {
    console.error('Error fetching customer address:', error);
    return null;
  }
};

// ─── Products ────────────────────────────────────────────────────────────────

export const getProducts = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/products', { params: filters });
    return response.data?.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const getNotifications = async (type) => {
  try {
    let url = '/api/notifications';
    if (type && type !== 'all') {
      url += `?type=${type}`;
    }
    const response = await axiosClient.get(url);
    return response.data?.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await axiosClient.delete('/api/notifications/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return null;
  }
};

export const fetchAdminNotifications = async () => {
  try {
    const response = await axiosClient.get('/api/notifications/admin');
    return response.data?.result || [];
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }
};

export const markNotificationsAsRead = async (ids) => {
  try {
    const response = await axiosClient.post('/api/notifications/mark-as-read', { ids });
    return response.data;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return null;
  }
};

export const fetchAllNotificationTypes = async () => {
  try {
    const response = await axiosClient.get('/api/notifications/all');
    return response.data?.notifications || [];
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
};

export const forceRefreshNotifications = async () => {
  try {
    const timestamp = new Date().getTime();
    const response = await axiosClient.get(`/api/notifications?_t=${timestamp}&force=true`);
    return response.data?.result || response.data?.notifications || [];
  } catch (error) {
    console.error('Error force refreshing notifications:', error);
    return [];
  }
};

// ─── Analytics & Dashboard Stats ─────────────────────────────────────────────

export const getDashboardStats = async () => {
  try {
    const response = await axiosClient.get('/api/admin/stats');
    return response.data?.stats || {};
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {};
  }
};

export const getAuditLogs = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/audit-logs', { params: filters });
    return response.data?.logs || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

// ─── Commission Management ───────────────────────────────────────────────────

export const getCommissionSettings = async () => {
  try {
    const response = await axiosClient.get('/api/admin/commission/settings');
    return response.data?.settings || {};
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    return {};
  }
};

export const updateCommissionRate = async (rate) => {
  try {
    const response = await axiosClient.post('/api/admin/commission/rate', { rate });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCommissionAnalytics = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/commission/analytics', { params: filters });
    // Backend may return { success: true, data: {...} } or { success: true, analytics: {...} }
    return response.data?.analytics || response.data?.data || {};
  } catch (error) {
    console.error('Error fetching commission analytics:', error);
    return {};
  }
};

export const getGMVData = async (timeframe = 'last30') => {
  try {
    const response = await axiosClient.get('/api/admin/commission/gmv', { params: { timeframe } });
    return response.data?.gmv || {};
  } catch (error) {
    console.error('Error fetching GMV data:', error);
    return {};
  }
};

export const batchRecalculateCommissions = async () => {
  try {
    const response = await axiosClient.post('/api/admin/commission/recalculate');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── User Management ───────────────────────────────────────────────────────

export const getUserOrders = async (userId) => {
  try {
    const response = await axiosClient.get(`/api/admin/users/${userId}/orders`);
    return response.data?.orders || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

export const getUserAddresses = async (userId) => {
  try {
    const response = await axiosClient.get(`/api/admin/users/${userId}/addresses`);
    return response.data?.addresses || [];
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }
};

export const getUserPreferences = async (userId) => {
  try {
    const response = await axiosClient.get(`/api/admin/users/${userId}/preferences`);
    return response.data?.preferences || {};
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return {};
  }
};

// ─── Newsletter Management ─────────────────────────────────────────────────

export const sendBroadcast = async (broadcastData) => {
  try {
    const response = await axiosClient.post('/api/admin/newsletter/broadcast', broadcastData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getBroadcastAudienceStats = async () => {
  try {
    const response = await axiosClient.get('/api/admin/newsletter/audience-stats');
    return response.data?.stats || {};
  } catch (error) {
    console.error('Error fetching audience stats:', error);
    return {};
  }
};

export const listSubscribers = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/newsletter/subscribers', { params: filters });
    return response.data?.subscribers || [];
  } catch (error) {
    console.error('Error listing subscribers:', error);
    return [];
  }
};

export const removeSubscriber = async (subscriberId) => {
  try {
    const response = await axiosClient.delete(`/api/admin/newsletter/subscribers/${subscriberId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const exportSubscribersCSV = async () => {
  try {
    const response = await axiosClient.get('/api/admin/newsletter/subscribers/export', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    return null;
  }
};

// ─── Banner Management ───────────────────────────────────────────────────────

export const getBanners = async () => {
  try {
    const response = await axiosClient.get('/api/v1/banners');
    return response.data?.banners || response.data || [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

export const createBanner = async (formData) => {
  try {
    const response = await axiosClient.post('/api/v1/banners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateBanner = async (bannerId, formData) => {
  try {
    const response = await axiosClient.patch(`/api/v1/banners/${bannerId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteBanner = async (bannerId) => {
  try {
    const response = await axiosClient.delete(`/api/v1/banners/${bannerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Product Approval ────────────────────────────────────────────────────────

export const getPendingProducts = async () => {
  try {
    const response = await axiosClient.get('/api/admin/products/pending');
    return response.data?.products || [];
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return [];
  }
};

export const approveProduct = async (productId) => {
  try {
    const response = await axiosClient.post(`/api/admin/products/approve/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const rejectProduct = async (productId, reason) => {
  try {
    const response = await axiosClient.post(`/api/admin/products/reject/${productId}`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Commission & Finance ───────────────────────────────────────────────────

export const getCommissionData = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/commission', { params: filters });
    return response.data?.commission || {};
  } catch (error) {
    console.error('Error fetching commission data:', error);
    return {};
  }
};

export const getFinanceData = async (filters = {}) => {
  try {
    const response = await axiosClient.get('/api/admin/finance', { params: filters });
    return response.data?.finance || {};
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return {};
  }
};

// ─── Settings ───────────────────────────────────────────────────────────────

export const getSettings = async () => {
  try {
    const response = await axiosClient.get('/api/admin/settings');
    return response.data?.settings || {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

export const updateSettings = async (settings) => {
  try {
    const response = await axiosClient.patch('/api/admin/settings', settings);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─── Deals Management ───────────────────────────────────────────────────────

export const getDeals = async (type = 'all', options = {}) => {
  try {
    const params = {};
    if (type !== 'all') params.type = type;
    if (options.category) params.category = options.category;
    if (options.search) params.search = options.search;

    const response = await axiosClient.get('/api/admin/deals', { params });
    return response.data?.deals || [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw new Error('Failed to fetch deals');
  }
};

export const createDeal = async (dealData) => {
  try {
    const formData = new FormData();
    Object.entries(dealData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v, i) => formData.append(`${key}[${i}]`, v));
        } else {
          formData.append(key, value);
        }
      }
    });
    const response = await axiosClient.post('/api/admin/deals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.deal;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal');
  }
};

export const updateDeal = async (dealId, dealData) => {
  try {
    const formData = new FormData();
    Object.entries(dealData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v, i) => formData.append(`${key}[${i}]`, v));
        } else {
          formData.append(key, value);
        }
      }
    });
    const response = await axiosClient.patch(`/api/admin/deals/${dealId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.deal;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw new Error('Failed to update deal');
  }
};

export const deleteDeal = async (dealId) => {
  try {
    const response = await axiosClient.delete(`/api/admin/deals/${dealId}`);
    return response.data?.success;
  } catch (error) {
    console.error('Error deleting deal:', error);
    return false;
  }
};

export const getDealAnalytics = async () => {
  try {
    const response = await axiosClient.get('/api/admin/deals/analytics');
    return response.data?.analytics || {};
  } catch (error) {
    console.error('Error fetching deal analytics:', error);
    return {};
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  getProfile,
  updateUserPreferences,
  fetchUsers,
  getVendors,
  getVendorStats,
  toggleVendorStatus,
  resetVendorPassword,
  sendVendorForgotPasswordCode,
  getOrders,
  getProducts,
  getNotifications,
  clearAllNotifications,
  fetchAdminNotifications,
  markNotificationsAsRead,
  fetchAllNotificationTypes,
  forceRefreshNotifications,
  getDashboardStats,
  getAuditLogs,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getCommissionData,
  getFinanceData,
  getSettings,
  updateSettings,
  getCancelledOrders,
  getRiders,
  assignRiderToOrder,
  updateOrderStatus,
  getCustomerAddress,
  getCommissionSettings,
  updateCommissionRate,
  getCommissionAnalytics,
  getGMVData,
  batchRecalculateCommissions,
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealAnalytics,
  getUserOrders,
  getUserAddresses,
  getUserPreferences,
  sendBroadcast,
  getBroadcastAudienceStats,
  listSubscribers,
  removeSubscriber,
  exportSubscribersCSV,
};
