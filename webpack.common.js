require('dotenv').config()
const path = require('path')

const webpack = require('webpack')

const { version } = require('./package.json')

const APP_ENV = process.env.APP_ENV ?? 'development'

module.exports = () => {
  return {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[chunkhash].js',
    },
    resolve: {
      extensions: ['*', '.ts', '.tsx', '.js'],
      alias: {
        '~': path.resolve(__dirname, 'src'),
        '@mui/styled-engine': path.resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
      },
      symlinks: false,
    },
    plugins: [
      new webpack.ProvidePlugin({
        React: 'react',
      }),
      new webpack.DefinePlugin({
        APP_ENV: JSON.stringify(APP_ENV),
        API_URL: JSON.stringify(process.env.API_URL),
        DOMAIN: JSON.stringify(process.env.LAGO_DOMAIN),
        APP_VERSION: JSON.stringify(version),
        LAGO_OAUTH_PROXY_URL: JSON.stringify(process.env.LAGO_OAUTH_PROXY_URL),
        LAGO_DISABLE_SIGNUP: JSON.stringify(process.env.LAGO_DISABLE_SIGNUP),
        NANGO_PUBLIC_KEY: JSON.stringify(process.env.NANGO_PUBLIC_KEY),
        SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN),
      }),
    ],
    experiments: {
      asyncWebAssembly: true,
    },
  }
}
