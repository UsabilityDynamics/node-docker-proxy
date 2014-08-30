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
          adapter: 'memory'
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

    'can create Backends.': function( done ) {

      return done();

      var Container = module.models.container;
      var Backend = module.models.backend;

      Backend.insert({
        container: "/site1.com",
        domain: "asdsdf.com",
        hostname: "com",
        order: 100,
        port: 80
      }, function() {

        console.log( require( 'util').inspect( arguments, { colors: true , depth:5, showHidden: false } ) );

        //Container.update("/site1.com", { pet: pet.id }).exec(function(err, user) {});

        done()
      });


    },

    'can populate Backends association model for Containers': function( done ) {

      return done();

      module.models.container.find({ 'Name': '/site1.com' }).populate( '_backends' ).exec( function(error, containers) {

        // console.log( require( 'util').inspect( containers, { colors: true , depth:5, showHidden: false } ) );

        containers[0].should.have.property( 'Name' );
        containers[0].should.have.property( '_backends' );
        containers[0].should.have.property( '_frontends' );

        // containers[0].Backends[0].should.have.property( 'VirtualSize' );

        return done( error );

      });

    }

  }

};