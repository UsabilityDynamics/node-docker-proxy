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

  var yaml = require( "js-yaml" );
  var express = require( 'express' );
  var cluster = require( 'cluster' );
  var merge = require( 'merge-descriptors' );

  // var _config = yaml.load(require("fs").readFileSync("dockerProxy.yml"));

  var self = this;
  var master = cluster.isMaster;

  // Merge Veneer Proxy prototype into Veneer Service Prototype..
  merge( this.service.prototype, dockerProxy.prototype );

  try {

    // Create Veneer Service Instance.
    var app = this.instance = this.service( handler, module || process.mainModule );

    // Fixes x-forwarded-for and such.
    this.instance.set( 'trust proxy', true );

    // Handle Standard Proxy Service response.
    this.instance.use( this.Proxy = express() );

    this.Proxy.use( function UpstreamHandler( req, res, next ) {
      // console.log( 'UpstreamHandler' );

      // Apply Custom Callback if set.
      if ( app.get( 'UpstreamCallback' ) ) {
        // console.log( 'UpstreamHandler', 'have callback'  );
        app.get( 'UpstreamCallback' )( req, res, next );
      } else {
        next();
      }

    } );

    this.Proxy.use( function ProxyHandler( req, res, next ) {
      // Apply Custom Callback if set.
      req.proxy( req, app.ResponseStream( app.get( 'DownstreamCallback' ), req, res, next ), app.get( 'target' ) );

    } );

  } catch ( error ) {
    console.error( 'Veneer Proxy Service spawn failure. Message: [%s]', error.message, error );
  }

}

/**
 * dockerProxy Instance Properties.
 *
 */
Object.defineProperties( dockerProxy.prototype, {
  ServiceResources: {
    value: function ( options ) {
      this.use( require( 'service-resource' ).create( options ) );
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
  },
  ResponseStream: {
    value: require( './common/response-stream' ).create,
    enumerable: false,
    configurable: true,
    writable: true
  }
} );

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
  },
  tasks: {
    value: {
      status: require( './tasks/status' ),
      install: require( './tasks/install' )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
} );