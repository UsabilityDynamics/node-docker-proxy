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

    this.dummyData = require( './fixtures/containers-detail.json' );

    this.containerModel = require( '../../lib/orm/container' );
    this.routeModel = require( '../../lib/orm/route' );

  },

  "can inititilize collection.": function ( done ) {

    this.containerModel.initialize( function ormReady( error, containerModel ) {
      // console.log( 'ormReady', Model.container );

      module.exports.containerModel = containerModel;

      containerModel.should.have.property( 'connections' );
      containerModel.should.have.property( 'waterline' );
      containerModel.should.have.property( 'adapter' );
      containerModel.should.have.property( 'definition' );

      //containerModel.connections.should.have.property( 'memoryAdapter' );

      done();

    } );

  },

  'can add multiple objects from JSON file.': function ( done ) {

    module.exports.containerModel.createEach( this.dummyData, function ( error, model ) {

      module.debug( 'createEach', model.map( function ( data ) {
        return data.Name
      } ) );

      done();

    } );

  },

  'can find api.site1.com': function ( done ) {

    module.exports.containerModel.findOne({ Domain: 'api.site1.com' }, function searchCallback( error, result ) {

      result.should.have.property( 'ID' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'State' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can find www.site2.com': function ( done ) {

    module.exports.containerModel.findOne()
      .where( { Domain: 'www.site2.com' } )
      .sort( 'priority' )
      .exec( function ( error, result ) {

      result.should.have.property( 'ID' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'State' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can NOT find www.site100.com': function ( done ) {

    module.exports.containerModel.findOne( { Domain: 'api.site19.com' }, function ( error, result ) {

      (error === undefined).should.be.true;
      (result === undefined).should.be.true;

      done();

    } );

  }

};