module.exports = (api) => {
  // This caches the Babel config
  api.cache.using(() => process.env.NODE_ENV)
  return {
    presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      ['babel-plugin-styled-components', { displayName: true }],
      [
        'prismjs',
        {
          languages: ['javascript', 'bash'],
          plugins: ['line-numbers'],
          theme: 'default',
          css: true,
        },
      ],
      ...(api.env('development') && ['react-refresh/babel']),
    ].filter(Boolean),
  }
}
