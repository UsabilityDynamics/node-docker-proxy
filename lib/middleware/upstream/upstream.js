function ProxyUpstream( options ) {
  // console.log( 'Starting ProxyUpstream' );

  var express = require( 'express' );
  var merge   = require( 'merge-descriptors' );
  var app     = express();

  merge( app, ProxyUpstream.prototype );

  if( 'function' === typeof options ) {
    options = { handler: options };
  }

  app.set( 'ProxyUpstream', options || {} );

  return app.once( 'mount', this.upstreamMounted );

}

Object.defineProperties( ProxyUpstream.prototype, {
  upstreamMounted: {
    value: function mounted( parent ) {
      parent.log( 'Upstream proxy mounted.' );

      // Mount Function if pased.
      if( 'function' === typeof this.get( 'ProxyUpstream' ).handler ) {
        this.use( this.get( 'ProxyUpstream' ).handler );
      }

    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});

Object.defineProperties( module.exports = ProxyUpstream, {
  debug: {
    value: require( 'debug' )( 'docker-proxy:upstream' ),
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