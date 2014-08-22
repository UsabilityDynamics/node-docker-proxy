function ProxyRoutes( req, res, next ) {

  var express = require( 'express' );
  var app     = express();

  Object.defineProperties( app, {
    something: {
      value: function Object() {},
      enumerable: true,
      configurable: true,
      writable: true
    }
  });

  app.once( 'mount', this.mounted );

  return app;

}

Object.defineProperties( ProxyRoutes.prototype, {
  mounted: {
    value: function mounted( parent ) {},
    enumerable: true,
    configurable: true,
    writable: true
  }
});

Object.defineProperties( module.exports = ProxyRoutes, {
  debug: {
    value: require( 'debug' )( 'docker-proxy:proxy-routes' ),
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