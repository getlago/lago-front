require('dotenv').config()
const path = require('path')

const webpack = require('webpack')

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
        IS_PROD_ENV: APP_ENV === 'production',
        IS_DEV_ENV: APP_ENV === 'development',
        APP_ENV: JSON.stringify(APP_ENV),
        API_URL: JSON.stringify(process.env.API_URL),
        APP_VERSION: JSON.stringify(process.env.APP_VERSION), // TODO - not passed on the cloud
        LAGO_SIGNUP_DISABLED: process.env.LAGO_SIGNUP_DISABLED,
      }),
    ],
  }
}
