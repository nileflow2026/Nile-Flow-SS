const path = require("path");

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
    commonjs: true,
    es2020: true,
  },
  plugins: {
    governance: require("./tools/governance/eslint"),
  },
  rules: {
    "governance/no-direct-appwrite": "error",
    "governance/no-raw-db-access": "error",
    "governance/repository-boundary-rules": "error",
  },
  overrides: [
    {
      files: ["tools/governance/**/*.js"],
      rules: {
        "governance/no-direct-appwrite": "off",
        "governance/no-raw-db-access": "off",
        "governance/repository-boundary-rules": "off",
      },
    },
  ],
};
