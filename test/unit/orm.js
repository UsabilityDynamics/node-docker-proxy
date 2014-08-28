/**
 * Test Shared Veneer.io Service APIs
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

    module.debug = require( 'debug' )( 'docker-proxy:unit' );

    module.dummyData = require( './fixtures/containers.json' );
    module.containerModel = require( '../../lib/models/container' );

    module.Waterline = require( 'waterline' );
    module.orm = module.Waterline();

    module.waterlineConfig = {
      adapters: {
        memory: require( 'sails-memory' ),
      },
      collections: {
        container: module.containerModel
      },
      connections: {
        memory: {
          adapter: 'memory'
        }
      }
    }

  },

  "can inititilize collection.": function ( done ) {

    module.orm.initialize( module.waterlineConfig, function ormReady( error, ormInstance ) {
      // console.log( 'ormReady', Model.container );

      ormInstance.should.have.property( 'collections' );
      ormInstance.should.have.property( 'connections' );

      module.exports.models = ormInstance.collections;
      module.exports.connections = ormInstance.connections;

      done();

    } );

  },

  'can add multiple objects from JSON file.': function ( done ) {

    module.exports.models.container.createEach( module.dummyData, function( error, model ) {

      done();

    });

  },

  'can find api.site1.com': function ( done ) {

    module.exports.models.container.findOne({ Name: "temp.site2.com" }, function searchCallback( error, result ) {

      result.should.have.property( 'Id' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'Status' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can find www.site2.com': function ( done ) {

    module.exports.models.container.findOne()
      .where( { Domain: 'cdn.site3.com' } )
      .sort( 'updatedAt' )
      .exec( function ( error, result ) {

      result.should.have.property( 'Id' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'Status' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can NOT find www.site100.com': function ( done ) {

    module.exports.models.container.findOne( { Domain: 'api.site19.com' }, function ( error, result ) {

      (error === undefined).should.be.true;
      (result === undefined).should.be.true;

      done();

    } );

  }

};