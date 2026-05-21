"use strict";

const { coalesce } = require("./requestCoalescer");

const cacheAwareRead = async ({ operation, collectionId, args, cacheLookup, fetcher }) => {
  const cachedValue = await cacheLookup();
  if (cachedValue != null) {
    return cachedValue;
  }
  return coalesce(operation, collectionId, args, fetcher);
};

module.exports = {
  cacheAwareRead,
};
