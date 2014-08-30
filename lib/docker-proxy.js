/**
 * Docker Proxy Middleware
 *
 * - pass
 * - pipe
 * - deliver
 *
 * @todo Add formatting for Docker settings, e.g. to break-up DOCKER_HOST environment variable into DOCKER_PORT and DOCKER_HOSTNAME.
 * @todo Convert api and router middleware to use staticMiddleware format.
 *
 * @param handler
 * @returns {*}
 * @author potanin@UD
 * @constructor
 */
function dockerProxy( handler, serviceModule ) {

  // Force Proper Instance.
  if ( !( this instanceof dockerProxy ) ) {
    return dockerProxy.create( handler );
  }

  var self = this;
  var yaml = require( "js-yaml" );
  var findup = require( 'findup-sync' );
  var auto = require( 'async' ).auto;
  var joinPath = require( 'path' ).join;
  var DockerEvents = require( 'docker-events' );
  var Docker = require('dockerode');

  // Set Default Settings.
  this.settings.set({
    _id: require( './common/utility' ).randomString( 24 ).toLowerCase(),
    name: 'dockerProxy',
    version: require( '../package' ).version,
    server: {
      httpKeepAlive: true,
      maxSockets: true,
    },
    app: {
      'trust proxy': false,
      'x-powered-by': false
    },
    basePath: require( 'path' ).join( __dirname, '../static/etc'  ),
    configPath: process.env.DOCKER_PROXY_CONFIG_PATH || findup( 'docker-proxy.yaml' ) || require( 'path' ).join( __dirname, '../static/etc/docker-proxy.yaml' ),
    adapters: {
      memory: require( 'sails-memory' ),
      disk: require( 'sails-disk' )
    },
    collections: {
      server: require( './models/server' ),
      container: require( './models/container' ),
      backend: require( './models/backend' ),
      image: require( './models/image' )
    },
    connections: {
      disk: {
        adapter: 'disk',
        schema: true,
        filePath: '/tmp/docker-proxy' //joinPath( '../../../', '.tmp' )
      },
      memory: {
        adapter: 'memory',
        schema: true
      },
      persistent: {
        adapter: 'memory' // @temp
      }
    },
    modulePath: serviceModule ? serviceModule.id : undefined,
    docker: {
      host: process.env.DOCKER_HOST || 'localhost',
      sock: process.env.DOCKER_SOCK_PATH || '/var/lib/docker.sock',
      hostname: process.env.DOCKER_HOSTNAME || 'localhost',
      port: process.env.DOCKER_PORT || 2375,
    },
    options: {}
  })

  // Set YAML Configuration.
  this.settings.set({
    options: yaml.load( require( 'fs' ).readFileSync( this.settings.get( 'configPath' ) ) )
  });

  require( 'deep-extend' )( this.app.settings, this.settings.get( 'app' ) );

  // Invoke handler if its a function.
  if( 'function' === typeof handler ) {

    if( serviceModule ) {
      serviceModule.exports = self;
    }

    handler.call( this, null, this );

  }

  // Treat handler as settings if its an object.
  if( 'object' === typeof handler ) {
    this.settings.set( handler );
  }

  auto({
    orm:      [ this.startORM.bind( this ) ],
    models:   [ 'orm', function storeModels( next, state ) {

      self._models = state.orm.collections;
      self._connections = state.orm.collections;

      next();

    }],
    docker:   [ 'orm', function startDocker( next, state ) {
      // console.log( 'startDocker', self.settings.get( 'docker' ) );

      if( !self.settings.get( 'docker' ) ) {
        return next( new Error( 'Missing Docker Daemon path or URL.' ) );
      }

      state.docker = new Docker({
        host: self.settings.get( 'docker.hostname' ),
        port: self.settings.get( 'docker.port' ),
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
        self.app.emit( 'docker:connect', null );
      });

      _watcher.on( "disconnect", function() {
        self.app.emit( 'docker:disconnect', null );
        setTimeout( function reconnectDocker() { _watcher.start() }, 1000 );
      });

      _watcher.on( "_message", function dockerMessage( message ) {

        if( message.status === 'start' ) {

          self.app.emit( 'docker:container:start', null, {
            id: message.id,
            type: 'container',
            image: message.from,
            time: message.time
          });

        }

        if( message.status === 'stop' ) {

          self.app.emit( 'docker:container:stop', null, {
            id: message.id,
            type: 'container',
            image: message.from,
            time: message.time
          });

        }

        self.app.emit( 'docker:message', null, {
          id: message.id,
          event: message.status,
          time: message.time
        });

      });

    }],
    service:  [ 'docker', 'models', function serviceBoot( next, state ) {
      // console.log( 'serviceBoot' );
      self.app.emit( 'service:ready', null, self, state )
    }]
  });

  // @return express instance to make mountable
  return this.app.once( 'mount', this.onMount.bind( this ) );

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  _models: {
    value: {},
    configurable: true,
    enumerable: true,
    writable: true
  },
  _connections: {
    value: null,
    configurable: true,
    enumerable: true,
    writable: true
  },
  _servers: {
    value: [],
    configurable: true,
    enumerable: true,
    writable: true
  },
  _workers: {
    value: {},
    configurable: true,
    enumerable: true,
    writable: true
  },
  _middleware: {
    value: {
      api: require( './middleware/api' ),
      router: require( './middleware/router' ),
      status: require( './middleware/status' ),
      static: require( './middleware/static' )
    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  staticMiddleware: {
    value: require( './middleware/static' ),
    configurable: true,
    enumerable: true,
    writable: true
  },
  routerMiddleware: {
    value: require( './middleware/router' ),
    configurable: true,
    enumerable: true,
    writable: true
  },
  apiMiddleware: {
    value: require( './middleware/api' ),
    configurable: true,
    enumerable: true,
    writable: true
  },
  startORM: {
    value: function startORM( next, report ) {
      // console.log( 'startORM' );

      var Waterline = require( 'waterline' );

      new Waterline().initialize({
        collections:  this.settings.get( 'collections' ),
        adapters:     this.settings.get( 'adapters' ),
        connections:  this.settings.get( 'connections' ),
      }, next );

      return this;

    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  app: {
    /**
     * Middleware Handler.
     *
     * @param app
     * @constructor
     */
    value: require( 'express' )(),
    enumerable: true,
    configurable: true,
    writable: true
  },
  auto: {
    /**
     * Middleware Handler.
     *
     * @param app
     * @constructor
     */
    value: require( 'async' ).auto,
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    /**
     * Upstream Middleware.
     *
     * @param options
     * @constructor
     */
    value: require( 'debug' )( 'docker:proxy' ),
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
  forkService: {
    value: function forkService( serviceName ) {
      this.debug( 'forkService', serviceName );

      var child_process   = require( 'child_process' );
      var joinPath        = require( 'path' ).join;
      var self = this;

      var _child = child_process.fork( joinPath( __dirname, serviceName ), process.args, {
        cwd: process.cwd(),
        env: process.env,
        silent: false
      });

      _child.on( 'listening', function( message ) {
        console.log( 'spawn', serviceName, ':listening' );
      });

      _child.on( 'exit', function( message ) {
        console.log( 'spawn', serviceName, ':exit' );
      });

      _child.on( 'start', function( message ) {
        console.log( 'spawn', serviceName, ':start' );
      });

      _child.on( 'message', function( message ) {
        console.log( process.pid, 'Daemon has message', message.cmd )

        if( message.cmd === 'stopService' ) {

          if( !service._workers[ message.service ] ) {
            console.log( 'Unable to stop service %s, it does not exist.', message.service )
            return;
          }

          service._workers[ message.service ].send({
            cmd: 'shutdown'
          });

        }

        if( message.cmd === 'resizeService' ) {

          if( !service._workers[ message.service ] ) {
            console.log( 'Unable to resize service %s, it does not exist.', message.service )
            return;
          }

          console.log( 'resizeService', message );

          service._workers[ message.service ].send( message )

        }

        if( message.cmd ==='startService' ) {

          if( service._workers[ message.service ] ) {
            console.log( 'Refusing to spawn %s, it is already active with PID %d.', message.service, service._workers[ message.service ].pid )
            return;
          }

          function spawnService() {
            console.log( 'single:spawnService' );

            service._workers[ message.service ] = child_process.fork( joinPath( __dirname, "../services/", message.service ), process.args, {
              cwd: process.cwd(),
              env: process.env,
              silent: false
            });;

            console.log( 'spawned %s with pid %d', message.service, service._workers[ message.service ].pid );

            service._workers[ message.service ].on( 'close', function() {
              //console.log( 'close:', message.service );
            });

            service._workers[ message.service ].on( 'exit', function( code, type ) {
              console.log( 'exit:', message.service );
              console.log( require( 'util').inspect( arguments, { colors: true , depth:5, showHidden: false } ) );

              // @note - the terminal "kill" command sends code 143 but not type.
              // @note - the terminal "kill -9" command sends code null and type SIGKILL.

              // Somebody really wants us to go away, no respawn.
              if( code === 0 || type === 'SIGINT' || type === 'SIGTERM' || type === 'SIGKILL' ) {
                return service._workers[ message.service ] = null;
              }

              // We should respawnn
              if( type === 'SIGHUP' || !type ) {
                spawnService();
                console.log( 'RESPAWNED %s with pid %d', message.service, service._workers[ message.service ].pid );
              }

            });

            service._workers[ message.service ].on( 'disconnect', function() {
              //console.log( 'disconnected:', message.service );
            });


          }

          spawnService();

        }

      });

      Object.defineProperty( self._workers, serviceName, {
        value: self._workers[ serviceName ] || {},
        enumerable: true,
        configurable: true,
        writable: true
      });

      return self._workers[ serviceName ][ _child.pid ] = _child;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  startService: {
    value: function startService( options ) {
      // console.log( 'startService', this.settings.get( 'modulePath' ) );

      options = options || {};

      // Ignore settings if name and options are passed.
      if( 'string' === typeof options || 'object' === typeof arguments[1] ) {
        return this.forkService( options, arguments[1] );
      }

      // Clustering is disabled...
      if( !this.settings.get( 'cluster' ) ) {
        return;
      }

      if( options && options.size === 1 ) {
        return;
      }

      //console.log( 'startService', this.settings.get( 'modulePath' ), 'for real' );

      var clusterMaster = require("./common/cluster")

      // Start Cluster.
      clusterMaster({
        exec: this.settings.get( 'modulePath', options.exec ),
        size: options.size || 2,
        env: process.env,
        args: process.argv,
        silent: options.silent || false,
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

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  startServer: {
    /**
     * Start Server.
     *
     * @note The server object also has "connection" and "clientError" events.
     *
     * @param options
     * @constructor
     */
    value: function startServer() {

      var self = this;
      var originalArguments = arguments;

      var _server = this.app.listen.apply( this.app, arguments );

      _server.app = self.app;

      _server.on( 'listening', function serverReady() {
        self.debug( 'startServer:serverReady' );
        self._servers.push( _server );
      });

      _server.on( 'error', function serverError( error ) {
        self.debug( 'startServer:serverReady [error.message: %s]', error.message );

        switch( error.errno ) {

          case 'ENOTFOUND':
            console.log( 'Could not bind server to the specified address/port combination.' );
          break;

          case 'EADDRINUSE':
            console.log( 'Address already in use, can not start servers.', originalArguments );
          break;

          default:
            console.log( 'Error!', error.message );
          break;

        }

      });

      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  settings: {
    /**
     *
     */
    value: require( 'object-settings' ).mixin( require( 'object-emitter' ).create({ delimiter: ':' }) ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  broker: {
    /**
     *
     */
    value: new ( require('eventemitter2') ).EventEmitter2({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  onMount: {
    /**
     * Triggered once dockerProxy is use()'d as middleware module.
     *
     * @param parent
     */
    value: function onMount( parent ) {
      this.debug( 'onMount' );

      // parent.settings;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  uncaughtException: {
    /**
     * Handles Uncaught Errors
     *
     * @param err
     */
    value: function uncaughtException(err) {

      if(err.errno === 'EADDRINUSE') {
        console.log( 'Address already in use, can not start servers.' );
      } else {
        console.log( 'Error!', err.message, err.stack );

        // re-fetch containers
        // vProxy.getDockerContainers();

      }

    }
  }
});

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = dockerProxy, {
  create: {
    /**
     * New Instance.
     *
     * @param handler
     * @returns {dockerProxy}
     */
    value: function create( handler, serviceModule ) {
      dockerProxy.prototype.debug( 'dockerProxy.create' );
      return new dockerProxy( handler, serviceModule );
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});