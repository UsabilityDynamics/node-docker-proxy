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
  this.debug( 'serviceHandler', 'Static' );

  service.set( 'service.static', {
    cluster: true
  });

  var app = require( 'express' ).call();

  app.use( service.staticMiddleware({
    path: require( 'path' ).join( __dirname, '../static/public' )
  }));

  app.listen( 8090, '0.0.0.0', function() {
    service.log.info( 'Static file server started on %s:%s.', this.address().address, this.address().port );
  });


}, module );
