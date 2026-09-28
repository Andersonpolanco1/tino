// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*'],
  },
  {
    rules: {
      // Falso positivo con i18next: `use` y `changeLanguage` son métodos de la instancia.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Las pruebas cargan módulos con require() dentro de jest.mock y jest.isolateModules.
    files: ['**/__tests__/**', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
