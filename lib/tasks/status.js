/**
 * Get Veneer Proxy Cluster Status.
 *
 * - Removes orphan PID files.
 *
 * @param settings
 * @returns {serviceStatus}
 */
function serviceStatus( settings ) {
  // this.log( 'Getting Veneer Proxy status.' );

  var service   = this;
  var veneer    = require( 'veneer' );

  veneer.serviceStatus( { service: 'veneer-proxy' }, serviceStatus.taskResult.bind( this ) );

}

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = serviceStatus, {
  taskResult: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @returns {*}
     */
    value: function taskResult( error, report ) {
      // report.service.log( 'vProxy status report ready.' );

      if( error ) {
        return this.log( error.message );
      }

      if( report.table.length ) {
        console.log( report.table.toString() );
      }

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    /**
     *
     * @method debug
     */
    value: require( 'debug' )( 'veneer-proxy:status' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});