require( '../../docker-proxy' ).create( function serviceHandler( error, service ) {
  this.debug( 'serviceHandler', 'DAEMON' );

  // Configure dockerProxy instance.
  service.settings.set({
    name: 'daemon',
    cluster: false
  });

  // Start Services.
  service.startService( 'api' );
  service.startService( 'router' );
  service.startService( 'static' );

}, module );