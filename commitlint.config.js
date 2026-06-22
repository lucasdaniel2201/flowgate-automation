export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'docs',     // documentation only
        'style',    // formatting, missing semi colons, etc
        'refactor', // code change that neither fixes a bug nor adds a feature
        'perf',     // performance improvement
        'test',     // adding missing tests
        'chore',    // updating grunt tasks, etc
        'ci',       // CI related changes
        'build',    // build system or external dependencies
        'revert',   // reverts a previous commit
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
  },
};
