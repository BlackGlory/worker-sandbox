module.exports = function(config) {
  config.set({
    frameworks: ['mocha']
  , files: [
      'test/**/*.test.js'
    ]
  , preprocessors: {
      'test/**/*.test.js': ['webpack', 'sourcemap']
    }
  , webpack: require('./webpack.dev')
  , reporters: ['mocha']
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
