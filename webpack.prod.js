const path = require("path");

const webpack = require("webpack");
const { merge } = require("webpack-merge");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const common = require("./webpack.common.js");

const PRODUCTION_MODE = "production";
const config = {
  mode: PRODUCTION_MODE,
  optimization: {
    splitChunks: {
      chunks: "all",
      maxSize: 500000,
      maxInitialRequests: 6,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    prefixIds: {
                      prefixIds: false,
                      prefixClassNames: false,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|jpeg)$/,
        exclude: /node_modules/,
        use: {
          loader: "url-loader",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: process.env.APP_ENV === "production" ? "Lago" : "Lago - Staging",
      template: path.join(__dirname, "src", "index.html"),
      favicon:
        process.env.APP_ENV === "production"
          ? "./src/public/images/favicon-prod.svg"
          : "./src/public/images/favicon-staging.svg",
    }),
    new webpack.SourceMapDevToolPlugin({
      noSources: false,
      filename: "[name].[chunkhash].js.map",
    }),
  ],
  resolve: {
    alias: {
      deepmerge: path.resolve(__dirname, "node_modules", "deepmerge"),
      "lodash-es": "lodash",
      lodash: path.resolve(__dirname, "node_modules", "lodash"),
      "react-is": path.resolve(__dirname, "node_modules", "react-is"),
      "symbol-observable": path.resolve(
        __dirname,
        "node_modules",
        "symbol-observable"
      ),
      tslib: path.resolve(__dirname, "node_modules", "tslib"),
    },
  },
};

module.exports = (env) => {
  if (env.analyseBundle) {
    config.plugins.push(new BundleAnalyzerPlugin());
    config.plugins.push(new DuplicatePackageCheckerPlugin());
  }

  return merge(common(env, PRODUCTION_MODE), config);
};
