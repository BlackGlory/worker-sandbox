const path = require('path')
const webpack = require('webpack')

module.exports = {
  target: 'web'
, entry: {
    'sandbox': './src/sandbox.js'
  , 'sandbox.min': './src/sandbox.js'
  }
, devtool: 'inline-source-map'
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
      , exclude: [/node_modules/, path.resolve(__dirname, 'test')]
      , use: 'babel-loader'
      }
    ]
  }
, plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/
    , compress: {
        warnings: false
      }
    , comments: false
    , sourceMap: true
    })
  ]
}
