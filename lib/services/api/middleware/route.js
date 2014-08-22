/**
 * Route Handler
 *
 *
 * - /usr/local/lib/node_modules/veneer-proxy/static/etc/haproxy/domain.map
 *
 * @param req
 * @param res
 * @param next
 */
function routeHandler( req, res, next ) {
  console.log( 'routeHandler', req.path );

  if( req.path === '/list' ) {
    return routeHandler.list( req, res, next );
  }

  if( req.path === '/add' ) {
    return routeHandler.add( req, res, next );
  }

  if( req.path === '/remove' ) {
    return routeHandler.remove( req, res, next );
  }

  res.send({
    ok: false,
    message: 'No handler found at path.'
  });

}

Object.defineProperties( module.exports = routeHandler, {
  list: {
    value: function listRoutes( req, res, next ) {
      console.log( 'listRoutes' );

      var haproxy = require( 'haproxy' ).create( '/tmp/veneer-proxy/haproxy.uds.docker-proxy' );

      haproxy.send( 'show map /etc/haproxy/domain.map' ).call( function ( error, data ) {
        console.log( 'show map' );

        res.send({
          ok: true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  add: {
    /**
     * Add Route to Haproxy Map.
     *
     * @param req
     * @param res
     * @param next
     */
    value: function addRoute( req, res, next ) {
      // console.log( 'req.param', req.url, req.query );

      var haproxy = require( 'haproxy' ).create( '/tmp/veneer-proxy/haproxy.uds.docker-proxy' );

      haproxy.send( 'add map /etc/haproxy/domain.map ' + req.query.route + ' ' + req.query.target + '' ).call( function ( data ) {
        // console.log('add map /etc/haproxy/domain.map ' + req.query.route + ' ' + req.query.target + '' );

        res.send({
          ok: true,
          data: data
        });

      });

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