"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");

class VendorRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_VENDORS_COLLECTION_ID, "CATALOG");
  }

  async approveVendor(vendorId) {
    return this.update(vendorId, {
      status: "approved",
      approvedAt: new Date().toISOString(),
    });
  }

  async suspendVendor(vendorId, reason) {
    return this.update(vendorId, {
      status: "suspended",
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
    });
  }
}

module.exports = VendorRepository;
