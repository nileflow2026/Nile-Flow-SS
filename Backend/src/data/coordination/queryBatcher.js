"use strict";

const { recordBatchRequest } = require("./coordinationMetrics");
const { coalesce } = require("./requestCoalescer");

const batchQueries = async (operation, collectionId, querySets, executor) => {
  recordBatchRequest({ operation, collectionId, batchSize: querySets.length });
  return Promise.all(querySets.map((queryArgs) => coalesce(operation, collectionId, queryArgs, () => executor(queryArgs))));
};

module.exports = {
  batchQueries,
};
