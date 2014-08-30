/**
 * Docker Proxy default tests.
 *
 * DOCKER_HOST=http://fallujah DOCKER_PORT=16423 mocha --watch
 *
 */
module.exports = {

  before: function () {

    module.debug = require( 'debug' )( 'docker:proxy:unit' );

    module.dummyData = {
      containers: require( './fixtures/containers' ),
      backends: require( './fixtures/backends' ),
      images: require( './fixtures/images' )
    };

    module.Waterline = require( 'waterline' );
    module.orm = new module.Waterline();

    module.waterlineConfig = {
      adapters: {
        memory: require( 'sails-memory' ),
        disk: require( 'sails-disk' )
      },
      collections: {
        image: require( '../../lib/models/image' ),
        container: require( '../../lib/models/container' ),
        backend: require( '../../lib/models/backend' )
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

  ORM: {


    'REST': function( done ) {


      var modelling = require( 'modelling' );

      var orm = module.orm = new modelling( require( './fixtures/config' ).waterline, function( error, ormInstance ) {

        //console.log( require( 'util').inspect( ormInstance, { colors: true , depth:5, showHidden: false } ) );

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

      });


    },

    'can add multiple backend objects from JSON file.': function ( done ) {
      module.models.backend.createEach( module.dummyData.backends, done );
    },

    // @todo add actual requests to verify response of server.
    'can start servers': function( done ) {

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
};