/**
 * Creates Waterline Collection for Backends
 *
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
      connection: 'persistent',
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
      beforeDestroy: beforeDestroy,
      beforeValidate: beforeValidate,
      afterCreate: afterCreate
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:container' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});


function beforeDestroy( data, done ) {
  module.debug( 'container', 'beforeDestroy' );
  done();
}

function afterCreate( data, done ) {
  module.debug( 'container', 'afterCreate' );
  done();
}

function beforeValidate( data, done ) {
  module.debug( 'container', 'beforeValidate' );

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

