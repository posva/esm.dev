const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin')
  .default
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

module.exports = ({ mode = 'production', analyze = false } = {}) => {
  const productionOnlyPlugins = [
    new MiniCssExtractPlugin(),
    new HTMLInlineCSSWebpackPlugin(),
  ]

  if (analyze) productionOnlyPlugins.push(new BundleAnalyzerPlugin())

  const devOnlyPlugins = [new webpack.HotModuleReplacementPlugin()]

  const extraPlugins =
    mode === 'production' ? productionOnlyPlugins : devOnlyPlugins

  const devOnlyConfig = {
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './dist',
      hot: true,
    },
  }

  const productionOnlyConfig = {
    // could be removed in webpack 5 if they add a CSS minifier
    optimization: {
      minimizer: [
        // new UglifyJsPlugin({
        //   cache: true,
        //   parallel: true,
        //   sourceMap: true, // set to true if you want JS source maps
        // }),
        new TerserPlugin(),
        new OptimizeCSSAssetsPlugin({}),
      ],
    },
  }

  const extraConfig =
    mode === 'production' ? productionOnlyConfig : devOnlyConfig

  /** @type {import('webpack').Configuration} */
  const config = {
    entry: path.resolve(__dirname, './src/index.ts'),
    mode,
    resolve: {
      extensions: ['.js', '.ts'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
        },
        {
          test: /\.css$/,
          use: [
            mode === 'production'
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },

    ...extraConfig,

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
      }),
      ...extraPlugins,
    ],
  }

  return config
}
