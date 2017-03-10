module.exports = function(config) {
  config.set({
    basePath: ''
  , frameworks: ['mocha']
  , files: [
      'test/**/*.test.js'
    ]
  , exclude: []
  , preprocessors: {
      'test/**/*.test.js': ['webpack']
    }
  , reporters: ['mocha']
  , port: 9876
  , colors: true
  , logLevel: config.LOG_INFO
  , autoWatch: true
  , browsers: ['Chrome']
  , singleRun: true
  , concurrency: Infinity
  })
}
