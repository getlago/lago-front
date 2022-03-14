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
      },
      symlinks: false,
    },
    plugins: [
      new webpack.ProvidePlugin({
        React: 'react',
      }),
      new webpack.DefinePlugin({
        IS_PROD_ENV: APP_ENV === 'production',
        APP_ENV: JSON.stringify(APP_ENV),
        API_URL: JSON.stringify(process.env.API_URL),
        APP_VERSION: JSON.stringify(process.env.APP_VERSION),
      }),
    ],
  }
}
