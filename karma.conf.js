module.exports = function(config) {
  config.set({
    basePath: ''
  , frameworks: ['mocha']
  , files: [
      'test/**/*.test.js'
    ]
  , exclude: []
  , preprocessors: {
      'test/**/*.test.js': ['webpack', 'sourcemap']
    }
  , webpack: require('./webpack.config')
  , reporters: ['mocha', 'coverage']
  , port: 9876
  , colors: true
  , logLevel: config.LOG_INFO
  , autoWatch: true
  , browsers: ['Chrome'/*, 'Firefox'*/]
  , singleRun: false
  , concurrency: Infinity
  , coverageReporter: {
      type: 'lcov'
    }
  })
}
