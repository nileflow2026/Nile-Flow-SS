"use strict";

const path = require("path");
const collectionIdentifierRegex = /APPWRITE_[A-Z0-9_]+_COLLECTION_ID/;
const collectionStringRegex =
  /\b(products|categories|vendors|orders|payments|subscriptions|notifications|nileMiles|rewardHistory|deliveries|riders|africanFacts|proverbs|groupOrders|aiChatSessions)\b/;

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
        "Disallow collection access patterns outside the data layer and repository boundary",
      category: "Governance",
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    if (isInDataLayer(filename)) {
      return {};
    }

    return {
      Literal(node) {
        if (
          typeof node.value === "string" &&
          collectionStringRegex.test(node.value)
        ) {
          context.report({
            node,
            message:
              "Hard-coded Appwrite collection references are forbidden outside Backend/src/data. Use a repository boundary instead.",
          });
        }
      },
      Identifier(node) {
        if (collectionIdentifierRegex.test(node.name)) {
          context.report({
            node,
            message:
              "Appwrite collection identifier access is forbidden outside Backend/src/data. Use repository-level collection ownership validation.",
          });
        }
      },
    };
  },
};
