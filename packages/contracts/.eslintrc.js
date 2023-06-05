module.exports = {
  root: true,
  extends: "eslint:recommended",
  env: {
    node: true,
    jest: true,
  },
  // One configuration for TS files and their rules, a second configuration to json files (package.json) to enforce
  // usage of explicit package dependency
  overrides: [
    {
      files: ["*.ts", "*.js"],
      extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      rules: {
        "@typescript-eslint/no-inferrable-types": "off",
      },
    },
    //
    {
      files: ["package.json"],
      plugins: ["json-files"],
      extends: [
        // Enables eslint-plugin-prettier and eslint-config-prettier.
        // This will display Prettier errors as ESLint errors.
        // This should always be the last configuration in the extends array.
        "plugin:prettier/recommended",
      ],
      rules: {
        "json-files/restrict-ranges": ["error", { versionHint: "pin" }],
      },
    },
  ],
};
