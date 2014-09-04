/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=localhost DOCKER_PORT=2375 mocha --watch
 *
 */
module.exports = {

  before: function () {

    delete require.cache[ require.resolve( 'waterline' ) ];

    module.debug = require( 'debug' )( 'docker:proxy:unit' );

    module.dummyData = {
      containers: require( './fixtures/containers' ),
      backends: require( './fixtures/backends' ),
      images: require( './fixtures/images' )
    };

    module.waterlineConfig = {
      adapters: {
        docker: require( 'waterline-docker' ),
        memory: require( 'sails-memory' ),
        disk: require( 'sails-disk' )
      },
      collections: {
        image: require( '../../lib/models/image' ),
        container: require( '../../lib/models/container' ),
        backend: require( '../../lib/models/backend' )
      },
      connections: {
        docker: {
          adapter: 'docker'
        },
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

  ORM: {}

};

var _disabled = {

  'REST': function( done ) {

    return done();

    var modelling = require( 'modelling' );

    module.config = {};

    module.orm = new modelling( module.config, function( error, ormInstance ) {

      if( error && error.message !== 'Connection is already registered' ) {
        return done( error );
      }

      if( error && error.message === 'Connection is already registered' ) {

        ormInstance = {
          collections: module.models,
          connections: module.connections
        };

      }

      ormInstance.should.have.property( 'collections' );
      ormInstance.should.have.property( 'connections' );

      //console.log( require( 'util').inspect( ormInstance, { colors: true , depth:1, showHidden: false } ) );

      module.models = ormInstance.collections;
      module.connections = ormInstance.connections;

      done();

    });


  },

  'can add multiple backend objects from JSON file.': function ( done ) {

    return done();
    //console.log( require( 'util').inspect( module.models, { colors: true , depth:5, showHidden: false } ) );
    module.models.backend.createEach( module.dummyData.backends, done );

  },

  // @todo add actual requests to verify response of server.
  'can start servers': function( done ) {

    return done();

    this.timeout( 600000 );

    var app = require( 'express' ).call();

    // http://localhost:58922/backend/tkgn-eskw-hqam-wpxz
    app.get('/backend/:id', module.orm.use( ['backend', 'container'] ), function(req, res, next) {

      req.model.backend.find({ _id: req.param( 'id' )}, function(err, backends ){

        res.send({
          ok: true,
          data: backends
        });

      });

    });

    app.get('/container/', module.orm.use({
      policies: {
        doSomethingImportant: function(req, res, next) {
          next();
        }
      },
      models: 'container'
    }), function(req, res, next) {

      res.send( 'container!' );

    });

    app.listen( 58922, null, function() {

      console.log( this.address().address, this.address().port );

      done();

    })

  }

}
