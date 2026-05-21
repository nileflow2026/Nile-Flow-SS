"use strict";

const path = require("path");

const isInDataLayer = (filename) => {
  if (!filename) return false;
  const normalized = filename.replace(/\\/g, "/");
  return normalized.includes("/Backend/src/data/");
};

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct Appwrite `Databases` instantiation outside the data layer",
      category: "Governance",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    return {
      NewExpression(node) {
        if (isInDataLayer(filename)) return;
        if (node.callee && node.callee.name === "Databases") {
          context.report({
            node,
            message:
              "Direct Appwrite Databases instantiation is forbidden outside Backend/src/data. Use repository abstractions instead.",
          });
        }
      },
    };
  },
};
