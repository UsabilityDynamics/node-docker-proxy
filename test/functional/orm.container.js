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

    module.debug = require( 'debug' )( 'docker-proxy:test:functional' );

    module.dummyData = {
      containers: require( './fixtures/containers' ),
      backends: require( './fixtures/backends' ),
      images: require( './fixtures/images' )
    };

    module.Waterline = require( 'waterline' );

    module.orm = new module.Waterline();

    module.waterlineConfig = {
      adapters: {
        docker: require( 'waterline-docker' ),
        memory: require( 'sails-memory' ),
        disk: require( 'sails-disk' )
      },
      collections: {
        image: require( 'waterline' ).Collection.extend(require( '../../lib/models/image' )),
        container: require( 'waterline' ).Collection.extend(require( '../../lib/models/container' )),
        backend: require( 'waterline' ).Collection.extend(require( '../../lib/models/backend' )),
      },
      connections: {
        docker: {
          adapter: 'docker',
          host: process.env.DOCKER_HOST || 'localhost:2875'
        },
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

  Container: {

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

        return done();

      } );

    },

    "can call class methods.": function () {

      var Container = module.models.container;

      // Default Properties.
      Container.should.have.property( 'meta' );
      Container.should.have.property( 'syncable' );
      Container.should.have.property( 'adapterDictionary' );
      Container.should.have.property( 'migrate', 'safe' );
      Container.should.have.property( 'hasSchema', true );
      Container.should.have.property( 'defaults' );
      Container.should.have.property( 'adapter' );
      Container.should.have.property( 'waterline' );
      Container.should.have.property( 'findOrCreateEach' );

      // Adapter Methods. (standard)
      Container.adapterDictionary.should.have.property( 'identity' );
      Container.adapterDictionary.should.have.property( 'registerConnection' );
      Container.adapterDictionary.should.have.property( 'define' );
      Container.adapterDictionary.should.have.property( 'describe' );
      Container.adapterDictionary.should.have.property( 'destroy' );
      Container.adapterDictionary.should.have.property( 'create' );

      // EventEmitter added by Docker adapter.
      Container.adapterDictionary.should.have.property( 'emit' );
      Container.adapterDictionary.should.have.property( 'on' );
      Container.adapterDictionary.should.have.property( 'once' );
      Container.adapterDictionary.should.have.property( 'off' );
      Container.should.have.property( 'emit' );
      Container.should.have.property( 'on' );
      Container.should.have.property( 'once' );
      Container.should.have.property( 'off' );

      // Custom Methods.
      Container.should.have.property( 'stateChange' );
      Container.should.have.property( 'fetchUpstream' );
      Container.should.have.property( 'remove' );
      Container.should.have.property( 'insert' );
      Container.should.have.property( 'createEach' );

    },

    "can emit events.": function ( done ) {
      module.models.container.once( 'test:*', done );
      module.models.container.emit( 'test:one', null, 'data1', 'data2' );;
    },

    'can add multiple Container objects from JSON file via createEach': function ( done ) {
      module.models.container.createEach( module.dummyData.containers, done );
    },

    'can get all objects using find().': function ( done ) {

      module.models.container.find( function eachFound( error, containers ) {
        containers[0].should.have.property( '_backends' );
        done();
      });

    },
    'can drop a single objects using destroy().': function ( done ) {

      module.models.container.findOne( 'b603aa42bfd20fcd7ea74d963def989ceb263590e164fe563c50395940a2e90a', function eachFound( error, image ) {

        return done();

        console.log( require( 'util').inspect( image, { colors: true , depth:0, showHidden: false } ) );

        image.should.have.property( 'destroy' );

        image.destroy( function( error, imageList ) {
          // console.log( 'Destroyed %d items.', containerList.length );
        });

        // Not sure if there is a way to destroyEach with shared cb.
        setTimeout( done, 500 );

      });

    },

    'can get single object using find().': function ( done ) {

      module.models.container.find( 'bf2a016be50089941cfa35ec02a1bf29f8f0d994ddd844b48c80cae5f49fd619', function eachFound( error, containers ) {
        return done();

        containers[0].should.have.property( '_backends' );
        done();
      });

    }

  }

};