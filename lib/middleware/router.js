/**
 * Middleware Handler.
 *
 * @param app
 * @constructor
 */
function routerMiddleware( req, res, next ) {
  this.debug( 'routerMiddleware [%s%s].', req.hostname, req.path );

  require( 'deep-extend' )( req.headers, {
    'X-Real-Ip': module.getRemoteAddress(req),
    'X-Forwarded-For': module.getRemoteAddress(req),
    'X-Forwarded-Protocol': req.connection.pair ? 'https' : 'http',
    'X-Forwarded-Proto': req.connection.pair ? 'https' : 'http',
    'X-Forwarded-Port': req.connection.pair ? '443' : '80',
    'X-Docker-Proxy-Version': this.settings.get( 'version' ),
    'X-Backend-Id': null
  });

  res.set( 'X-Via', 'docker-proxy/v0.1.0' );

  module.getRemoteTarget.call( this, req, proxyToTarget.bind( this ) );

  function proxyToTarget( error, container ) {
    this.debug( 'routerMiddleware [%s%s], [target=%s:%d].', req.hostname, req.path, container.target.host || '', container.target.port || '' );

    if( error || !container || !container.target ) {
      return next();
    }

    return req.proxy.web( req, req.res, container );

  }

  return null;

}

Object.defineProperties( module, {
  exports: {
    value: routerMiddleware,
    enumerable: true,
    configurable: false,
    writable: true
  },
  getRemoteTarget: {
    /**
     *
     * @param req
     * @param callback
     * @returns {null}
     */
    value: function getRemoteTarget( req, callback ) {
      // this.debug( 'getRemoteTarget [%s%s].', req.hostname, req.path );

      req.proxyQuery = {
        Hostname: req.hostname
      };

      this._models.container.findOne( req.proxyQuery, targetResult.bind( this ) );

      function targetResult( error, target ) {
        // this.debug( 'getRemoteTarget', 'haveResult', error !== null, typeof target );

        if( target && target.Backend ) {
          return callback( null, target.Backend, req );
        }

        // Always return an object
        return callback( new Error( 'No target found.' ), { target: {} }, req );

      }

      return null;

    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  getRemoteAddress: {
    value: function getRemoteAddress(req) {
      var remoteAddr;

      if (req.connection === undefined) {
        return null;
      }
      if (req.connection.remoteAddress) {
        remoteAddr =req.connection.remoteAddress;
      }
      if (req.connection.socket && req.connection.socket.remoteAddress) {
        remoteAddr =req.connection.socket.remoteAddress;
      }

      if (remoteAddr === null) {
        return errorMessage(res, 'Cannot read the remote address.');
      }

      if (remoteAddr.slice(0, 2) !== '::') {
        remoteAddr = '::ffff:' + remoteAddr;
      }

      return remoteAddr;

    },
    configurable: true,
    enumerable: true,
    writable: true
  },
  proxy: {
    value: require('http-proxy').createProxyServer(),
    enumerable: true,
    configurable: false,
    writable: true
  },
  debug: {
    /**
     *
     */
    value: require( 'debug' )( 'docker:proxy:router' ),
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