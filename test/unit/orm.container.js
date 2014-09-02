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

    module.debug = require( 'debug' )( 'docker-proxy:unit' );

    module.dummyData = {
      containers: require( './fixtures/containers' ),
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
          adapter: 'docker'
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

    "can call class methods.": function ( done ) {

      var Container = module.models.container;

      // Default Properties.
      Container.should.have.property( 'meta' );
      Container.should.have.property( 'syncable' );
      Container.should.have.property( 'adapterDictionary' );
      //Container.should.have.property( 'primaryKey', 'Name' );
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

      // @note createEach does not exist for "memory".
      // Container.adapterDictionary.should.have.property( 'createEach' );

      // Custom Methods.
      Container.should.have.property( 'stateChange' );
      Container.should.have.property( 'fetchUpstream' );
      Container.should.have.property( 'remove' );
      Container.should.have.property( 'insert' );

      // Try using the custom "insert" method.
      Container.insert({
        "Command": "/etc/entrypoints/hhvm /bin/bash",
        "Created": 1408739794,
        "Id": "12345",
        "Config": {
          "Domainname": "site9.com",
          "Hostname": "api"
        },
        "Image": "andypotanin/express",
        "Names": ["/cdn.site9.com"],
        "Ports": [
          { "IP": "0.0.0.0", "PrivatePort": 80, "PublicPort": 49169, "Type": "tcp" },
          { "IP": "0.0.0.0", "PrivatePort": 8080, "PublicPort": 49170, "Type": "tcp" },
        ],
        "NetworkSettings": {
          "Bridge": "docker0",
          "Gateway": "172.17.42.1",
          "IPAddress": "172.17.0.93",
          "IPPrefixLen": 16,
          "PortMapping": null,
          "Ports": {
            "11000/tcp": null,
            "80/tcp": [
              {
                "HostIp": "0.0.0.0",
                "HostPort": "49169"
              }
            ],
            "8080/tcp": [
              {
                "HostIp": "0.0.0.0",
                "HostPort": "49170"
              }
            ]
          }
        }
      }, done );

    },

    "can search through collection.": function ( done ) {

      module.models.container.find( function eachFound( error, containers ) {

        done();

      });


    },

    'can add multiple Container objects from JSON file.': function ( done ) {
      module.models.container.createEach( module.dummyData.containers, done );
    },

    'can find all objects': function ( done ) {

      module.models.container.find( function eachFound( error, containers ) {
        // @todo Add check for array count.
        done();

      });

    },

    'can find api.site1.com': function ( done ) {

      module.models.container.findOne({ Name: "/temp.site1.com" }, function searchCallback( error, result ) {

        result.should.have.property( 'Id' );
        result.should.have.property( 'NetworkSettings' );
        result.should.have.property( 'Image' );

        done();

      } );

    },

    'can find /cdn.site9.com by Name.': function ( done ) {

      module.models.container.findOne().where( { Name: '/cdn.site9.com' } ).sort( 'updatedAt' ).exec( function ( error, container ) {

        // console.log( require( 'util').inspect( container, { colors: true , depth:0, showHidden: false } ) );
        //container.should.have.property( 'Id' );
        //container.should.have.property( 'NetworkSettings' );
        //container.should.have.property( 'Image' );

        //container.should.have.property( '_backends' );

        done();

      });

    },

    'can NOT find /api.site19.com by Name.': function ( done ) {

      module.models.container.findOne( { Name: '/api.site19.com' }, function ( error, result ) {

        (error === undefined).should.be.true;
        (result === undefined).should.be.true;

        done();

      } );

    },

    'can add several new containers': function( done ) {

      module.models.container.findOrCreateEach( [ 'Name' ], module.dummyData.containers, done );

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

    'can fetchUpstream': function( done ) {

      module.models.container.fetchUpstream( null, done );

    }

  }

};