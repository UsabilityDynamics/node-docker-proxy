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
      identity: 'image',
      tableName: 'docker-image',
      connection: 'persistent',
      attributes: {
        Name: {
          type: 'string',
          primaryKey: true,
          required: false
        },
        Id: {
          type: 'string',
          required: true
        },
        Config: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        ContainerConfig: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        Created: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        Size: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        }
      },
      beforeValidate: function beforeValidate( data, done ) {
        module.debug( 'container', 'afterCreate' );

        // Convert names into a single string.
        if( data.RepoTags && data.RepoTags.length > 0 && !data.Name  ) {
          data.Name = data.RepoTags[0];
        }

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
    value: require( 'debug' )( 'docker:proxy:image' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});
