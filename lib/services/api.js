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

  service.once( 'ready', onceReady );

  var axon = require('axon');
  var sock = axon.socket('sub');

  if( parseInt(process.env.DOCKER_PROXY_DAEMON_SERVICEBUS_PORT) ) {
    sock.connect( parseInt(process.env.DOCKER_PROXY_DAEMON_SERVICEBUS_PORT) );
  }

  sock.on( 'error', function( error ) {
    console.log( 'bus error', error.message );
  });

  sock.on('message', function(topic, data, headers){
    // console.log( data );
  });

  function onceReady() {

    sock.subscribe('state:settings');
    sock.subscribe('state:change');

    service.startServer( service.get( 'service.api.port' ), service.get( 'service.api.address' ), function serverReady() {
      service.log.info( 'API web server started on http://%s:%s.', this.address().address, this.address().port );
    })

    service.app.use( service.apiMiddleware({
      version: 1.2
    }));

    watchSettings();

    startBroker();

  }

}, module );


function watchSettings() {

}

function startBroker() {

}
