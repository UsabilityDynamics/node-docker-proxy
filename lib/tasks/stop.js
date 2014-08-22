/**
 * Stop Docker Proxy Service.
 *
 *
 * @param settings
 */
function startService( settings ) {

}

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = startService, {
  taskComplete: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @param report
     * @returns {*}
     */
    value: function taskComplete( error, report ) {

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker-proxy:stop' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});