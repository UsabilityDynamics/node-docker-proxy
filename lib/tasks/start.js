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
function startServer( settings ) {

  var dockerProxy     = require( '../../' );
  var utility         = require('../../lib/common/utility');
  var watchr          = require( 'watchr');
  var fs              = require( 'fs');
  var extend          = require( 'deep-extend');
  var yaml            = require( 'js-yaml' );
  var auto            = require( 'async' ).auto;
  var noop            = require( 'node-noop' ).noop;
  var winston         = require( 'winston' );
  var cluster         = require( 'cluster' );
  var joinPath        = require( 'path' ).join;

  auto({
    settings: [ function loadSettings( next, state ) {
      // module.log.info( 'Starting Docker Proxy...' )

      return next( null, {});

      if( !fs.existsSync( path ) ) {
        return next()
      }

      module.set( yaml.load( fs.readFileSync( path ) ) );

      watchr.watch({
        path: path,
        listener: function( type, path, detail ) {

          // Blacnk Out Settings
          module.set( 'routes', null );

          // Write new Settings
          module.set( 'routes', yaml.load( fs.readFileSync( path )).routes );

          // also re-fetch available containers
          getDockerContainers();

          // @debug
          module.log.info( 'change', module.get( 'routes' ) );

        }
      });

      next();

    }],
    service: [ 'settings', function startService( next, state ) {
      module.log.info( 'Starting Docker Proxy core services.' );

      // Catch exception.
      if( process.env.NODE_ENV === 'production' ) {
        process.on('uncaughtException', module.uncaughtException );
        process.on( 'SIGUSR1', noop );
        process.on( 'SIGUSR2', noop );
      }

      dockerProxy.start( function serviceStarted( error, proxy )  {
        // module.log.info( 'Service initialized.' );

        proxy.app.once( 'service:ready', function() {
          next( error, proxy );
        });

        proxy.app.on( 'docker:disconnect', function() {
          // module.log.info( 'Docker Daemon connection lost.' );
        });


      });

    }],
    servers: [ 'service', function startServers( next, state ) {
      // module.log.info( 'Starting primary web server.' );

      if( cluster.isWorker ) {
        state.service.startServer( settings.port, settings.host, serverReady );
      }

      function serverReady() {
        // module.log.info( 'Primary Docker Proxy web server started on %s:%s.', this.address().address, this.address().port );
        next( null, this );
      }

    }],
    containers: [ 'service', function loadContainers( next, state ) {

      var _containers = process.env.NODE_ENV === 'development' ? require( '../../test/unit/fixtures/containers' ) : [];

      state.service.app.once( 'docker:connect', function() {
        module.log.info( 'Docker Daemon connection established, fetching Containers.' );

        state.service._models.container.createEach( _containers, function( error, containers ) {
          next( error, containers );
        });

      });

    }],
    cluster: [ 'service', 'containers', function startCluster( next, state ) {
      // module.log.info( 'Spawning workers. ');

      if( !cluster.isMaster ) {
        return next( null, null );
      }

      cluster.setupMaster({
        exec : joinPath( __dirname, "../../bin/docker-proxy.js" ),
        args : [ 'start' ],
        silent : settings.silent
      });

      // Fork workers.
      for (var i = 0; i < settings.limit; i++) {
        cluster.fork();
      }

      cluster.on('exit', function(worker, code, signal) {
        module.log.info('Proxy worker ' + worker.process.pid + ' died, respawning.' );
        cluster.fork();
      });

      cluster.on('fork', function(worker) {
        // module.log.info('Proxy worker ' + worker.process.pid + ' forked.' );
      });

      cluster.on('listening', function(worker, address) {
        module.log.info('Proxy worker %d is listening %s:%s.', worker.process.pid, address.address, address.port );
      });

      cluster.on('online', function(worker) {
        // module.log.info('Proxy worker ' + worker.process.pid + ' online.' );
      });

      return next( null, cluster );

    }]
  }, module.taskComplete );

}

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module, {
  exports: {
    value: startServer,
    enumerable: true,
    configurable: true,
    writable: true
  },
  taskComplete: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @param state
     * @returns {*}
     */
    value: function taskComplete( error, state ) {
      module.log.info( 'Docker Proxy started.' );

      state.service.app.on( 'docker:message', function( error, data ) {
        module.log.info( 'Docker Message:', data );
      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  uncaughtException: {
    value: function uncaughtException( error ) {
      module.log.error( error );
    },
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
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});