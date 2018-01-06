const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  target: 'web'
, entry: {
    'sandbox': './src/sandbox.js'
  , 'sandbox.min': './src/sandbox.js'
  }
, devtool: process.env.NODE_ENV === 'production' ? false : 'inline-source-map'
, output: {
    path: path.resolve(__dirname, 'dist')
  , filename: '[name].js'
  , library: 'Sandbox'
  , libraryTarget: 'umd'
  }
, module: {
    rules: [
      {
        test: /\.js$/
      , include: [path.resolve(__dirname, 'src')]
      , use: 'babel-loader'
      }
    ]
  }
, plugins: [
    new UglifyJsPlugin({
      include: /\.min\.js$/
    , sourceMap: true
    })
  ]
}
