Object.defineProperties( module.exports, {
  watchSettingChanges: {
    /**
     *
     * @param error
     * @param state
     * @returns {*}
     */
    value: function watchSettingChanges( state ) {
      // service.log.info( 'Starting Docker Proxy...' )

      var existsSync = require( 'fs' ).existsSync;
      var watchr = require( 'watchr');

      if( existsSync( this.settings.get( 'configPath' ) ) ) {
        watchr.watch({
          path: this.settings.get( 'configPath' ) ,
          listener: function ( type, path, detail ) {
            console.log( 'Configuration file %s has changed.',  this.settings.get( 'configPath' ) );
          }
        });
      }

      return this;

    },
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
  forkService: {
    value: function forkService() {

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

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  serviceReady: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @param state
     * @returns {*}
     */
    value: function serviceReady( error, state ) {
      module.log.info( 'Docker Proxy started.' );

      state.service.app.on( 'docker:message', function( error, data ) {
        module.log.info( 'Docker Message:', data );
      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  startService: {
    /**
     * Task Completion Callback.
     *
     * @param error
     * @param state
     * @returns {*}
     */
    value: function serviceReady( error, state ) {
      module.log.info( 'Docker Proxy started.' );

      console.log( 'Broker Service' );

      process.on( 'message', function( data, server ) {

      })

      var app = require( 'express' ).call()

      app.use( '/service/:router/start', function( req, res ) {

        process.send({
          cmd: 'startService',
          service: req.param( 'router' ),
          scale: req.param( 'scale' )
        });

        res.send( 'spawned' );

      });

      app.use( '/service/:router/stop', function( req, res ) {

        process.send({
          cmd: 'stopService',
          service: req.param( 'router' )
        });

        res.send( 'stopping...' );

      });

      app.use( '/service/:router/resize', function( req, res ) {

        process.send({
          cmd: 'resizeService',
          service: req.param( 'router' ),
          size: req.param( 'size' ) || 5
        });

        res.send( 'resizing...' );

      });

      app.use( function( req, res ) {
        res.send({
          message:  'hello from API',
          startBalancer: 'http://localhost:16000/service/balancer/start',
          stopBalancer: 'http://localhost:16000/service/balancer/stop',
          startRouter: 'http://localhost:16000/service/router/stop',
        });
      });

      app.listen( process.env.DAEMON_PORT || 16000, process.env.DAEMON_HOST || 'localhost', function() {
        console.log( 'Daemon Service listening', this.address() );
      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  errorHandler: {
    value: function errorHandler( error ) {
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
    value: require( 'debug' )( 'docker:proxy:broker' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  findById: {
    /**
     * Find by _id Key
     *
     * @param collection
     * @param _id
     * @param cb
     */
    value: function findById(collection, _id, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {
        if( data._id === _id ) {
          cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  randomString: {
    value: require( 'utile' ).randomString,
    enumerable: true,
    configurable: true,
    writable: true
  }
});


getFirstPort = function(net) {
  return _.keys(net.Ports)[0].split('/')[0];
};

makeContainerAddress = function(net) {
  return 'http://' + net.IPAddress + ':' + getFirstPort(net);
};

parseProtoAddress = function(proto_address) {
  var address, proto;
  proto_address = proto_address.split('://');
  if (proto_address.length === 1) {
    proto = 'http';
    address = proto_address[0];
  } else {
    proto = proto_address[0];
    address = proto_address[1];
  }
  return [proto, address];
};

hostnameKey = function(hostname) {
  return hostname_key_prefix + hostname;
};

formatProtoAddress = function(proto, address) {
  if (address.match(/^:\d+$/)) {
    address = 'localhost' + address;
  }
  return proto + '://' + address;
};

padRight = function(s, n) {
  var s_;
  s_ = '' + s;
  while (s_.length < n) {
    s_ += ' ';
  }
  return s_;
};

getAllContainers = function(cb) {
  return docker.listContainers(function(err, containers) {
    return async.map(containers, function(container, _cb) {
      return docker.getContainer(container.Id).inspect(function(err, full_container) {
        container.Address = makeContainerAddress(full_container.NetworkSettings);
        container.ShortId = container.Id.slice(0, 12);
        address_containers[container.Address] = container;
        container_image_names[container.Id] = container.Image;
        return _cb(null, container);
      });
    }, cb);
  });
};




