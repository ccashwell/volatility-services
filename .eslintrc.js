module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  ignorePatterns: ["test/*"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    tsconfigRootDir: __dirname,
    createDefaultProgram: true
  },
  extends: [
    "eslint:recommended",
    "eslint-config-prettier",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:promise/recommended",
    "plugin:security/recommended",
    "prettier"
  ],
  plugins: ["prettier", "import", "@typescript-eslint", "promise", "security"],
  rules: {
    // "semi": "off",
    // "@typescript-eslint/semi": ["error", "never"],
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/ban-types": "error",
    "@typescript-eslint/class-name-casing": "off",
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/consistent-type-definitions": "warn",
    "@typescript-eslint/explicit-member-accessibility": [
      "off",
      {
        accessibility: "explicit"
      }
    ],
    "@typescript-eslint/indent": [
      "off",
      4,
      {
        FunctionDeclaration: {
          parameters: "first"
        },
        FunctionExpression: {
          parameters: "first"
        }
      }
    ],
    "@typescript-eslint/interface-name-prefix": "off",
    // "@typescript-eslint/member-delimiter-style": [
    // 	"error",
    // 	{
    // 		multiline: {
    // 			delimiter: "none",
    // 			requireLast: true,
    // 		},
    // 		singleline: {
    // 			delimiter: "semi",
    // 			requireLast: false,
    // 		},
    // 		multilineDetection: "brackets"
    // 	},
    // ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-namespace-keyword": "off",
    "@typescript-eslint/quotes": [
      "error",
      "double"
      // {
      //   avoidEscape: false
      // }
    ],
    "@typescript-eslint/triple-slash-reference": "error",
    //	"@typescript-eslint/type-annotation-spacing": "error",
    "@typescript-eslint/unified-signatures": "error",
    "@typescript-eslint/no-shadow": ["error"],
    // "arrow-body-style": "error",
    // "arrow-parens": ["error", "as-needed"],
    camelcase: "error",
    // "capitalized-comments": "error",
    // "comma-dangle": ["error", "always-multiline"],
    complexity: "off",
    "constructor-super": "error",
    curly: "error",
    "dot-notation": "error",
    //"eol-last": "error",
    eqeqeq: ["error", "smart"],
    "promise/no-return-wrap": ["error", { allowReject: true }],
    "guard-for-in": "error",
    "id-blacklist": [
      "error",
      "any",
      "Number",
      "number",
      "String",
      "string",
      "Boolean",
      "boolean",
      "Undefined",
      "undefined"
    ],
    "id-match": "error",
    "import/order": [
      'builtin', // Built-in types are first
      ['sibling', 'parent'], // Then sibling and parent types. They can be mingled together
      'index', // Then the index file
      'object',
      // Then the rest: internal and external type
    ],
    // "import/order": [
    //   "error",
    //   {
    //     pathGroups: [
    //       {
    //         pattern: "@*/**",
    //         group: "external",
    //         position: "after"
    //       }
    //     ],
    //     pathGroupsExcludedImportTypes: ["builtin"]
    //   }
    // ],
    "max-classes-per-file": ["error", 1],
    "max-len": [
      "error",
      {
        ignoreUrls: true,
        code: 160
      }
    ],
    //"new-parens": "error",
    "no-bitwise": "error",
    "no-caller": "error",
    "no-cond-assign": "error",
    "no-console": "off",
    "no-debugger": "error",
    "no-empty": "error",
    "no-eval": "error",
    "no-fallthrough": "off",
    "no-invalid-this": "off",
    // "no-multiple-empty-lines": "error",
    "no-new-wrappers": "error",
    "no-shadow": "off",
    "no-throw-literal": "error",
    // "no-trailing-spaces": "error",
    "no-undef-init": "error",
    // "no-underscore-dangle": "error",
    "no-unsafe-finally": "error",
    "no-unused-expressions": "error",
    "no-unused-labels": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "one-var": ["error", "never"],
    // "prefer-arrow/prefer-arrow-functions": "error",
    "prefer-const": "error",
    // "quote-props": ["error", "consistent-as-needed"],
    radix: "error",
    "sort-imports": ["error", {"allowSeparatedGroups": true}]
    // "space-before-function-paren": [
    // 	"error",
    // 	{
    // 		Anonymous: "never",
    // 		AsyncArrow: "always",
    // 		Named: "never",
    // 	},
    // ],
    "spaced-comment": "off",
    "use-isnan": "error",
    "valid-typeof": "off"
  },
  settings: {
    "import/resolver": {
      node: {
        paths: ["node_modules/", "node_modules/@types"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        moduleDirectory: ["node_modules", "src/", "test/"],
        resolvePaths: ["node_modules/@types"],
        tryExtensions: [".js", ".json", ".node", ".ts", ".d.ts"]
      },
      typescript: {
        alwaysTryTypes: true // Always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
      }
    },
    "import/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] }
  }
}
