/**
 * Start Docker Proxy
 *
 * node bin/docker-proxy.js start
 *
 * sudo DEBUG=docker.proxy DOCKER_HOSTNAME=208.52.164.213 DOCKER_PORT=16423 supervisor -w ./ -- bin/docker-proxy.js start -p 80
 *
 * @todo It may be better to wait (and verify) for Docker Daemon connection to be stablished before starting.
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {

  service.set( 'service.api', {
    name: 'api',
    cluster: false
  });

  service.startServer( 16000, null, function serverReady() {
    service.log.info( 'Primary Docker Proxy web server started on %s:%s.', this.address().address, this.address().port );
  });

  service.app.use( service.apiMiddleware({
    version: 1.2
  }));

  service.once( 'ready', function() {
    service.log.info( 'API Service loaded.' );
  });

  // watchSettings();

  // startBroker();

}, module );
