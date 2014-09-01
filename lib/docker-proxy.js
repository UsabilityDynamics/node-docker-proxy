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

  if( module._instance ) {

    if( module._instance._state ) {
      module._instance.applyHandler( handler, serviceModule );
    }

    module._instance.emit( 'ready:again', null, module._instance, module._instance._state );
    module._instance.emit( 'ready', null, module._instance, module._instance._state );

    return module._instance;

  }

  // Force Proper Instance.
  if ( !( this instanceof dockerProxy ) ) {
    return dockerProxy.create( handler );
  }

  var self        = this;
  var yaml        = require( "js-yaml" );
  var findup      = require( 'findup-sync' );
  var joinPath    = require( 'path' ).join;
  var deepExtend  = require( 'deep-extend' );

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
      server: require( 'waterline' ).Collection.extend( require( './models/server' ) ),
      container: require( 'waterline' ).Collection.extend( require( './models/container' ) ),
      backend: require( 'waterline' ).Collection.extend( require( './models/backend' ) ),
      image: require( 'waterline' ).Collection.extend( require( './models/image' ) )
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

  // Expose settings into app.
  deepExtend( this.app.settings, this.settings.get( 'app' ) );

  this.applyHandler( handler, serviceModule );

  this.auto({
    orm:      [ this.startORM.bind( this ) ],
    service:  [ 'orm', function serviceBoot( next, state ) {
      // console.log( 'serviceBoot' );

      Object.defineProperties( self, {
        _state: {
          value: state,
          enumerable: true,
          configurable: false,
          writable: true
        }
      });

      self.emit( 'ready', null, self, state );

    }]
  });

  // @return express instance to make mountable
  return this.app.once( 'mount', this.onMount.bind( module._instance = this ) );

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  ack: {
    /**
     * Used as a callback on things we don't really care about, yet a callback is required. (Waterline)
     *
     * @param error
     * @param data
     */
    value: function acknowledge( error, data ) {
      dockerProxy.prototype.debug( 'acknowledge', error, data );
    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  applyHandler: {
    value: function applyHandler( handler, serviceModule ) {

      // Invoke handler if its a function.
      if( 'function' === typeof handler ) {

        if( serviceModule ) {
          serviceModule.exports = this;
        }

        handler.call( this, null, this );

      }

      // Treat handler as settings if its an object.
      if( 'object' === typeof handler ) {
        this.settings.set( handler );
      }

      return this;

    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  get: {
    value: function get() {
      return this.settings.get.apply( this.settings, arguments );
    },
    configurable: true,
    enumerable: true
  },
  set: {
    value: function set() {
      return this.settings.set.apply( this.settings, arguments );
    },
    configurable: true,
    enumerable: true
  },
  on: {
    value: function on() {
      return this._broker.on.apply( this._broker, arguments );
    },
    configurable: true,
    enumerable: true
  },
  once: {
    value: function once() {
      return this._broker.once.apply( this._broker, arguments );
    },
    configurable: true,
    enumerable: true
  },
  emit: {
    value: function emit() {
      return this._broker.emit.apply( this._broker, arguments );
    },
    configurable: true,
    enumerable: true
  },
  off: {
    value: function off() {
      return this._broker.off.apply( this._broker, arguments );
    },
    configurable: true,
    enumerable: true
  },
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
  _broker: {
    /**
     *
     */
    value: require('object-emitter' ).create({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20
    }),
    enumerable: true,
    configurable: true,
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

      var self = this;

      var Waterline = require( 'waterline' );

      var _waterline = new Waterline().initialize({
        collections:  this.settings.get( 'collections' ),
        adapters:     this.settings.get( 'adapters' ),
        connections:  this.settings.get( 'connections' ),
      }, waterlineReady );

      function waterlineReady( error, models ) {

        if( !error && models ) {
          self._models      = models.collections;
          self._connections = models.connections;
        }

        if( error && error.message === 'Connection is already registered' && module._instance ) {
          models.models = module._instance._models;
          models.connections = module._instance._connections;
        }

        self.emit( 'orm:ready', null, models );

        if( !models ) {
          self.emit( 'orm:error', error, models );
        }

        next( null, models );
      }

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

      _child.on( 'error', function( message ) {
        console.log( 'spawn', serviceName, ':error', message );
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

    },
    enumerable: true,
    configurable: true,
    writable: true
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
  },
  service: {
    /**
     * New Instance.
     *
     * @param handler
     * @returns {dockerProxy}
     */
    value: function service( handler, serviceModule ) {
      dockerProxy.prototype.debug( 'dockerProxy.service' );
      return new dockerProxy( handler, serviceModule );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
});