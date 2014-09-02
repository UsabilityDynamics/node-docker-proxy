/**
 * Start Docker Proxy
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {
  service.debug( 'serviceHandler', 'Proxy' );

  service.once( 'ready', function() {
    service.log.info( 'Docker Proxy Router fully loaed.' );

    var Redbird = require( 'redbird' );
    var Container = service._models.container;
    var Backend = service._models.backend;

    new Redbird({
      port: service.get( 'service.proxy.port' ),
      hostname: service.get( 'service.proxy.host' ),
      ssl: {
        port: service.get( 'service.proxy.sslPort' ),
        key: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-key.pem' ),
        csr: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-csr.pem' ),
        cert: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-cert.pem' )
      }
    }).once( 'ready', proxyReady );

    // ORM Callbacks.
    Container.on( 'destroy',  removeRoutes );
    Container.on( 'insert',   registerRoutes );

  });

  /**
   * Trverses through proxy.routing trying to find all routes that target a container/backend.
   *
   * @param query
   * @returns {Array}
   */
  function reverseBackendQuery( query ) {
    console.log( 'reverseBackendQuery', query );

    var _ = require( 'lodash' );

    var _query = {
      hostname: query.hostname || query.host || query.address, // "208.52.164.213",
      port: query.port // "49165"
    }

    var _matches = [];

    _.each( proxy.routing, function( backends, key ) {

      if( _.find( backends, _query ) ) {
        _matches.push( key );
      }

    });

    return _matches;

  }

  /**
   * After a backend is removed we must remove any routes to it.
   * 
   * @param container
   */
  function removeRoutes( error, container ) {
    console.log( 'removeRoutes' );

    console.log( require( 'util').inspect( proxy.routing, { colors: true , depth:5, showHidden: false } ) );

    Object.keys( container._backends || {} ).forEach( function( key ) {

      var _sources = reverseBackendQuery({
        hostname: container._backends[ key ].target.hostname || container._backends[ key ].target.address,
        port: container._backends[ key ].target.port
      });

      _sources.forEach( function( src ) {
        proxy.unregister( src );
      })

    })

    console.log( require( 'util').inspect( proxy.routing, { colors: true , depth:5, showHidden: false } ) );

    console.log( 'removeRoutes:after There are %d routes.', proxy.routing );

  }

  /**
   * Insert Route to Proxy
   *
   * @param container
   */
  function registerRoutes( container ) {
    service.debug( 'registerRoute', Object.keys( container._backends ) );

    Object.keys( container._backends || {} ).forEach( function( key ) {

      try {

        var _backend = container._backends[ key ];

        service.log.info( 'proxy.register', key, _backend.target.target );

        proxy.register( key, _backend.target.target, _backend.options );

      } catch( error ) {
        console.error( error.message, container._backends[ key ] );
      }

    })

  }

  /**
   * Server Listen Callback
   *
   * @param error
   * @param server
   */
  function proxyReady( error, server ) {
    service.log.info( 'Load balancer web server started on %s:%s.', server.address().address, server.address().port );

    // server.proxy.on( 'error', proxyError );
    // server.proxy.on( 'proxyReq', proxyRequest );
    // server.proxy.on( 'proxyRes', proxyResponse );

  }

  /**
   * Proxy Routing Error.
   *
   * @param error
   * @param req
   * @param res
   * @param data
   */
  function proxyError( error, req, res, data ) {

    res.send({
      ok: false,
      message: [ 'Backend is not reachable.' ],
      errors: [ error ],
      data: process.env.NODE_ENV === 'development' ? data : null
    });

  }

  /**
   * Proxy Routing Response.
   *
   * @param proxyRes
   * @param req
   * @param res
   */
  function proxyResponse(proxyRes, req, res) {
    // self.debug( 'proxyResponse [headers: %d]', Object.keys( res.headers ).length );
  }

  /**
   * Proxy Routing Request.
   *
   * @param proxyReq
   * @param req
   * @param res
   * @param options
   */
  function proxyRequest(proxyReq, req, res, options) {
    // self.debug( 'proxyRequest [headers: %d]', Object.keys( req.headers ).length );
  }

}, module );
