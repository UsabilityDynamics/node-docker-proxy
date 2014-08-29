/**
 * Creates Waterline Collection for Backends
 *
 * - Schema is enabled to keep the container data stored in memory limited to only what we need.
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
      identity: 'container',
      tableName: 'docker-container',
      connection: [ 'persistent' ], // @todo change this to actual adapter once we figure out what we want to use.
      pkFormat: 'string',
      migrate: 'safe', // drop, alter, safe
      autoPK: false,
      autoCreatedAt: false,
      autoUpdatedAt: true,
      schema: true,
      syncable: true,
      attributes: {
        Name: {
          type: 'string',
          primaryKey: true,
          required: true,
          minLength: 5,
          maxLength: 100
        },
        Id: {
          type: 'string',
          required: false
        },
        Command: {
          type: 'string',
          required: false
        },
        Created: {
          type: 'integer',
          required: false
        },
        Image: {
          model: 'image'
        },
        Ports: {
          type: 'array',
          required: false
        },
        Status: {
          type: 'string',
          required: false
        },
        NetworkSettings: {
          type: 'string',
          defaultsTo: {},
          required: false
        },
        Domain: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        Hostname: {
          type: 'string',
          defaultsTo: 'localhost',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        Path: {
          type: 'string',
          required: false,
          defaultsTo: "/",
          minLength: 1,
          maxLength: 200
        },
        Backend: {
          type: 'json'
        }
      },
      observe: observeCollection,
      remove: removeDocument,
      insert: insertDocument,
      changeEvent: changeEvent,
      beforeFetch: function() {},
      afterFetch: function() {},
      beforeDestroy: beforeDestroy,
      beforeValidate: beforeValidate,
      afterCreate: afterCreate
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:model:container' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});

/**
 * Observe Entire Collection.
 *
 * This should be added by Adapter, this is temporary.
 *
 */
function observeCollection() {
  module.debug( 'observeCollection' );
}

/**
 *
 * @param data
 * @param done
 * @returns {changeEvent}
 */
function changeEvent( data, done ) {
  module.debug( 'changeEvent' );

  if( 'function' === typeof done ) {
    done();
  }

  return this;

}

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

  // Convert names into a single string.
  if( data.Names && data.Names.length > 0 && !data.Name  ) {
    data.Name = data.Names[0].replace( '/', '' )
  }

  // Set Domain from name if does not exist.
  data.Domain = data.Domain || data.Name;

  // Remove unused keys.
  delete data.Names;

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
