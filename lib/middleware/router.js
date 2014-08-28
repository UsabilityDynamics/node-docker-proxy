/**
 * Middleware Handler.
 *
 * @param app
 * @constructor
 */
function routerMiddleware( req, res, next ) {
  this.debug( 'routerMiddleware [%s%s].', req.hostname, req.path );

  require( 'deep-extend' )( req.headers, {
    'x-real-ip': this.getRemoteAddress(req),
    'x-forwarded-for': this.getRemoteAddress(req),
    'x-forwarded-protocol': req.connection.pair ? 'https' : 'http',
    'x-forwarded-proto': req.connection.pair ? 'https' : 'http',
    'x-forwarded-port': req.connection.pair ? '443' : '80',
    'x-backend-id': null
  });

  res.set( 'x-via', 'docker-proxy/v0.1.0' );

  this.getRemoteTarget( req, handleTarget.bind( this ) );

  function handleTarget( error, container ) {

    this.debug( 'routerMiddleware [%s%s], [target=%s:%d].', req.hostname, req.path, container.target.host || '', container.target.port || '' );

    if( error || !container || !container.target ) {
      return next();
    }

    return req.proxy.web( req, res, container );

  }

  return null;

}

Object.defineProperties( module.exports = routerMiddleware, {
  version: {
    value: null,
    enumerable: true,
    configurable: false,
    writable: true
  }
});