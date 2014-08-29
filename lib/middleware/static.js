/**
 * Middleware Handler.
 *
 * Initialized in-context of dockerProxy so has access to this.debug(), this.settings(), etc.
 *
 * @param app
 * @constructor
 */
function staticMiddleware( options ) {
  this.debug( 'staticMiddleware [options.path=%s].', options.path );

  options = options || {};

  var serveStatic = require('serve-static')

  return serveStatic( options.path, {
    setHeaders: module.setHeaders,
    index: options.index || [ 'index.html' ],
    dotfiles: 'ignore',
    etag: true
  });

}

Object.defineProperties( module, {
  exports: {
    value: staticMiddleware,
    enumerable: true,
    configurable: false,
    writable: true
  },
  setHeaders: {
    /**
     *
     * @param req
     * @param callback
     */
    value: function setHeaders( res, path ) {},
    configurable: true,
    enumerable: true,
    writable: true
  },
  debug: {
    /**
     *
     */
    value: require( 'debug' )( 'docker:proxy:staticMiddleware' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  version: {
    value: null,
    enumerable: true,
    configurable: false,
    writable: true
  }
});