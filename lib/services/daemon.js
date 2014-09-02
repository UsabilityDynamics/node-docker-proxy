/**
 * Daemon Service
 *
 * - Should not be clustered.
 *
 */

require( '../docker-proxy' ).create( function serviceHandler( error, service ) {

  // Spawn Core Services.
  service.startService( 'services/api' );
  service.startService( 'services/proxy' );
  service.startService( 'services/static' );

  // Wait for dockerProxy controller to be ready.
  service.once( 'ready', function( error, service ) {
    service.log.info( 'Daemon Service loaded.' );
  });

}, module );