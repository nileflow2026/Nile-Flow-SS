"use strict";

const GovernanceError = require("./governanceErrors");

const enforceCachePolicy = ({ bypassCache, reason }) => {
  if (bypassCache) {
    throw new GovernanceError(
      `Cache bypass is forbidden under repository governance${reason ? `: ${reason}` : "."}`,
      { bypassCache, reason },
    );
  }
};

module.exports = {
  enforceCachePolicy,
};
