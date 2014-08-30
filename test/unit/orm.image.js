/**
 * Test Shared Docker.io Service APIs
 *
 *
 * mocha test/unit/orm.js
 * mocha --watch test/unit/orm.js
 *
 * * site1.com - gets (site1.com)
 * * www.site1.com - gets (site1.com)
 * * cdn.site1.com - gets (site1.com) due to wildcard match
 * * media.site1.com - gets (site1.com) due to wildcard match
 * * api.site1.com - gets (api.site1.com) a custom container, not the wildcard match
 *
 * * site2.com - should get (site2.com)
 * * www.site2.com - should get (site2.com) because we strip out "www"
 * * api.site2.com - should fail because there is wildcard support on site2.com
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function () {

    module.debug = require( 'debug' )( 'docker:proxy:unit' );

    module.dummyData = {
      backends: require( './fixtures/backends' ),
      containers: require( './fixtures/containers' ),
      images: require( './fixtures/images' )
    };

    module.Waterline = require( 'waterline' );
    module.orm = module.Waterline();

    module.waterlineConfig = {
      adapters: {
        memory: require( 'sails-memory' ),
        disk: require( 'sails-disk' )
      },
      collections: {
        image: require( '../../lib/models/image' ),
        container: require( '../../lib/models/container' ),
        backend: require( '../../lib/models/backend' ),
      },
      connections: {
        memory: {
          adapter: 'memory'
        },
        disk: {
          adapter: 'disk'
        },
        persistent: {
          adapter: 'disk'
        },
        runtime: {
          adapter: 'memory'
        }
      }
    }

  },

  model: {

    "can inititilize collection.": function ( done ) {

      module.orm.initialize( module.waterlineConfig, function ormReady( error, ormInstance ) {
        // console.log( 'ormReady', Model.container );

        if( error && error.message !== 'Connection is already registered' ) {
          return done( error );
        }

        if( error && error.message === 'Connection is already registered' ) {
          ormInstance = module.orm;
        }

        ormInstance.should.have.property( 'collections' );
        ormInstance.should.have.property( 'connections' );

        module.models = ormInstance.collections;
        module.connections = ormInstance.connections;

        done();

      } );

    },

    'can add multiple Image objects from JSON file.': function ( done ) {
      module.models.image.createEach( module.dummyData.images, done );
    },

    'can populate Image association model for Containers': function( done ) {

      module.models.container.findOne({ 'Name': '/api.site1.com' }).populate( 'Image' ).exec( function(error, container) {

        // console.log( require( 'util').inspect( containers, { colors: true , depth:5, showHidden: false } ) );

        // container[0].should.have.property( 'Name' );
        // container[0].should.have.property( 'Image' );
        // container[0].Image.should.have.property( 'VirtualSize' );

        return done( error );

      });

    },

    'can destroy stored Image collection': function( done ) {

      module.models.image.find( function eachFound( error, images ) {

        images.forEach( function( image ) {

          image.destroy( function( error, imageList ) {
            // console.log( 'Destroyed %d items.', containerList.length );
          });

        });

        // Not sure if there is a way to destroyEach with shared cb.
        setTimeout( done, 500 );

      });

    }

  }

};