module.exports = [
  {
    ignores: ['apps/web/dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        MutationObserver: 'readonly',
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
