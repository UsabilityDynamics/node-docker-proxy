/**
 * Start Docker Proxy
 *
 *
 * node bin/docker-proxy.js start
 *
 * sudo DEBUG=docker.proxy DOCKER_HOSTNAME=208.52.164.213 DOCKER_PORT=16423 supervisor -w ./ -- bin/docker-proxy.js start -p 80
 *
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
    settings: [ function loadSettings( next, report ) {
      module.logger.info( 'Starting Docker Proxy...' )

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
          module.logger.info( 'change', module.get( 'routes' ) );

        }
      });

      next();

    }],
    service: [ 'settings', function startService( next, report ) {
      module.logger.info( 'Starting primary service.' );

      // Catch exception.
      if( process.env.NODE_ENV === 'production' ) {
        process.on('uncaughtException', module.uncaughtException );
        process.on( 'SIGUSR1', noop );
        process.on( 'SIGUSR2', noop );
      }

      dockerProxy.start( function serviceStarted( error, proxy )  {
        module.logger.info( 'Service initialized.' );

        proxy.app.once( 'service:ready', function() {
          next( error, proxy );
        });


      });

    }],
    servers: [ 'service', function startServers( next, report ) {
      module.logger.info( 'Starting servers.' );

      report.service.startServer( settings.port, settings.host, serverReady );

      function serverReady() {
        module.logger.info( 'Primary Docker Proxy server started on %s:%s.', this.address().address, this.address().port );
        next( null, this );
      }

    }],
    containers: [ 'service', function loadContainers( next, report ) {
      module.logger.info( 'Fetching latest Docker containers. ');

      report.service._models.container.createEach([
        {
          Name: 'site1.com',
          Hostname: 'site1.com',
          Backend: {
            secure: false,
            target: {
              host: '208.52.164.203',
              port: 49153
            }
          }
        },
        {
          Name: 'api.site7.com',
          Hostname: 'api.site7.com',
          Backend: {
            secure: false,
            ws: true,
            target: {
              host: '208.52.164.203',
              port: 49168
            }
          }
        },
        {
          Name: 'cdn.site2.com',
          Hostname: 'cdn.site2.com',
          Backend: {
            secure: false,
            target: {
              host: '208.52.164.203',
              port: 49160
            }
          }
        },
        {
          Name: 'site2.com',
          Hostname: 'site2.com',
          Backend: {
            secure: false,
            target: {
              host: '208.52.164.203',
              port: 49154
            }
          }
        }
      ], next );

    }],
    cluster: [ 'service', 'containers', function startCluster( next, report ) {
      module.logger.info( 'Spawning workers. ');

      if( !cluster.isMaster ) {
        return next( null, null );
      }

      cluster.setupMaster({
        exec : joinPath( __dirname, "../../bin/docker-proxy.js" ),
        args : [ "start" ],
        silent : true
      });

      // Fork workers.
      for (var i = 0; i < settings.limit; i++) {
        cluster.fork();
      }

      cluster.on('exit', function(worker, code, signal) {
        module.logger.info('Proxy worker ' + worker.process.pid + ' died.' );
      });

      cluster.on('fork', function(worker) {
        module.logger.info('Proxy worker ' + worker.process.pid + ' forked.' );
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
     * @param report
     * @returns {*}
     */
    value: function taskComplete( error, report ) {
      module.logger.info( 'Docker Proxy started.' );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  uncaughtException: {
    value: function uncaughtException( error ) {
      module.logger.info( error );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  logger: {
    value: new (require( 'winston' ).Logger)({
      transports: [
        new (require( 'winston' ).transports.Console)({ colorize: true })
      ],
      levels: {
        info: 0,
        error: 10,
      },
      colors: {
        info: 'blue',
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