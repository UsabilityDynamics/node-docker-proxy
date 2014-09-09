/**
 * Daemon Service
 *
 * - Should not be clustered.
 *
 */

require( '../docker-proxy' ).create( function serviceHandler( error, service ) {

  var _ = require('lodash');
  var axon = require('axon');
  var sock = axon.socket('pub');

  // ghetto implementation
  setInterval(function(){
    sock.send( 'state:settings', service.get(), { from: process.pid } );
  }, 10000 );

  // Wait for dockerProxy controller to be ready.
  service.once( 'ready', function( error, service ) {
    service.log.info( 'Daemon Service loaded. Spawning API, Proxy and Static services.' );

    sock.bind(null, function() {
      service.log.info( 'Daemon Service ServiceBus started on %s:%s.', this.address().address, this.address().port );

      // Extend environment variables for spawned services.
      _.extend( process.env, {
        DOCKER_PROXY_DAEMON_SERVICEBUS_PORT : this.address().port
      });

      // Spawn Core Services.
      service.startService( 'services/api' );
      service.startService( 'services/proxy' );
      service.startService( 'services/static' );

    });

  });

}, module );