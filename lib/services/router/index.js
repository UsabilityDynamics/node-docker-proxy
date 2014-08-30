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
function startService( options ) {
  console.log( 'Starting Router service..' );

  var utility         = require('../../common/utility');
  var watchr          = require( 'watchr');
  var fs              = require( 'fs');
  var extend          = require( 'deep-extend');
  var yaml            = require( 'js-yaml' );
  var auto            = require( 'async' ).auto;
  var noop            = require( 'node-noop' ).noop;
  var winston         = require( 'winston' );
  var child_process   = require( 'child_process' );
  var clusterMaster   = require("../../common/cluster")

  // Start Cluster.
  clusterMaster({
    exec: __dirname + "/worker.js",
    size: 2,
    env: process.env,
    args: process.argv,
    silent: false,
    repl: false,
    signals: true
  })

  // Messages from Daemon Master
  process.on( 'message', function processMessage(m, server) {
    // console.log( require( 'util').inspect( m, { colors: true , depth:5, showHidden: false } ) );

    if( m.cmd ) {

      // graceful shutdown
      if( m.cmd === 'shutdown' ) {
        clusterMaster.quit()
      }

      if( m.cmd === 'resizeService' ) {
        console.log( 'LB:resizeService' );

        clusterMaster.resize( m.size || 1, function() {
          console.log( 'resize cb', arguments );
        });

      }

      if( m.cmd === 'restart' ) {
        clusterMaster.restart()
      }

      if( m.cmd === 'die' ) {
        clusterMaster.quitHard()
      }

    }

  });

}

Object.defineProperties( module.exports, {
  startService: {
    value: function( options ) {
      return new startService( options )
    },
    enumerable: false,
    configurable: false,
    writable: true
  },
  _workers: {
    value: {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  _events: {
    value: process._events,
    enumerable: true,
    configurable: true,
    writable: true
  }
});

Object.defineProperties( module, {
  uncaughtException: {
    value: function errorHandler( error ) {
      module.log.error( error );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:daemon' ),
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