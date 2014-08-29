/**
 * Creates Waterline Collection for Backends
 *
 * - Schema is enabled to keep the backend data stored in memory limited to only what we need.
 * - Stored in Memory.
 *
 * beforeValidate
 * afterValidate
 * beforeUpdate
 * afterUpdate
 * beforeCreate
 * afterCreate
 * beforeDestroy
 * afterDestroy
 *
 */
Object.defineProperties( module, {
  exports: {
    value: require( 'waterline' ).Collection.extend({
      identity: 'backend',
      tableName: 'docker-backend',
      connection: [ 'disk', 'memory' ],
      pkFormat: 'integer',
      migrate: 'safe',
      autoPK: false,
      autoCreatedAt: false,
      autoUpdatedAt: false,
      schema: true,
      syncable: true,
      attributes: {
        _id: {
          type: 'integer',
          primaryKey: true,
          unique: true,
          required: true
        },
        _parent: {
          type: 'integer',
          model: 'container'
        },
        _timestamp: {
          type: 'string'
        },
        _type: {
          type: 'string',
          defaultsTo: 'backend'
        },
        host: {
          type: 'string',
          defaultsTo: '',
          required: false,
          index: true,
          maxLength: 100
        },
        hostname: {
          type: 'string',
          defaultsTo: '',
          required: false,
          index: true,
          maxLength: 100
        },
        port: {
          type: 'integer',
          defaultsTo: 80,
          required: true
        },
        domain: {
          type: 'string',
          required: false,
          defaultsTo: '',
          maxLength: 100
        },
        target: {
          type: 'string',
          required: true,
          defaultsTo: '',
          maxLength: 200
        },
        ssl: {
          type: 'json',
          required: false,
          defaultsTo: {}
        },
        toProxy: {
          type: 'boolean',
          required: false,
          defaultsTo: false
        },
        path: {
          type: 'string',
          required: false,
          defaultsTo: "/",
          minLength: 1,
          maxLength: 200
        }
      },
      // class methods
      remove: removeDocument,
      insert: insertDocument,

      // lifecycle callbacks
      beforeDestroy: beforeDestroy,
      beforeValidate: beforeValidate,
      afterCreate: afterCreate
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:model:backend' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});

/**
 *
 * @param data
 * @param done
 */
function beforeDestroy( data, done ) {
  module.debug( 'beforeDestroy' );
  done();
}

/**
 *
 * @param data
 * @param done
 */
function afterCreate( data, done ) {
  module.debug( 'afterCreate' );
  done();
}

/**
 *
 * @param data
 * @param done
 */
function beforeValidate( data, done ) {
  module.debug( 'beforeValidate' );
  done();
}

/**
 * Semantic-shim for create()
 *
 */
function insertDocument() {
  module.debug( 'insertDocument' );
  return this.create.apply( this, arguments );
}

/**
 * Semantic-shim for destroy()
 *
 * @returns {*}
 */
function removeDocument() {
  module.debug( 'removeDocument' );
  return this.destroy.apply( this, arguments );
}
