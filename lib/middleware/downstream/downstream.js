function ProxyDownstream( options ) {
  // console.log( 'Starting ProxyDownstream' );

  var express = require( 'express' );
  var merge   = require( 'merge-descriptors' );
  var app     = express();

  merge( app, ProxyDownstream.prototype );

  if( 'function' === typeof options ) {
    options = { handler: options };
  }

  app.set( 'ProxyDownstream', options || {} );

  return app.once( 'mount', this.downstreamMounted );

}

Object.defineProperties( ProxyDownstream.prototype, {
  downstreamMounted: {
    value: function mounted( parent ) {
      parent.log( 'Downstream proxy mounted.' );

      // Mount Function if pased.
      if( 'function' === typeof this.get( 'ProxyDownstream' ).handler ) {
        this.use( this.get( 'ProxyDownstream' ).handler );
      }

    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});

Object.defineProperties( module.exports = ProxyDownstream, {
  debug: {
    value: require( 'debug' )( 'docker-proxy:downstream' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  create: {
    value: function create( options ) {
      return new module.exports( options )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});