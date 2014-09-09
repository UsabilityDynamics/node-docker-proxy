/**
 * Docker Proxy Middleware
 *
 * - pass
 * - pipe
 * - deliver
 *
 * @todo Make docker "subscribe" enabled only when truly needed since certain services may not need to watch for events yet still invoke this constructor.
 * @todo Add formatting for Docker settings, e.g. to break-up DOCKER_HOST environment variable into DOCKER_PORT and DOCKER_HOSTNAME.
 * @todo Convert api and router middleware to use staticMiddleware format.
 *
 * @param handler
 * @param serviceModule
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
    name: require( '../package' ).name,
    version: require( '../package' ).version,
    app: {
      'trust proxy': false,
      'x-powered-by': false
    },
    basePath: require( 'path' ).join( __dirname, '../static/etc'  ),
    pidPath: process.env.DOCKER_PROXY_PID_PATH || '/var/run/docker-proxy',
    configPath: process.env.DOCKER_PROXY_CONFIG_FILE_PATH || findup( 'docker-proxy.yaml' ) || require( 'path' ).join( __dirname, '../static/etc/docker-proxy.yaml' ),
    adapters: {
      docker: require( 'waterline-docker' ),
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
      docker: {
        adapter: 'docker',
        schema: true,
        host: process.env.DOCKER_HOST || process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT,
        socketPath: process.env.DOCKER_SOCKET_PATH,
        subscribe: true
      },
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
    currentModule: serviceModule ? serviceModule.id : null,
    service: {
      api: {
        port: process.env.DOCKER_PROXY_API_PORT,
        address: process.env.DOCKER_PROXY_API_ADDRESS,
        docker: {
          host: process.env.DOCKER_HOST || 'localhost'
        }
      },
      daemon: {
        cluster: false
      },
      proxy: {
        port: process.env.DOCKER_PROXY_PORT,
        address: process.env.DOCKER_PROXY_ADDRESS,
        sslPath: process.env.DOCKER_PROXY_SSL_DIR,
        sslPort: process.env.DOCKER_PROXY_SSL_PORT
      },
      static: {
        path: process.env.DOCKER_PROXY_STATIC_PATH
      }
    }
  })

  // Set YAML Configuration.
  this.set( yaml.load( require( 'fs' ).readFileSync( this.settings.get( 'configPath' ) ) ) );

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
  this.app.once( 'mount', this.onMount.bind( module._instance = this ) );

  // If there is no handler callback, or it's an object, we assume that we are being invoked ad middleware.
  if( 'object' === typeof handler || !handler ) {
    return this.app;
  }

  // @chainable.
  return this;

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  _events: {
    get: function get() {
      return this._broker._events
    },
    enumerable: false,
    configurable: true
  },
  _state: {
    value: undefined,
    configurable: false,
    enumerable: true,
    writable: true
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
    configurable: false,
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
    enumerable: false,
    configurable: true,
    writable: true
  },
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
      var _ = require( 'lodash' );

      var Waterline = require( 'waterline' );

      var _waterline = new Waterline().initialize({
        collections:  this.settings.get( 'collections' ),
        adapters:     this.settings.get( 'adapters' ),
        connections:  this.settings.get( 'connections' ),
      }, waterlineReady );

      function waterlineReady( error, models ) {

        self.on( 'orm:ready', next );

        if( !error && models ) {

          self.emit( 'orm:ready', null, {
            models: self._models = self._models = models.collections,
            connections: self._connections = self._connections = models.connections
          });

        }

        if( error && error.message === 'Connection is already registered' && module._instance ) {

          self.emit( 'orm:ready', null, {
            models: self._models = self._models = module._instance._models,
            connections: self._connections = self._connections = module._instance._connections
          });

        }

        if( !models ) {
          self.emit( 'orm:error', error, null );
        }

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
        "info": 0,
        "event": 0,
        "error": 10
      },
      colors: {
        "info": "cyan",
        "event": "green",
        "error": "red"
      }
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  forkService: {
    /**
     *
     * @param modulePath {String} Relative path to module to fork.
     * @param envVariables
     * @returns {*}
     */
    value: function forkService( modulePath, options ) {
      this.debug( 'forkService', modulePath );

      var self            = this;
      var child_process   = require( 'child_process' );
      var joinPath        = require( 'path' ).join;
      var _               = require( 'lodash' );

      var _child = child_process.fork( joinPath( __dirname, modulePath ), process.args, {
        cwd: process.cwd(),
        //env: _.defaults( options.env || {}, process.env ),
        encoding: 'utf8',
        silent: options.silent || false
      });

      _child.on( 'listening', function( message ) {
        console.log( 'spawn', modulePath, ':listening' );
      });

      _child.on( 'error', function( message ) {
        console.log( 'spawn', modulePath, ':error', message );
      });

      _child.on( 'exit', function( message ) {
        console.log( 'spawn', modulePath, ':exit' );
      });

      _child.on( 'start', function( message ) {
        console.log( 'spawn', modulePath, ':start' );
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

        if( message.cmd === 'startService' ) {

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

      Object.defineProperty( self._workers, modulePath, {
        value: self._workers[ modulePath ] || {},
        enumerable: true,
        configurable: true,
        writable: true
      });

      return self._workers[ modulePath ][ _child.pid ] = _child;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  startService: {
    /**
     *
     * @todo Needs to recognize process.mainModule properly to know when to cluster or fork, right now always forks.
     *
     * @param modulePath {String|Object} Relative path to module to fork/cluster.
     * @param options {Object}
     * @returns {*}
     */
    value: function startService( modulePath, options ) {

      var _ = require( 'lodash' );
      var clusterMaster = require("./common/cluster")

      if( !modulePath && !options  ) {
        options = options || {};
        options.modulePath = this.settings.get( 'modulePath' );
        // console.log( options.modulePath, 'cluster' );
      }

      if( modulePath && 'string' === typeof modulePath ) {
        options = options || {};
        options.modulePath = modulePath;
        // console.log( options.modulePath, 'fork' );
      }

      if( !options && 'object' === typeof modulePath ) {
        options = { modulePath: modulePath };
        // console.log( options.modulePath, 'fork' );
      }

      options = _.defaults( options, {
        modulePath: this.settings.get( 'modulePath' ),
        env: _.defaults( options.env || {}, process.env ),
        cluster: true,
        workers: 2,
        silent: false
      })

      // Not forking self.
      if( options.modulePath !== this.settings.get( 'modulePath' ) ) {
        return this.forkService( options.modulePath, options );
      }

      // Forking self, e.g. starting a cluster.
      clusterMaster({
        exec: options.modulePath,
        size: options.workers,
        silent: options.silent,
        env: _.defaults( options.env || {}, process.env ),
        args: process.argv,
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

      // @chainable
      return this;

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