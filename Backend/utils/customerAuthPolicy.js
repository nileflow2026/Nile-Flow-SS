function isCustomerEmailVerified(user) {
  return user?.prefs?.isVerified === true;
}

module.exports = { isCustomerEmailVerified };
