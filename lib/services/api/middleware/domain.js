function domainHandler() {


  res.send({
    ok: true,
    method: req.method,
    url: req.url,
    middleware: 'domainHandler'
  })

}

Object.defineProperties( module.exports = domainHandler, {
  add: {
    value: function addRoute( req, res, next ) {

      res.send( 'addRoute', req.method, req.params );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  remove: {
    value: function removeRoute( req, res, next ) {

      res.send( 'removeRoute', req.method );

    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});