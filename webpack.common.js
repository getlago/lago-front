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
        APP_VERSION: JSON.stringify(version),
        LAGO_DISABLE_SIGNUP: process.env.LAGO_DISABLE_SIGNUP,
      }),
    ],
  }
}
