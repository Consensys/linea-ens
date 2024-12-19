module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'artifacts', 'cache', 'typechain-types'],
  parser: '@typescript-eslint/parser',
};
