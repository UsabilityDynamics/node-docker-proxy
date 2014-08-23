/**
 * Creates Waterline Collection for Docker Containers.
 *
 * - Stored on Disk, or other persistant and shared service.
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

      _orm.initialize( this.config, this.modelReady( done ) );

      return module.exports.models.container;

    },
    enumerable: true,
    configurable: false
  },
  modelSchema: {
    value: require( 'waterline' ).Collection.extend({
      tableName: 'container',
      adapter: 'disk',
      connection: 'dockerContainer',
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
      /**
       * Passed to initialize() method for Waterline.
       * Must contain "adapters" and "connections" properties to be valid.
       * Not sure if "identity" is needed, seems to be grabbed from tableName if not set.
       */
      identity: 'docker-proxy',
      tableName: 'docker-proxy',
      connections: {
        dockerContainer: {
          adapter: 'disk',
          filePath: '/var/docker-proxy'
        }
      },
      adapters: {
        disk: require( 'sails-disk' )
      },
      config: {
        schema: false,
        interfaces: [
          "semantic",
          "queryable",
          "associations"
        ]
      },
      defaults: {}
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  modelReady: {
    value: function modelReady( done ) {

      return function( error, _models ) {

        module.exports.models = _models && _models.collections ? _models.collections : module.exports.models || null;

        if ( error && error.message === 'Connection is already registered' ) {
          return done();
        }

        done( error, module.exports.models.container );

        }

    },
    enumerable: false,
    configurable: false,
    writable: false
  },
  models: {
    value: {
      container: undefined
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
