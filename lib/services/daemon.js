/**
 * Daemon Service
 *
 * - Should not be clustered.
 *
 */
require( '../docker-proxy' ).create( function serviceHandler( error, service ) {

  // Configure dockerProxy instance.
  service.settings.set({
    name: 'daemon',
    cluster: false,
    scale: false
  });

  // Wait for dockerProxy controller to be ready.
  service.app.on( 'service:ready', function( error, service ) {
    service.debug( 'Daemon Service loaded.' );

    // Start Services.
    service.startService( 'services/api' );
    service.startService( 'services/router' );
    service.startService( 'services/static' );
    service.startService( 'services/varnish' );

  });

}, module );