/**
 * dockerProxy Service Wrapper
 *
 * - pass
 * - pipe
 * - deliver
 *
 * @version 0.5.1
 * @author potanin@UD
 * @constructor
 */
function dockerProxy( handler, module ) {

  // Force Proper Instance.
  if ( !( this instanceof dockerProxy ) ) {
    return dockerProxy.create( handler, module || process.mainModule );
  }

  var self = this;
  var yaml = require( "js-yaml" );
  var findup = require( 'findup-sync' );

  // Set Default Settings.
  this.set({
    name: 'dockerProxy',
    basePath: require( 'path' ).join( __dirname, '../static/etc'  ),
    configPath: process.env.DOCKER_PROXY_CONFIG_PATH || findup( 'docker-proxy.yaml' ) || require( 'path' ).join( __dirname, '../static/etc/docker-proxy.yaml' ),
    options: {
      docker: ( process.env.DOCKER_HOST || '' ).replace( 'tcp:', 'http:' ),
    }
  })

  // Set YAML Configuration.
  this.set({
    options: yaml.load(require( 'fs' ).readFileSync( this.get( 'configPath' ) ) )
  });

  return this.app.on( 'mount', this.onMount.bind( this ) );

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  debug: {
    value: function() {

      this.on( "set.options.routes.**", function( error , value, key ) {
        self.debug( "route [%s] changed to [%s].", key, value );
      });

      this.on( "set.options.vhosts.**", function( error , value, key ) {
        self.debug( "vhost [%s] changed to [%s].", key, value );
      });

      this.on( "set.options.backends.**", function( error , value, key ) {
        self.debug( "backend [%s] changed to [%s].", key, value );
      });

      this.set( 'options.routes.www.two', 'asdfsadfasdasdfasdf' );
      this.set( 'options.routes.www.one', 'asdfsadfasdasdf' );

    },
    enumerable: false,
    configurable: true
  },
  get: {
    get: function() {
      return this.settings.get.bind( this.settings )
    },
    enumerable: true,
    configurable: true
  },
  set: {
    get: function() {
      return this.settings.set.bind( this.settings )
    },
    enumerable: true,
    configurable: true
  },
  on: {
    get: function() {
      return this.settings.on.bind( this.settings )
    },
    enumerable: true,
    configurable: true
  },
  app: {
    /**
     * Upstream Middleware.
     *
     * @param options
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
    value: require( 'debug' )( 'docker-proxy' ),
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
  },
  Upstream: {
    /**
     * Upstream Middleware.
     *
     * @param options
     * @constructor
     */
    value: function Upstream( options ) {
      this.set( 'UpstreamCallback', options.handler );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  Downstream: {
    /**
     * Downstream Middleware.
     *
     * @param options
     * @constructor
     */
    value: function Downstream( options ) {
      this.set( 'DownstreamCallback', options.handler );
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
     * @param module
     * @returns {dockerProxy}
     */
    value: function create( handler, module ) {
      return new dockerProxy( handler, module );
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});