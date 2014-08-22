/**
 * Install Veneer Cluster.
 *
 * @param settings
 * @returns {getStatus}
 */
function getStatus( settings ) {
  this.log( 'Stopping Veneer Proxy on [%s].', this.hostname, this.config );

  this.log( '==Not Implemented==' );

  // @chainable
  return this;

}

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = getStatus, {
  debug: {
    /**
     *
     * @method debug
     */
    value: require( 'debug' )( 'veneer-proxy:install' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});