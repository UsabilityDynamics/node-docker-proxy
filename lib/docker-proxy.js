/**
 * Docker Proxy Middleware
 *
 * - pass
 * - pipe
 * - deliver
 *
 * @version 0.5.1
 * @author potanin@UD
 * @constructor
 */
function dockerProxy( handler ) {

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
      container: require( './models/container' ),
      image: require( './models/image' )
    },
    connections: {
      memory: {
        adapter: [ 'memory' ]
      }
    },
    docker: {
      host: process.env.DOCKER_HOSTNAME || 'localhost',
      port: process.env.DOCKER_PORT || 2375,
    },
    options: {
    }
  })

  // Set YAML Configuration.
  this.settings.set({
    options: yaml.load( require( 'fs' ).readFileSync( this.settings.get( 'configPath' ) ) )
  });

  require( 'deep-extend' )( this.app.settings, this.settings.get( 'app' ) );

  // Invoke handler if its a function.
  if( 'function' === typeof handler ) {
    handler.call( this, null, this );
  }

  // Treat handler as settings if its an object.
  if( 'object' === typeof handler ) {
    this.settings.set( handler );
  }

  this.app.request.proxy = require('http-proxy').createProxyServer();

  this.app.request.proxy.on( 'error', function proxyError( error, req, res, data ) {

    res.send({
      ok: false,
      message: [ 'Backend is not reachable.' ],
      errors: [ error ],
      data: process.env.NODE_ENV === 'development' ? data : null
    });

  });

  this.app.request.proxy.on( 'proxyReq', function proxyReq(proxyReq, req, res, options) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( req.headers ).length );
  });

  this.app.request.proxy.on( 'proxyRes', function proxyRes(proxyRes, req, res) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( res.headers ).length );
  });

  this.app.use( '/api/v1',   this._middleware.api.bind( this ) );
  this.app.use( '/',         this._middleware.router.bind( this ) );
  this.app.use( '/',         this._middleware.static( require( 'path' ).join( __dirname, '../static/public' ), { 'index': [ 'index.html', 'index.htm' ] }));

  auto({
    orm:    [ this.startORM.bind( this ) ],
    docker: [ 'orm', function startDocker( next, state ) {
      // console.log( 'startDocker', self.settings.get( 'docker' ) );

      self._models = state.orm.collections;
      self._connections = state.orm.collections;

      if( !self.settings.get( 'docker' ) ) {
        return next( new Error( 'Missing Docker Daemon path or URL.' ) );
      }

      state.docker = new Docker({
        host: self.settings.get( 'docker.host' ),
        port: self.settings.get( 'docker.port' ),
      });

      var emitter = new DockerEvents({
        docker: state.docker
      });

      emitter.start();

      emitter.once("connect", function() {
        next( null, state.docker );
      });

      emitter.on("connect", function() {
        self.app.emit( 'docker:connect', null );
      });

      emitter.on("disconnect", function() {
        self.app.emit( 'docker:disconnect', null );
      });

      emitter.on("destroy", function() {
        self.app.emit( 'docker:destroy', null );
      });

      emitter.on("_message", function(message) {

        /**
         * message.status
         * - die - container stopping
         * - stop - container stopped (after die)
         * - start - container starting, and is now running
         * - create - new image ran
         * - start - container started, called after creation as well as directly starting
         *
         * There are no events for pausing/unpausing.
         *
         */

        if( message.status === 'start' ) {

          self.app.emit( 'docker:container:start', null, {
            id: message.id,
            image: message.from,
            time: message.time
          });

        }

        if( message.status === 'stop' ) {

          self.app.emit( 'docker:container:stop', null, {
            id: message.id,
            image: message.from,
            time: message.time
          });

        }

        self.app.emit( 'docker:_message', null, {
          message: 'Mesage from Docker API.',
          status: message.status,
          id: message.id,
          from: message.from,
          time: message.time
        });

      });

      self.app.emit( 'service:ready', null, state )

    }],
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
  _middleware: {
    value: {
      api: require( './middleware/api' ),
      router: require( './middleware/router' ),
      status: require( './middleware/status' ),
      static: require( 'serve-static' ),
    },
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
    value: console.log,
    enumerable: true,
    configurable: true,
    writable: true
  },
  startServer: {
    /**
     * Start Server.
     *
     * @param options
     * @constructor
     */
    value: function startServer() {

      var _server = this.app.listen.apply( this.app, arguments );

      _server.on( 'error', function serverError( error ) {
        console.error( 'Unable to start Docker Proxy. [message: %s].', error.message );

        if( error.errno === 'EADDRINUSE' ) {
          console.log( 'Address already in use, can not start servers.' );
        } else {
          console.log( 'Error!', error.message );
        }

      });

      this._servers.push( _server );

      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  settings: {
    /**
     * Upstream Middleware.
     *
     * @param options
     * @constructor
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
  }
});

/**
 * Constructor Properties.
 *
 */
Object.defineProperties( module.exports = dockerProxy, {
  start: {
    /**
     * New Instance.
     *
     * @param handler
     * @returns {dockerProxy}
     */
    value: function start( handler ) {
      dockerProxy.prototype.debug( 'dockerProxy.start' );
      return new dockerProxy( handler );
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});