"use strict";

const { getPromise, setPromise, deletePromise } = require("./promiseRegistry");

const buildKey = (operation, collectionId, args) => `${operation}:${collectionId}:${JSON.stringify(args || [])}`;

const hasInFlight = (operation, collectionId, args) => getPromise(operation, collectionId, args) != null;

const queuePromise = (operation, collectionId, args, promise) => {
  setPromise(operation, collectionId, args, promise);
};

const clearInFlight = (operation, collectionId, args) => deletePromise(operation, collectionId, args);

module.exports = {
  buildKey,
  hasInFlight,
  queuePromise,
  clearInFlight,
};
