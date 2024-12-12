import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import assert from 'assert';
import importPlugin from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import security from 'eslint-plugin-security';
import fs from 'fs';
import globals from 'globals';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const monorepoDir = path.dirname(__filename);

export default tseslint.config(
  includeIgnoreFile(getGitignorePath()),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: { ...globals.es2020, ...globals.node } },
  },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  security.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: monorepoDir,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    plugins: {
      perfectionist,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // the following import-x rules already checked by typescript eslint
      'import-x/default': 'off',
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-unresolved': 'off',
      'perfectionist/sort-imports': 'error',
    },
  },
  // testing-related
  {
    files: ['**/*.spec.{js,ts}', '**/*.test.{js,ts}'],
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...jest.configs['flat/style'].rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  stylistic.configs.customize({
    indent: 2,
    jsx: false,
    quotes: 'single',
    semi: true,
  }),
);

/**
 * Get either the project or monorepo gitignore file
 * @returns The path to the gitignore file
 */
function getGitignorePath() {
  if (monorepoDir !== process.cwd()) {
    const projectIgnore = path.join(process.cwd(), '.gitignore');
    // project gitignore
    if (fs.existsSync(projectIgnore)) return projectIgnore;
  }

  // monorepo gitignore
  const monorepoIgnore = path.join(monorepoDir, '.gitignore');
  assert(fs.existsSync(monorepoIgnore), 'Missing .gitignore file in monorepo');
  return monorepoIgnore;
}
