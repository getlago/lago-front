module.exports = () => {
  return {
    presets: ['@babel/preset-env', '@babel/preset-react'],
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
    ],
  }
}
