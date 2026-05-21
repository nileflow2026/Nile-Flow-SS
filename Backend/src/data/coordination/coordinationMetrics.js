"use strict";

const client = require("prom-client");
const { registry } = require("../../observability/metrics");

const deduplicatedReadsTotal = new client.Counter({
  name: "nf_data_coordination_deduplicated_reads_total",
  help: "Total number of read requests collapsed by coordination",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const batchRequestsTotal = new client.Counter({
  name: "nf_data_coordination_batch_requests_total",
  help: "Total number of batch query coordination requests",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const recordDeduplicatedRead = ({ collectionId, operation }) => {
  deduplicatedReadsTotal.inc({ collection: collectionId, operation });
};

const recordBatchRequest = ({ collectionId, operation, batchSize }) => {
  batchRequestsTotal.inc({ collection: collectionId, operation });
};

module.exports = {
  recordDeduplicatedRead,
  recordBatchRequest,
};
