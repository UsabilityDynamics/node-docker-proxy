/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha --watch
 *
 */
module.exports = {

  dockerProxy: {

    'can be instantiated': function( done ) {

      require( '../../' ).service( function myService( error, service ) {

        service.should.have.properties( 'on', 'off', 'emit' );
        service.should.have.properties( '_broker', '_models' );
        service.should.have.properties( 'staticMiddleware' );

        service.once( 'ready', done );

      });

    },

    'can be instantiated only once but will work for mounted services.': function( done ) {

      require( '../../' ).service( function myService( error, service ) {
        service.should.have.properties( 'on', 'off', 'emit' );
        service.should.have.properties( '_broker', '_models' );
        service.should.have.properties( 'staticMiddleware' );
        service.once( 'ready', done );
      });

    },

    'event emitter': {

      'supports wild cards': function( done ) {
        require( '../../' ).prototype.once( 'test:*', done );
        require( '../../' ).prototype.emit( 'test:one', null, true );
      },

      'supports all matching': function( done ) {
        require( '../../' ).prototype.once( 'test:**', done );
        require( '../../' ).prototype.emit( 'test:one:two:three', null, true );
      }

    }

  }
};