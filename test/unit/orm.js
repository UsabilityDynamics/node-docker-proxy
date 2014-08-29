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
        container: require( '../../lib/models/container' )
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

  "can inititilize collection.": function ( done ) {

    module.orm.initialize( module.waterlineConfig, function ormReady( error, ormInstance ) {
      // console.log( 'ormReady', Model.container );

      ormInstance.should.have.property( 'collections' );
      ormInstance.should.have.property( 'connections' );

      module.models = ormInstance.collections;
      module.connections = ormInstance.connections;

      done();

    } );

  },

  "can call class methods.": function ( done ) {

    var Container = module.models.container;

    // Default Properties.
    Container.should.have.property( 'meta' );
    Container.should.have.property( 'syncable' );
    Container.should.have.property( 'adapterDictionary' );
    Container.should.have.property( 'primaryKey', 'Name' );
    Container.should.have.property( 'migrate', 'safe' );
    Container.should.have.property( 'hasSchema', true );
    Container.should.have.property( 'defaults' );
    Container.should.have.property( 'adapter' );
    Container.should.have.property( 'waterline' );

    // Adapter Methods. (standard)
    Container.adapterDictionary.should.have.property( 'identity' );
    Container.adapterDictionary.should.have.property( 'registerConnection' );
    Container.adapterDictionary.should.have.property( 'define' );
    Container.adapterDictionary.should.have.property( 'describe' );
    Container.adapterDictionary.should.have.property( 'destroy' );
    Container.adapterDictionary.should.have.property( 'createEach' );

    // Custom Methods.
    Container.should.have.property( 'changeEvent' );
    Container.should.have.property( 'remove' );
    Container.should.have.property( 'insert' );

    // Try using the custom "insert" method.
    Container.insert({
      "Command": "/etc/entrypoints/hhvm /bin/bash",
      "Created": 1408739794,
      "Id": "12345",
      "Image": "andypotanin/express",
      "Names": ["/site10000.com"],
      "Ports": [ {"IP": "0.0.0.0", "PrivatePort": 80, "PublicPort": 49155, "Type": "tcp"} ]
    }, done );

  },

  "can search through collection.": function ( done ) {

    module.models.container.find( function eachFound( error, containers ) {

      done();

    });


  },

  'can add multiple Image objects from JSON file.': function ( done ) {
    module.models.image.createEach( module.dummyData.images, done );
  },

  'can add multiple Container objects from JSON file.': function ( done ) {
    module.models.container.createEach( module.dummyData.containers, done );
  },

  'can find api.site1.com': function ( done ) {

    module.models.container.findOne({ Name: "temp.site2.com" }, function searchCallback( error, result ) {

      result.should.have.property( 'Id' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can find www.site2.com': function ( done ) {

    module.models.container.findOne()
      .where( { Name: '/cdn.site3.com' } )
      .sort( 'updatedAt' )
      .exec( function ( error, result ) {

      result.should.have.property( 'Id' );
      result.should.have.property( 'NetworkSettings' );
      result.should.have.property( 'Image' );

      done();

    } );

  },

  'can NOT find www.site100.com': function ( done ) {

    module.models.container.findOne( { Domain: 'api.site19.com' }, function ( error, result ) {

      (error === undefined).should.be.true;
      (result === undefined).should.be.true;

      done();

    } );

  },

  'can populate Image association model for Containers': function( done ) {

    module.models.container.find( {'Name': '/site1.com' }).populate( 'Image' ).exec( function(error, containers) {

      containers[0].should.have.property( 'Name' );
      containers[0].should.have.property( 'Image' );
      containers[0].Image.should.have.property( 'VirtualSize' );

      return done( error );

    });

  },

  'can destroy stored Container collection': function( done ) {

    module.models.container.find( function eachFound( error, containers ) {

      containers.forEach( function( container ) {

        container.destroy( function( error, containerList ) {
          // console.log( 'Destroyed %d items.', containerList.length );
        });

      });

      // Not sure if there is a way to destroyEach with shared cb.
      setTimeout( done, 500 );

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

  },

  'change events': {

    'asdf': function() {

      // Container.changeEvent({});


    }

  }

};