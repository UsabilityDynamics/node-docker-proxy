/**
 *
 */
Object.defineProperties( module.exports, {
  initialize: {
    /**
     * Instantiates Model
     *
     * @param done
     * @returns {*|exports.models|app.models|module.models|valuesObject.associations.models}
     */
    value: function initialize( done ) {

      var Waterline = require( 'waterline' );

      var _orm = new Waterline();

      _orm.loadCollection( module.exports.modelSchema );

      _orm.initialize( module.exports.config, this.modelReady( done ) );

      return module.exports.models.image;

    },
    enumerable: true,
    configurable: false
  },
  modelSchema: {
    value: require( 'waterline' ).Collection.extend({
      identity: 'image',
      connection: 'memoryAdapter',
      attributes: {
        ID: {
          type: 'string',
          index: true
        },
        Name: {
          type: 'string',
          required: false,
          minLength: 5,
          maxLength: 100
        },
        Config: {
          type: 'object'
        },
        Image: {
          type: 'string',
          required: false,
          minLength: 5,
          maxLength: 100
        }
      }
    }),
    enumerable: true,
    configurable: false,
    writable: true
  },
  config: {
    value: {
      tableName: 'docker-proxy',
      connections: {
        diskAdapter: {
          adapter: 'disk'
        },
        memoryAdapter: {
          adapter: 'memory'
        }
      },
      adapters: {
        disk: require( 'sails-disk' ),
        memory: require( 'sails-memory' )
      },
      config: {
        filePath: '/tmp/dockerProxy',
        schema: false,
        interfaces: [
          "semantic",
          "queryable",
          "associations"
        ]
      }
    },
    enumerable: false,
    configurable: false,
    writable: false
  },
  modelReady: {
    value: function modelReady( done ) {

      return function( error, _models ) {

        module.exports.models = _models && _models.collections ? _models.collections : module.exports.models || null;

        if ( error && error.message === 'Connection is already registered' ) {
          return done();
        }

        done( error, module.exports.models.image );

      }

    },
    enumerable: false,
    configurable: false,
    writable: false
  },
  models: {
    value: {
      image: undefined
    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  version: {
    value: 1.1,
    enumerable: false,
    configurable: false,
    writable: false
  }
});
