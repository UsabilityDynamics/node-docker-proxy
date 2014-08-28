/**
 * Middleware Handler.
 *
 * @param app
 * @constructor
 */
function statusMiddleware( req, res, next ) {
  this.debug( 'statusMiddleware [%s].', req.path );

  res.send({
    ok: true,
    message: 'Service is operational.'
  });

}

Object.defineProperties( module.exports = statusMiddleware, {
  version: {
    value: null,
    enumerable: true,
    configurable: false,
    writable: true
  }
});