const path = require('path')
const webpack = require('webpack')

module.exports = {
  target: 'web'
//, devtool: 'source-map'
, entry: {
    'sandbox': './src/sandbox.js'
  , 'sandbox.min': './src/sandbox.js'
  }
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
      , exclude: /node_modules/
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
    })
  ]
}
