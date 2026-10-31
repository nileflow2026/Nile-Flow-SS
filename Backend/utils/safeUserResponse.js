function toSafeUserResponse(user) {
  return {
    $id: user.$id,
    email: user.email,
    username: user.username || user.name || null,
    role: user.role || user.prefs?.role || "customer",
    avatarUrl: user.avatarUrl || null,
    isVerified: user.isVerified === true,
    isPremium: user.isPremium === true,
    $createdAt: user.$createdAt || user.createdAt || null,
  };
}

module.exports = { toSafeUserResponse };
