/**
 * Middleware Handler.
 *
 * @param app
 * @constructor
 */
function routerMiddleware( req, res, next ) {
  this.debug( 'routerMiddleware [%s%s].', req.hostname, req.path );

  require( 'deep-extend' )( req.headers, {
    'X-Real-Ip': this.getRemoteAddress(req),
    'X-Forwarded-For': this.getRemoteAddress(req),
    'X-Forwarded-Protocol': req.connection.pair ? 'https' : 'http',
    'X-Forwarded-Proto': req.connection.pair ? 'https' : 'http',
    'X-Forwarded-Port': req.connection.pair ? '443' : '80',
    'X-Docker-Proxy-Version': this.settings.get( 'version' ),
    'X-Backend-Id': null
  });

  res.set( 'X-Via', 'docker-proxy/v0.1.0' );

  this.getRemoteTarget( req, proxyToTarget.bind( this ) );

  function proxyToTarget( error, container ) {
    this.debug( 'routerMiddleware [%s%s], [target=%s:%d].', req.hostname, req.path, container.target.host || '', container.target.port || '' );

    if( error || !container || !container.target ) {
      return next();
    }

    return req.proxy.web( req, req.res, container );

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