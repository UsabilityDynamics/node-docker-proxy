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
      connection: [ 'memory' ],
      attributes: {
        Id: {
          type: 'string',
          primaryKey: true,
          required: false
        },
        Name: {
          type: 'string',
          required: false,
          minLength: 5,
          maxLength: 100
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
          type: 'string',
          required: false
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
      beforeCreate: function beforeCreate( data, done ) {
        module.debug( 'container', 'afterCreate' );

        // Convert names into a single string.
        if( data.Names && data.Names.length > 0 && !data.Name  ) {
          data.Name = data.Names[0].replace( '/', '' )
        }

        // Set Domain from name if does not exist.
        data.Domain = data.Domain || data.Name;

        // Remove unused keys.
        delete data.Names;

        done();

      },
      afterCreate: function afterCreate( data, done ) {
        module.debug( 'container', 'afterCreate' );
        done();
      }
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
