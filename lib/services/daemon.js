/**
 * Daemon Service
 *
 * - Should not be clustered.
 *
 */

require( '../docker-proxy' ).create( function serviceHandler( error, service ) {

  // Wait for dockerProxy controller to be ready.
  service.once( 'ready', function( error, service ) {
    service.log.info( 'Daemon Service loaded. Spawning API, Proxy and Static services.' );

    // Spawn Core Services.
    service.startService( 'services/api' );
    service.startService( 'services/proxy' );
    service.startService( 'services/static' );

  });

}, module );