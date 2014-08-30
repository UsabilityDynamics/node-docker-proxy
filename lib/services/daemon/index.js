function startService() {
  console.log( 'Starting Docker Proxy daemon service..' );

  var dockerProxy     = require( '../../' );
  var fs              = require( 'fs');
  var noop            = require( 'node-noop' ).noop;

  // Catch exception.
  if( process.env.NODE_ENV === 'production' ) {
    process.on( 'uncaughtException', module.errorHandler );
    process.on( 'SIGUSR1', noop );
    process.on( 'SIGUSR2', noop );
  }

  this.spawn( 'api' );

}

Object.defineProperties( module.exports, {
  startService: {
    value: function startService() {
      return new startService();
    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  spawn: {
    value: function spawnService( service ) {

      var child_process   = require( 'child_process' );
      var joinPath        = require( 'path' ).join;

      var _child = child_process.fork( joinPath( __dirname, "../", service, "index.js" ), process.args, {
        cwd: process.cwd(),
        env: process.env,
        silent: false
      });

      _child.on( 'message', function( message ) {
        console.log( process.pid, 'Daemon has message', message.cmd )

        if( message.cmd === 'stopService' ) {

          if( !module._workers[ message.service ] ) {
            console.log( 'Unable to stop service %s, it does not exist.', message.service )
            return;
          }

          module._workers[ message.service ].send({
            cmd: 'shutdown'
          });

        }

        if( message.cmd === 'resizeService' ) {

          if( !module._workers[ message.service ] ) {
            console.log( 'Unable to resize service %s, it does not exist.', message.service )
            return;
          }

          console.log( 'resizeService', message );

          module._workers[ message.service ].send( message )

        }

        if( message.cmd ==='startService' ) {

          if( module._workers[ message.service ] ) {
            console.log( 'Refusing to spawn %s, it is already active with PID %d.', message.service, module._workers[ message.service ].pid )
            return;
          }

          function spawnService() {

            module._workers[ message.service ] = child_process.fork( joinPath( __dirname, "../services/", message.service ), process.args, {
              cwd: process.cwd(),
              env: process.env,
              silent: false
            });;

            console.log( 'spawned %s with pid %d', message.service, module._workers[ message.service ].pid );

            module._workers[ message.service ].on( 'close', function() {
              //console.log( 'close:', message.service );
            });

            module._workers[ message.service ].on( 'exit', function( code, type ) {
              console.log( 'exit:', message.service );
              console.log( require( 'util').inspect( arguments, { colors: true , depth:5, showHidden: false } ) );

              // @note - the terminal "kill" command sends code 143 but not type.
              // @note - the terminal "kill -9" command sends code null and type SIGKILL.

              // Somebody really wants us to go away, no respawn.
              if( code === 0 || type === 'SIGINT' || type === 'SIGTERM' || type === 'SIGKILL' ) {
                return module._workers[ message.service ] = null;
              }

              // We should respawnn
              if( type === 'SIGHUP' || !type ) {
                spawnService();
                console.log( 'RESPAWNED %s with pid %d', message.service, module._workers[ message.service ].pid );
              }

            });

            module._workers[ message.service ].on( 'disconnect', function() {
              //console.log( 'disconnected:', message.service );
            });


          }

          spawnService();

        }

      });

      return module._workers.api[ _child.pid ] = _child;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
});

Object.defineProperties( module, {
  _workers: {
    value: {},
    enumerable: true,
    configurable: true,
    writable: true
  },
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