function maskEmailAddress(email) {
  const match = /^([^@]+)@([^@]+)$/.exec(String(email));
  if (!match) return "***";

  return `${match[1].charAt(0)}***@${match[2]}`;
}

module.exports = { maskEmailAddress };
