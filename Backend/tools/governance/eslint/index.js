"use strict";

const noDirectAppwrite = require("./no-direct-appwrite");
const noRawDbAccess = require("./no-raw-db-access");
const repositoryBoundaryRules = require("./repository-boundary-rules");

module.exports = {
  rules: {
    "no-direct-appwrite": noDirectAppwrite,
    "no-raw-db-access": noRawDbAccess,
    "repository-boundary-rules": repositoryBoundaryRules,
  },
};
