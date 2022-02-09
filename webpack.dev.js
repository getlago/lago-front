const path = require("path");

const webpack = require("webpack");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const common = require("./webpack.common.js");

const DEVELOPMENT_MODE = "development";

module.exports = (env) =>
  merge(common(env, DEVELOPMENT_MODE), {
    mode: DEVELOPMENT_MODE,
    devtool: "cheap-module-source-map", // Maybe change to 'eval' if build is too slow
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          include: path.resolve(__dirname, "src"),
          use: ["babel-loader"],
        },
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          include: path.resolve(__dirname, "src"),
          options: {
            // disable type checker - we will use it in fork plugin
            transpileOnly: true,
          },
        },
        {
          test: /\.svg$/,
          include: path.resolve(__dirname, "src"),
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
          include: path.resolve(__dirname, "src"),
          use: {
            loader: "url-loader",
          },
        },
      ],
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new HtmlWebpackPlugin({
        title: "Lago - Local",
        template: path.join(__dirname, "src", "index.html"),
        favicon: "./src/public/images/favicon-local.svg",
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
      historyApiFallback: true,
      hot: "only",
      port: process.env.PORT || 8080,
      static: {
        directory: path.resolve(__dirname, "./dist"),
      },
      client: {
        overlay: true,
      },
      allowedHosts: ["app.lago.dev"],
    },
    optimization: {
      runtimeChunk: true,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
  });
