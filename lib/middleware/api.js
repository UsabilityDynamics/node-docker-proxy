/**
 * Middleware Handler.
 *
 * @param app
 * @constructor
 */
function apiMiddleware( req, res, next ) {
  this.debug( 'apiMiddleware [%s].', req.path );

  res.send({
    ok: true,
    message: 'Docker Proxy API'
  });

}

Object.defineProperties( module.exports = apiMiddleware, {
  version: {
    value: null,
    enumerable: true,
    configurable: false,
    writable: true
  }
});