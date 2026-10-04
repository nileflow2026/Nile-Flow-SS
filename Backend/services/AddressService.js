const { ID, Query, Permission, Role } = require("node-appwrite");
const { db } = require("../src/appwrite");
const { env } = require("../src/env");

const ADDRESS_PAGE_SIZE = 100;
const ADDRESS_FIELDS = [
  "fullName",
  "phone",
  "address",
  "city",
  "state",
  "zipCode",
  "country",
];

function resolveAddressOwner(address) {
  const currentOwner =
    typeof address.user === "string" ? address.user.trim() : "";
  const legacyOwner =
    typeof address.userId === "string" ? address.userId.trim() : "";

  if (currentOwner && legacyOwner && currentOwner !== legacyOwner) {
    return null;
  }

  return currentOwner || legacyOwner || null;
}

async function listAllOwnedBy(field, userId) {
  const documents = [];
  let offset = 0;

  while (true) {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID,
      [
        Query.equal(field, userId),
        Query.limit(ADDRESS_PAGE_SIZE),
        Query.offset(offset),
      ],
    );

    documents.push(...response.documents);
    if (documents.length >= response.total || response.documents.length === 0) {
      return documents;
    }

    offset += response.documents.length;
  }
}

function getAllowedFields(source) {
  return Object.fromEntries(
    ADDRESS_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(source, field),
    ).map((field) => [field, source[field]]),
  );
}

async function getAddressDocument(addressId) {
  try {
    return await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID,
      addressId,
    );
  } catch (error) {
    if (error.code === 404 || error.type === "document_not_found") {
      return null;
    }

    throw error;
  }
}

const AddressService = {
  getAddresses: async (userId) => {
    if (!userId) {
      throw new Error("An authenticated user is required to list addresses.");
    }

    const [currentAddresses, legacyAddresses] = await Promise.all([
      listAllOwnedBy("user", userId),
      listAllOwnedBy("userId", userId),
    ]);
    const uniqueAddresses = new Map();

    for (const address of [...currentAddresses, ...legacyAddresses]) {
      if (resolveAddressOwner(address) === userId) {
        uniqueAddresses.set(address.$id, address);
      }
    }

    return [...uniqueAddresses.values()];
  },

  getOwnedAddress: async (addressId, userId) => {
    if (!addressId || !userId) return null;
    const address = await getAddressDocument(addressId);

    return address && resolveAddressOwner(address) === userId
      ? address
      : null;
  },

  getCustomerAddressByType: async (customerId, addressType = "delivery") => {
    if (!customerId) {
      throw new Error("A customer ID is required to list addresses.");
    }

    const addresses = await listAllOwnedBy("user", customerId);
    let filteredAddresses = addresses;

    if (addressType && addresses.some((address) => address.type !== undefined)) {
      const actualType = addressType === "delivery" ? "pickup" : addressType;
      filteredAddresses = addresses.filter(
        (address) => address.type === actualType,
      );
    }

    return filteredAddresses;
  },

  addAddress: async (userId, newAddress) => {
    if (!userId || !newAddress || typeof newAddress !== "object") {
      throw new Error("Valid address details and an owner are required.");
    }

    const payload = {
      user: userId,
      type: "delivery",
      ...getAllowedFields(newAddress),
      fullName: newAddress.fullName || "",
      phone: newAddress.phone,
      address: newAddress.address,
      city: newAddress.city || "",
      state: newAddress.state || "",
      zipCode: newAddress.zipCode || "",
      country: Object.prototype.hasOwnProperty.call(newAddress, "country")
        ? newAddress.country
        : "Kenya",
    };
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.write(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    return db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID,
      ID.unique(),
      payload,
      permissions,
    );
  },

  updateAddress: async (userId, addressId, updatedData) => {
    const currentAddress = await AddressService.getOwnedAddress(
      addressId,
      userId,
    );
    if (!currentAddress) return null;

    return db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID,
      addressId,
      getAllowedFields(updatedData),
    );
  },

  deleteAddress: async (userId, addressId) => {
    const currentAddress = await AddressService.getOwnedAddress(
      addressId,
      userId,
    );
    if (!currentAddress) return false;

    await db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADDRESS_COLLECTION_ID,
      addressId,
    );
    return true;
  },
};

module.exports = AddressService;
