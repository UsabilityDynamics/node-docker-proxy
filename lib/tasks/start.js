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
  var child_process         = require( 'child_process' );
  var joinPath        = require( 'path' ).join;
  console.log( 'master!' );

  //var clusterMaster = require("cluster-master")

  function forkDaemon() {

    var daemonWorker = child_process.fork( joinPath( __dirname, "../services/daemon/index.js" ), process.args, {
      cwd: process.cwd(),
      env: process.env,
      silent: false
    });

    daemonWorker.on( 'message', function( message ) {
      console.log( process.pid, 'daemon wants something...', message.cmd )

      if( message.cmd === 'stopService' ) {

        if( !module._services[ message.service ] ) {
          console.log( 'Unable to stop service %s, it does not exist.', message.service )
          return;
        }

        module._services[ message.service ].send({
          cmd: 'shutdown'
        });

      }

      if( message.cmd === 'resizeService' ) {

        if( !module._services[ message.service ] ) {
          console.log( 'Unable to resize service %s, it does not exist.', message.service )
          return;
        }

        console.log( 'resizeService', message );

        module._services[ message.service ].send( message )

      }
      if( message.cmd ==='startService' ) {

        if( module._services[ message.service ] ) {
          console.log( 'Refusing to spawn %s, it is already active with PID %d.', message.service, module._services[ message.service ].pid )
          return;
        }

        function spawnService() {

          module._services[ message.service ] = child_process.fork( joinPath( __dirname, "../services/", message.service ), process.args, {
            cwd: process.cwd(),
            env: process.env,
            silent: false
          });;

          console.log( 'spawned %s with pid %d', message.service, module._services[ message.service ].pid );

          module._services[ message.service ].on( 'close', function() {
            //console.log( 'close:', message.service );
          });

          module._services[ message.service ].on( 'exit', function( code, type ) {
            console.log( 'exit:', message.service );
            console.log( require( 'util').inspect( arguments, { colors: true , depth:5, showHidden: false } ) );

            // @note - the terminal "kill" command sends code 143 but not type.
            // @note - the terminal "kill -9" command sends code null and type SIGKILL.

            // Somebody really wants us to go away, no respawn.
            if( code === 0 || type === 'SIGINT' || type === 'SIGTERM' || type === 'SIGKILL' ) {
              return module._services[ message.service ] = null;
            }

            // We should respawnn
            if( type === 'SIGHUP' || !type ) {
              spawnService();
              console.log( 'RESPAWNED %s with pid %d', message.service, module._services[ message.service ].pid );
            }

          });

          module._services[ message.service ].on( 'disconnect', function() {
            //console.log( 'disconnected:', message.service );
          });


        }

        spawnService();

      }

    });

    module._services.daemon = daemonWorker;

    return daemonWorker;

  }

  function forkRouter() {

    var daemonWorker = child_process.fork( joinPath( __dirname, "../services/router/index.js" ), process.args, {
      cwd: process.cwd(),
      env: process.env,
      silent: false
    });

    var app = require( 'express' ).call()

    app.use( function( req, res ) {
      res.send( 'hello' );
    });

    app.listen( 8010, null, function() {
      console.log( process.pid, 'server started', this.address() );

      daemonWorker.send({
        cmd: 'startServer',
        from: process.pid
      }, this );

    } );

    daemonWorker.on( 'message', function( message ) {
      console.log( process.pid, 'daemon wants something...' )
      //console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );

      if( message.cmd ==='spawn' ) {

        var daemonWorker = child_process.fork( joinPath( __dirname, "../services/", message.service ), process.args, {
          cwd: process.cwd(),
          env: process.env,
          silent: false
        });

      }

    });

    module._services.push( daemonWorker );

    return daemonWorker;

  }

  forkDaemon();
    //forkRouter();

  return;
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

      // Fork workers.
      for (var i = 0; i < settings.limit; i++) {
        cluster.fork();
      }

      cluster.on('exit', function(worker, code, signal) {
        module.log.info('Docker Proxy worker ' + worker.process.pid + ' died, respawning.' );
        cluster.fork();
      });

      cluster.on('fork', function(worker) {
        // module.log.info('Docker Proxy worker ' + worker.process.pid + ' forked.' );
      });

      cluster.on('listening', function(worker, address) {
        module.log.info('Docker Proxy worker %d is listening %s:%s.', worker.process.pid, address.address, address.port );
      });

      cluster.on('online', function(worker) {
        // module.log.info('Docker Proxy worker ' + worker.process.pid + ' online.' );
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
  _services: {
    value: {},
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