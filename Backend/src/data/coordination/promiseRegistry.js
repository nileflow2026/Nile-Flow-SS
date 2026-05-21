"use strict";

const inFlightPromises = new Map();

const buildKey = (operation, collectionId, args) => {
  const normalizedArgs = JSON.stringify(args || []);
  return `${operation}:${collectionId}:${normalizedArgs}`;
};

const getPromise = (operation, collectionId, args) => {
  return inFlightPromises.get(buildKey(operation, collectionId, args));
};

const setPromise = (operation, collectionId, args, promise) => {
  inFlightPromises.set(buildKey(operation, collectionId, args), promise);
};

const deletePromise = (operation, collectionId, args) => {
  inFlightPromises.delete(buildKey(operation, collectionId, args));
};

module.exports = {
  getPromise,
  setPromise,
  deletePromise,
};
