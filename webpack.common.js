const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  target: 'web'
, context: path.resolve(__dirname, './src')
, entry: {
    'sandbox': './sandbox.ts'
  }
, output: {
    path: path.resolve(__dirname, 'lib')
  , filename: '[name].js'
  , library: 'Sandbox'
  , libraryTarget: 'umd'
  }
, resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
, module: {
    rules: [
      {
        test: /\.tsx?$/
      , exclude: /node_modules/
      , use: 'ts-loader'
      }
    , {
        test: /\.jsx?$/
      , exclude: /node_modules/
      , use: 'babel-loader'
      }
    ]
  }
, plugins: [
    new CleanWebpackPlugin(['lib'])
  ]
}
