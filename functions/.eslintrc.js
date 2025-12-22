module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    // Désactiver les règles trop strictes pour le développement
    "@typescript-eslint/no-explicit-any": "warn", // Avertissement au lieu d'erreur
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_", // Ignorer les paramètres préfixés par _
      "varsIgnorePattern": "^_"
    }],
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["warn", { "code": 120 }],
    "object-curly-spacing": ["error", "always"],
    "require-jsdoc": 0, // Désactiver l'obligation de JSDoc
    "valid-jsdoc": 0,
  },
};