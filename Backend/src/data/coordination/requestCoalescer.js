"use strict";

const { getPromise, setPromise, deletePromise } = require("./promiseRegistry");
const { recordDeduplicatedRead } = require("./coordinationMetrics");

const coalesce = async (operation, collectionId, args, executor) => {
  const existing = getPromise(operation, collectionId, args);
  if (existing) {
    recordDeduplicatedRead({ operation, collectionId });
    return existing;
  }

  const promise = executor().finally(() => deletePromise(operation, collectionId, args));
  setPromise(operation, collectionId, args, promise);
  return promise;
};

module.exports = {
  coalesce,
};
