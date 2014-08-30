/**
 * Start Docker Proxy
 *
 * node bin/docker-proxy.js start
 *
 * sudo DEBUG=docker.proxy DOCKER_HOSTNAME=208.52.164.213 DOCKER_PORT=16423 supervisor -w ./ -- bin/docker-proxy.js start -p 80
 *
 * @todo It may be better to wait (and verify) for Docker Daemon connection to be stablished before starting.
 *
 * @param settings
 * @param settings.port
 * @param settings.host
 * @param settings.limit
 */
require( '../../docker-proxy' ).create( function serviceHandler( error, service ) {
  this.debug( 'serviceHandler' );

  var self      = service;
  var yaml      = require( 'js-yaml' );
  var auto      = require( 'async' ).auto;
  var winston   = require( 'winston' );

  Object.defineProperties( module, {
    debug: {
      value: require( 'debug' )( 'docker:proxy:api' ),
      enumerable: true,
      configurable: true,
      writable: true
    },
    exports: {
      value: this,
      enumerable: true,
      configurable: true,
      writable: true
    },
    log: {
      value: new (require( 'winston' ).Logger)({
        transports: [
          new (require( 'winston' ).transports.Console)({
            level: 'info',
            colorize: true
          })
        ],
        levels: {
          info: 0,
          event: 0,
          error: 10,
        },
        colors: {
          info: 'blue',
          event: 'green',
          error: 'red'
        }
      }),
      enumerable: true,
      configurable: true,
      writable: true
    }
  });

  auto({
    state: [ function appState( next, state ) {
      // module.log.info( 'Starting Docker Proxy...' )

      service.app.once( 'service:ready', next );

    }],
    settings: [ function loadSettings( next, state ) {
      // module.log.info( 'Starting Docker Proxy...' )
      var existsSync = require( 'fs' ).existsSync;
      var watchr = require( 'watchr');

      if( existsSync( service.settings.get( 'configPath' ) ) ) {
        watchr.watch({
          path: service.settings.get( 'configPath' ) ,
          listener: function ( type, path, detail ) {
            console.log( 'Configuration file %s has changed.',  service.settings.get( 'configPath' ) );
          }
        });
      }

      service.app.once( 'service:ready', next );

    }],
    server: [ 'state', 'settings', function startServer( next, state ) {
      console.log( 'startServer' )

      service.startServer( 16000, null, function serverReady() {
        module.log.info( 'Primary Docker Proxy web server started on %s:%s.', this.address().address, this.address().port );

        this.app.use( function( req, res ){
          res.send( 'hola!' );
        });

        this.app.use( service.apiMiddleware({

        }));

        next( null, this );

      });

    }],
    axon: [ 'state', 'settings', function startBroker( next, state ) {
      console.log( 'startBroker' )

      next( null );

    }],
    data: [ 'state', function loadContainers( next, state ) {
      console.log( 'loadContainers' )

      var _containers = process.env.NODE_ENV === 'development' ? require( '../../../test/unit/fixtures/containers' ) : [];

      service.app.once( 'docker:connect', function() {
        module.log.info( 'Docker Daemon connection established, fetching Containers.' );

        service._models.container.createEach( _containers, function( error, containers ) {
          next( error, containers );
        });

      });

    }],
    docker:[ 'state', function startDocker( next, state ) {
      console.log( 'todo', 'start Docker Watch consumer' );

      var DockerEvents = require( 'docker-events' );
      var Docker = require('dockerode');

      if( !service.settings.get( 'docker' ) ) {
        return next( new Error( 'Missing Docker Daemon path or URL.' ) );
      }

      state.docker = new Docker({
        host: service.settings.get( 'docker.hostname' ),
        port: service.settings.get( 'docker.port' ),
      });

      var _watcher = state.docker._watcher = new DockerEvents({
        docker: state.docker
      });

      _watcher.start();

      // Should restart every few minutes since there is no event on losing server connectivity.
      setInterval( function recycleDocker() {
        _watcher.stop();
      }, 60000 );

      // Exit Startup Process
      _watcher.once( "connect", function() {
        next( null, state.docker );
      });

      _watcher.on( "connect", function() {
        service.app.emit( 'docker:connect', null );
      });

      _watcher.on( "disconnect", function() {
        service.app.emit( 'docker:disconnect', null );
        setTimeout( function reconnectDocker() { _watcher.start() }, 1000 );
      });

      _watcher.on( "_message", function dockerMessage( message ) {

        if( message.status === 'start' ) {

          service.app.emit( 'docker:container:start', null, {
            id: message.id,
            type: 'container',
            image: message.from,
            time: message.time
          });

        }

        if( message.status === 'stop' ) {

          service.app.emit( 'docker:container:stop', null, {
            id: message.id,
            type: 'container',
            image: message.from,
            time: message.time
          });

        }

        service.app.emit( 'docker:message', null, {
          id: message.id,
          event: message.status,
          time: message.time
        });

      });

    }]
  });

});
