/**
 * Start Docker Proxy
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {
  service.debug( 'serviceHandler', 'Redbird' );

  service.set({
    name: 'redbird',
    cluster: true,
    docker: {
      host: process.env.DOCKER_HOSTNAME || 'localhost',
      port: process.env.DOCKER_PORT
    },
    redbird: {
      port: 8080,
      ssl: {
        port: 8443,
        key: require( 'path' ).join( __dirname, '../../static/etc/ssl/dev-key.pem' ),
        csr: require( 'path' ).join( __dirname, '../../static/etc/ssl/dev-csr.pem' ),
        cert: require( 'path' ).join( __dirname, '../../static/etc/ssl/dev-cert.pem' ),
      }
    }
  });

  var Container;
  var Backend;
  var docker;
  var proxy;

  service.once( 'ready', function () {
    service.log.info( 'Docker Proxy Router fully loaed.' );

    docker  = require( '../clients/docker' ).create( service.get( 'docker' ) ).on( '_message', handleMessage )
    proxy   = require( 'redbird' )( service.get( 'redbird' ), proxyListening );

    Container   = service._models.container;
    Backend     = service._models.backend;

  });

  /**
   *
   * We ignore the "create" event because we need the container to "start" to be routable.
   * We also ignore "die" because it is always followed by stop.
   *
   * @param error
   * @param message
   */
  function handleMessage( error, message ) {
    service.debug( 'handleMessage', message.status, message.id );

    if( [ 'start', 'restart' ].indexOf( message.status ) >= 0 ) {
      fetchContainer.call( docker, message.id );
    }

    if( [ 'stop', 'die' , 'destroy' ].indexOf( message.status ) >= 0 ) {
      Container.destroy( message.id, function( error, containers ) {
        service.debug( 'Destroyed %d containers.', containers.length )

        if( containers && containers.length ) {
          containers.forEach( removeOldRoutes );
        }

      });
    }

  }

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
  function removeOldRoutes( container ) {
    console.log( 'removeOldRoutes' );

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

    console.log( 'removeOldRoutes:after There are %d routes.', proxy.routing );

  }

  /**
   * Insert Route to Proxy
   *
   * @param container
   */
  function insertRoute( container ) {
    service.debug( 'insertRoute', Object.keys( container._backends ) );

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
   * Get Container Document, update Model
   *
   * @param id
   */
  function fetchContainer( id ) {
    // console.log( 'redbird', 'fetchContainer', id );

    this.getContainer(id).inspect(function( error, container ) {
      // console.log( 'redbird', 'inspecting container', error, container.Id );

      if( error || !container ) {
        console.log( 'Inspection failed, container is gone?', error )
        return;
      }

      Container.findOrCreate({ Id: container.Id }, container, function( error, container ) {
        service.debug( 'findOrCreate', error, container.Id );

        if( !error && container ) {
          return insertRoute( container );
        }

        return console.error( error );

      })

    })

  }

  /**
   * Server Listen Callback
   *
   * @param error
   * @param server
   */
  function proxyListening( error, server ) {
    service.log.info( 'Load balancer web server started on %s:%s.', server.address().address, server.address().port );
  }

}, module );
