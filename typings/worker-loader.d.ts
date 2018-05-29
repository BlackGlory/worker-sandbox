declare module 'worker-loader?inline&name=worker.js!./worker' {
  class WebpackWorker extends Worker {
    constructor()
  }

  export = WebpackWorker
}