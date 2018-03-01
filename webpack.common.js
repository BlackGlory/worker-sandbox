const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  target: 'web'
, entry: {
    'sandbox': './src/sandbox.js'
  }
, output: {
    path: path.resolve(__dirname, 'lib')
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
    new CleanWebpackPlugin(['lib'])
  ]
}
