/**
 * Test Shared Docker.io Service APIs
 *
 */
module.exports = {

  "dockerProxy controller": {

    'allows .create() to be used to mount clusterable services.': function( done ) {

      require( process.cwd() + '/lib/docker-proxy' ).create( function serviceHandler( error, service ) {

        service.should.have.properties( 'settings', 'app', 'debug', 'log' );
        service.should.have.properties( 'on', 'off', 'emit', 'once' );
        service.should.have.properties( 'apiMiddleware', 'routerMiddleware', 'staticMiddleware' );
        service.should.have.properties( '_models', '_connections' );

        //service.should.have.properties( 'startORM', 'startServer' );

        service.settings.should.have.properties( 'get' );
        service.settings.should.have.properties( 'set' );
        service.settings.should.have.properties( 'on' );
        service.settings.should.have.properties( 'emit' );
        service.settings.should.have.properties( 'off' );

        module.service = service;

        if( error && error.code === 'ECONNREFUSED' ) {
          console.log( 'Can not connect to Docker Client...' );
          return done( null );
        }

        done( error );

      });

    },

    'has an event emitter that supports wild cards.': function( done ) {
      module.service.on( 'test:*', done );
      module.service.emit( 'test:one', null, true );
    }

  }

};
