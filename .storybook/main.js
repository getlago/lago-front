require('dotenv').config()
const path = require('path')
const webpack = require('webpack')

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-react-router-v6',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': path.resolve(__dirname, '../src'),
    }

    const fileLoaderRule = config.module.rules.find((rule) => rule.test && rule.test.test('.svg'))
    fileLoaderRule.exclude = /\.svg$/
    config.module.rules.push(
      {
        test: /\.svg$/,
        enforce: 'pre',
        loader: require.resolve('@svgr/webpack'),
        options: {
          svgoConfig: {
            pluggins: [{ prefixIds: false, prefixClassNames: false }],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    )

    config.plugins.push(
      new webpack.DefinePlugin({
        APP_ENV: JSON.stringify('production'),
        API_URL: JSON.stringify(process.env.API_URL),
        LAGO_DISABLE_SIGNUP: process.env.LAGO_DISABLE_SIGNUP,
        LAGO_OAUTH_PROXY_URL: JSON.stringify(process.env.LAGO_OAUTH_PROXY_URL),
        APP_VERSION: JSON.stringify('0.0'),
      })
    )

    return config
  },
}
