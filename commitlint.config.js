// Enforce our commit style: start with a gitmoji, then a concise subject.
// We intentionally do NOT use conventional-commit `type:` prefixes — our convention
// is "<gitmoji> <imperative subject>" (see rules/git-workflow.md).
export default {
  plugins: ['gitmoji'],
  rules: {
    'start-with-gitmoji': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'header-min-length': [2, 'always', 6],
  },
};
