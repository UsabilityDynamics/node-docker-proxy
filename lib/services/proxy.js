/**
 * Start Docker Proxy
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {
  service.debug( 'serviceHandler', 'Proxy' );

  service.once( 'ready', function onceReady( error ) {

    var Redbird     = require( 'redbird' );
    var Container   = service._models.container;
    var Backend     = service._models.backend;

    console.log( require( 'util').inspect( service.get( 'service.proxy' ), { colors: true , depth:0, showHidden: false } ) );

    var _options = {
      port: service.get( 'service.proxy.port' ),
      hostname: service.get( 'service.proxy.host' )
    }

    // Add SSL functionality if SSL directory exists.
    if( require( 'fs' ).existsSync( service.get( 'service.proxy.sslPath' ) + 'dev-key.pem' ) ) {
      _options.ssl = {
        port: service.get( 'service.proxy.sslPort' ),
        key: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-key.pem' ),
        csr: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-csr.pem' ),
        cert: require( 'path' ).join( service.get( 'service.proxy.sslPath' ), 'dev-cert.pem' )
      }
    }

    var proxy = new Redbird( _options ).once( 'ready', proxyReady );

    // proxy.once( 'ready', proxyReady );

    // ORM Callbacks.
    Container.on( 'destroy',  removeRoutes.bind( proxy ) );
    Container.on( 'insert',   registerRoutes.bind( proxy ) );

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
    console.log( process.pid, 'removeRoutes' );

    var proxy = this;

    Object.keys( container._backends || {} ).forEach( function( key ) {

      var _sources = reverseBackendQuery({
        hostname: container._backends[ key ].target.hostname || container._backends[ key ].target.address,
        port: container._backends[ key ].target.port
      });

      _sources.forEach( function( src ) {
        proxy.unregister( src );
      })

    });

    return this;

  }

  /**
   * Insert Route to Proxy
   *
   * @param container
   */
  function registerRoutes( error, container ) {
    service.debug( 'registerRoutes', container );
    service.debug( 'registerRoutes [pid:%s]', process.pid, error, container ? container.Id : null, container ? Object.keys( container._backends || {} ).length : 0 );

    var proxy = this;

    Object.keys( container && container._backends ? container._backends : {} ).forEach( function( key ) {

      try {

        var _backend = container._backends[ key ];

        // @temp Redbird doesn't support wildcards.
        key = key.replace( '*.', '' );

        service.log.info( 'proxy.register', key, _backend.target.target );

        proxy.register( key, _backend.target.target, _backend.options );

      } catch( error ) {
        console.error( error.message, container._backends[ key ] );
      }

    })

    return this;

  }

  /**
   * Server Listen Callback
   *
   * @param error
   * @param server
   */
  function proxyReady( error, server ) {
    service.log.info( 'Proxy web server started on http://%s:%s.', server.address().address, server.address().port );

    service.log.info( server.address().address + '/api', 'http://' + server.address().address + ':16000' );
    service.log.info( server.address().address, 'http://' + server.address().address + ':8090' );

    // Add internal routes.
    this.register( server.address().address + '/api', 'http://' + server.address().address + ':16000' );
    this.register( server.address().address, 'http://' + server.address().address + ':8090' );

    this.proxy.on( 'error', proxyError );
    this.proxy.on( 'proxyReq', proxyRequest );
    this.proxy.on( 'proxyRes', proxyResponse );

  }

  /**
   * Proxy Routing Error.
   *
   * @todo Add "socket hang up" error handling.
   *
   * @param error
   * @param req
   * @param res
   * @param data
   */
  function proxyError( error, req, res, data ) {

    res.end( JSON.stringify({
      ok: false,
      message: [ 'Backend is not reachable.' ],
      errors: [ error ],
      data: process.env.NODE_ENV === 'development' ? data : null
    }));

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
