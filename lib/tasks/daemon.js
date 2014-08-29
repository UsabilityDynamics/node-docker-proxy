/**
 * Start Docker Proxy
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

  // Catch exception.
  process.on('uncaughtException', module.uncaughtException );

  // Ignore SIGUSR
  process.on( 'SIGUSR1', noop );
  process.on( 'SIGUSR2', noop );

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

      dockerProxy.start( function serviceStarted( error, proxy )  {
        module.logger.info( 'Service initialized.' );
        next( error, proxy );
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
    data: [ 'service', function fetchData( next, report ) {
      module.logger.info( 'Fetching latest Docker containers. ');
      next();
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