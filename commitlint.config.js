module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "pipeline",
        "queue",
        "auth",
        "billing",
        "api",
        "ui",
        "db",
        "ai",
        "enrichment",
        "landing",
        "devops",
        "docs",
      ],
    ],
  },
};
