/**
 * Test Shared Docker.io Service APIs
 *
 */
module.exports = {

  "dockerProxy controller": {

    'allows .create() to be used to mount services.': function( done ) {

      require( '../../../docker-proxy' ).create( function serviceHandler( error, service ) {

        service.should.have.properties( 'settings', 'app', 'debug', 'log' );
        service.should.have.properties( 'apiMiddleware', 'routerMiddleware', 'staticMiddleware' );
        service.should.have.properties( '_models', '_connections', '_middleware' );

        //service.should.have.properties( 'startORM', 'startServer' );

        service.settings.should.have.properties( 'get' );
        service.settings.should.have.properties( 'set' );
        service.settings.should.have.properties( 'on' );
        service.settings.should.have.properties( 'emit' );
        service.settings.should.have.properties( 'off' );

        done( error );

      });

    }

  }

};