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
  var joinPath = require( 'path' ).join;
  var Waterline = require( 'waterline' );

  // Set Default Settings.
  this.settings.set({
    name: 'dockerProxy',
    httpKeepAlive: true,
    maxSockets: true,
    app: {
      'trust proxy': false,
      'x-powered-by': false
    },
    basePath: require( 'path' ).join( __dirname, '../static/etc'  ),
    configPath: process.env.DOCKER_PROXY_CONFIG_PATH || findup( 'docker-proxy.yaml' ) || require( 'path' ).join( __dirname, '../static/etc/docker-proxy.yaml' ),
    adapters: {
      memory: require( 'sails-memory' ),
    },
    collections: {
      container: require( './models/container' ),
      image: require( './models/image' )
    },
    connections: {
        memory: {
          adapter: 'memory'
        }
      },
    options: {
      docker: ( process.env.DOCKER_HOST || '' ).replace( 'tcp:', 'http:' ),
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

  new Waterline().initialize({
    collections: this.settings.get( 'collections' ),
    adapters: this.settings.get( 'adapters' ),
    connections: this.settings.get( 'connections' ),
  }, this.ormReady.bind( this ) );

  this.app.request.proxy = require('http-proxy').createProxyServer();

  this.app.request.proxy.on( 'error', function proxyError( error, req, res, data ) {

    res.send({
      ok: false,
      message: [ 'Backend is not reachable.' ],
      errors: [ error ],
      data: process.env.NODE_ENV === 'development' ? data : null
    });

  });

  this.app.request.proxy.on('proxyReq', function proxyReq(proxyReq, req, res, options) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( req.headers ).length );
  });

  this.app.request.proxy.on('proxyRes', function proxyRes(proxyRes, req, res) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( res.headers ).length );
  });

  this.app.use( require( './middleware/router' ).bind( this ) );
  this.app.use( this.staticMiddleware( require( 'path' ).join( __dirname, '../static/public' ), { 'index': [ 'index.html', 'index.htm' ] }));

  // @return express instance to make mountable
  return this.app.on( 'mount', this.onMount.bind( this ) );

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  models: {
    value: null,
    configurable: true,
    enumerable: true,
    writable: true
  },
  connections: {
    value: null,
    configurable: true,
    enumerable: true,
    writable: true
  },
  getRemoteAddress: {
    value: function getRemoteAddress(req) {
      var remoteAddr;

      if (req.connection === undefined) {
        return null;
      }
      if (req.connection.remoteAddress) {
        remoteAddr =req.connection.remoteAddress;
      }
      if (req.connection.socket && req.connection.socket.remoteAddress) {
        remoteAddr =req.connection.socket.remoteAddress;
      }

      if (remoteAddr === null) {
        return errorMessage(res, 'Cannot read the remote address.');
      }

      if (remoteAddr.slice(0, 2) !== '::') {
        remoteAddr = '::ffff:' + remoteAddr;
      }

      return remoteAddr;

    }
  },
  ormReady: {
    value: function ormReady( error, models ) {
      this.debug( 'ormReady', error );

      this.models = models.collections;
      this.connections = models.connections;


      var tempData = [
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
      ];

      this.app.emit( 'orm:ready' );

      return this;

    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  getRemoteTarget: {
    /**
     *
     * @param req
     * @param callback
     * @returns {null}
     */
    value: function getRemoteTarget( req, callback ) {
      this.debug( 'getRemoteTarget [%s%s].', req.hostname, req.path );

      req.proxyQuery = {
        Hostname: req.hostname
      };

      this.models.container.findOne( req.proxyQuery, targetResult.bind( this ) );

      function targetResult( error, target ) {
        // this.debug( 'getRemoteTarget', 'haveResult', error !== null, typeof target );

        if( target && target.backend ) {
          return callback( null, target.backend );
        }

        // Always return an object
        return callback( new Error( 'No target found.' ), {
          target: {}
        } );

      }

      return null;

   },
    configurable: true,
    enumerable: true,
    writable: true
  },
  staticMiddleware: {
    /**
     * Middleware Handler.
     *
     * @param app
     * @constructor
     */
    value: require( 'serve-static' ),
    enumerable: true,
    configurable: true,
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
  listen: {
    /**
     * Start Server.
     *
     * @param options
     * @constructor
     */
    value: function() {

      this._server = this.app.listen.apply( this.app, arguments );

      this._server.on( 'error', function serverError( error ) {
        console.error( 'Unable to start Docker Proxy. [message: %s].', error.message );
      });

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