/**
 * Middleware Handler.
 *
 * Initialized in-context of dockerProxy so has access to this.debug(), this.settings(), etc.
 *
 * @param app
 * @constructor
 */
function apiMiddleware( options ) {

  // options = options || {};

  var service = this;
  var app = require('express' ).call()

  app.use( '/containers', function( req, res, next ) {

    service._models.container.find(function haveContainers( error, containers ) {

      res.send({
        ok: error ? false : true,
        message: error ? error.message : require( 'util' ).format( 'Found %d containers.', containers.length ),
        data: containers || []
      });

    });

  });

  app.use( '/backends', function( req, res, next ) {

    service._models.backend.find(function haveData( error, data ) {

      res.send({
        ok: error ? false : true,
        message: error ? error.message : require( 'util' ).format( 'Found %d backends.', data.length ),
        data: data || []
      });

    });

  });

  app.use( '/servers', function( req, res, next ) {

    service._models.server.find(function haveData( error, data ) {

      res.send({
        ok: error ? false : true,
        message: error ? error.message : require( 'util' ).format( 'Found %d servers.', data.length ),
        data: data || []
      });

    });

  });

  app.use( '/', function( req, res, next ) {

    res.status( 404 );

    res.send({
      ok: false,
      message: 'Nothing here...'
    });

  })

  app.once( 'mount', function mounted() {
    service.debug( 'apiMiddleware mounted.' );
  });

  return app;

}

Object.defineProperties( module, {
  exports: {
    value: apiMiddleware,
    enumerable: true,
    configurable: false,
    writable: true
  },
  debug: {
    /**
     *
     */
    value: require( 'debug' )( 'docker:proxy:apiMiddleware' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  version: {
    value: 1,
    enumerable: true,
    configurable: false,
    writable: true
  }
});