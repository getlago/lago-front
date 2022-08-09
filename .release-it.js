module.exports = {
  git: {
    commitMessage: 'v${version}',
    requireBranch: 'main',
    tagName: 'v${version}',
  },
  hooks: {
    'after:bump': 'yarn changelog:update --package',
  },
  npm: {
    publish: false,
  },
}
