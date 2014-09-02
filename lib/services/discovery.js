/**
 * Service Discovery
 *
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {

  this.set( 'service.discovery', {
    cluster: false
  });

  function dockerConnected() {
    service.log.info( 'Docker Daemon connected.' );
    service.emit( 'docker:connect', null );
  }

  function dockerDisconnected() {
    service.emit( 'docker:disconnect', null );
  }

  function dockerMessage( message ) {
    // console.log( require( 'util').inspect( message, { colors: true , depth:5, showHidden: false } ) );

    service.emit( 'docker:message', null, {
      id: message.id,
      event: message.status,
      time: message.time
    });

  }

  service.once( 'ready', function() {
    service.log.info( 'Discovery Service loaded.' );

    _docker = require( '../clients/docker' ).create({
      host: service.settings.get( 'docker.hostname' ),
      port: service.settings.get( 'docker.port' )
    });

    _docker.on( "connect",     dockerConnected );
    _docker.on( "disconnect",  dockerDisconnected );
    _docker.on( "_message",    dockerMessage );

    return;

  });

}, module );

