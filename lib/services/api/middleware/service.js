/**
 * Service Handler
 *
 * @param req
 * @param res
 * @param next
 */
function serviceHandler( req, res, next ) {
  console.log( 'serviceHandler', req.path );

  if( req.path === '/reload' ) {
    return serviceHandler.reload( req, res, next );
  }

  if( req.path === '/info' ) {
    return serviceHandler.info( req, res, next );
  }

  if( req.path === '/stop' ) {
    return serviceHandler.stop( req, res, next );
  }

  if( req.path === '/start' ) {
    return serviceHandler.start( req, res, next );
  }

  if( req.path === '/verify' ) {
    return serviceHandler.verify( req, res, next );
  }

  if( req.path === '/running' ) {
    return serviceHandler.running( req, res, next );
  }

  res.send({
    ok: false,
    message: 'No handler found at path.'
  });

}

Object.defineProperties( module.exports = serviceHandler, {
  reload: {
    value: function reloadService( req, res, next ) {
      console.log( 'reloadService' );

      var haproxy = require( 'haproxy' ).create( '/tmp/veneer-proxy/haproxy.uds.docker-proxy' );

      haproxy.reload( true, function reloadCallback( error, data ) {
        console.log( 'reloadCallback' );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  info: {
    value: function infoService( req, res, next ) {
      console.log( 'infoService' );

      var haproxy = require( 'haproxy' ).create( '/tmp/veneer-proxy/haproxy.uds.docker-proxy' );

      haproxy.info( function infoCallback( error, data ) {
        console.log( 'infoCallback' );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  stop: {
    value: function stopService( req, res, next ) {
      console.log( 'stopService' );

      var haproxy = require( 'haproxy' ).create({
        pidFile: '/var/run/veneer/veneer-proxy:haproxy.pid',
        socket: '/tmp/veneer-proxy/haproxy.uds.docker-proxy',
        config: '/etc/haproxy/uds.docker-proxy.cfg',
        which: '/usr/local/sbin/haproxy'
      });

      haproxy.stop( true, function stopCallback( error, data ) {
        console.log( 'stopCallback' );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  start: {
    value: function startService( req, res, next ) {
      console.log( 'startService' );

      var haproxy = require( 'haproxy' ).create( '/tmp/veneer-proxy/haproxy.uds.docker-proxy' );

      haproxy.start( function startCallback( error, data ) {
        console.log( 'startCallback' );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  verify: {
    value: function verifyService( req, res, next ) {
      console.log( 'verifyService' );

      var haproxy = require( 'haproxy' ).create({
        pidFile: '/var/run/veneer/veneer-proxy:haproxy.pid',
        socket: '/tmp/veneer-proxy/haproxy.uds.docker-proxy',
        config: '/etc/haproxy/uds.docker-proxy.cfg',
        which: '/usr/local/sbin/haproxy'
      });

      haproxy.verify( function verifyCallback( error, data ) {
        console.log( 'verifyCallback', error, data );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  running: {
    value: function runningService( req, res, next ) {
      console.log( 'runningService' );

      var haproxy = require( 'haproxy' ).create({
        pidFile: '/var/run/veneer/veneer-proxy:haproxy.pid',
        socket: '/tmp/veneer-proxy/haproxy.uds.docker-proxy',
        config: '/etc/haproxy/uds.docker-proxy.cfg',
        which: '/usr/local/sbin/haproxy'
      });

      haproxy.running( function runningCallback( error, data ) {
        console.log( 'runningCallback', error, data );

        res.send({
          ok: error ? false : true,
          error: error,
          data: data
        });

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});

