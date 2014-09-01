/**
 * Start Docker Proxy
 *
 * node bin/docker-proxy.js start
 *
 * sudo DEBUG=docker.proxy DOCKER_HOSTNAME=208.52.164.213 DOCKER_PORT=16423 supervisor -w ./ -- bin/docker-proxy.js start -p 80
 *
 * @todo It may be better to wait (and verify) for Docker Daemon connection to be stablished before starting.
 *
 * @param settings
 * @param settings.port
 * @param settings.host
 * @param settings.limit
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {
  this.debug( 'serviceHandler', 'Router' );

  service.set({
    name: 'router',
    cluster: true
  });

  var app = require( 'express' ).call();

  service.once( 'ready', function () {
    service.log.info( 'Docker Proxy Router fully loaed.' );
  });

  app.request.proxy = require('http-proxy').createProxyServer();

  app.request.proxy.on( 'error', function proxyError( error, req, res, data ) {

    res.send({
      ok: false,
      message: [ 'Backend is not reachable.' ],
      errors: [ error ],
      data: process.env.NODE_ENV === 'development' ? data : null
    });

  });

  app.request.proxy.on( 'proxyReq', function proxyReq(proxyReq, req, res, options) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( req.headers ).length );
  });

  app.request.proxy.on( 'proxyRes', function proxyRes(proxyRes, req, res) {
    // self.debug( 'proxyReq [headers: %d]', Object.keys( res.headers ).length );
  });

  app.use( '/', service.routerMiddleware( {}) );

  app.use( '/', service.staticMiddleware({
    path: require( 'path' ).join( __dirname, '../static/public' )
  }));

  app.get( '/', function(req, res) {
    res.send('hello from LB');
  });

  app.listen( 8080, '0.0.0.0', function() {
    service.log.info( 'Load balancer web server started on %s:%s.', this.address().address, this.address().port );
  });


}, module );
