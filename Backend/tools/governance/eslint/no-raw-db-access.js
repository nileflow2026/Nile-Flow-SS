"use strict";

const path = require("path");

const forbiddenMethods = new Set([
  "listDocuments",
  "getDocument",
  "createDocument",
  "updateDocument",
  "deleteDocument",
]);

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
        "Disallow raw Appwrite Database method invocation outside the data layer",
      category: "Governance",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    return {
      MemberExpression(node) {
        if (isInDataLayer(filename)) return;
        if (
          node.object &&
          node.object.type === "Identifier" &&
          node.object.name === "db" &&
          node.property &&
          ((node.property.type === "Identifier" &&
            forbiddenMethods.has(node.property.name)) ||
            (node.property.type === "Literal" &&
              forbiddenMethods.has(node.property.value)))
        ) {
          context.report({
            node,
            message:
              "Raw Appwrite db operations are forbidden outside Backend/src/data. Use a repository or service layer instead.",
          });
        }
      },
    };
  },
};
