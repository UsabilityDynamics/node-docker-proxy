/**
 * Daemon Service
 *
 * - Should not be clustered.
 *
 */
require( '../docker-proxy' ).create( function serviceHandler( error, service ) {

  // Configure dockerProxy instance.
  service.set( 'service.daemon', {
    cluster: false,
    scale: false
  });

  // Wait for dockerProxy controller to be ready.
  service.on( 'ready', function( error, service ) {
    service.debug( 'Daemon Service loaded.' );

    // Spawn Core Services.
    service.startService( 'services/api' );
    service.startService( 'services/redbird' );
    service.startService( 'services/static' );

  });

}, module );