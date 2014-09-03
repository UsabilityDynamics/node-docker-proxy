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
    value: {
      identity: 'image',
      tableName: 'docker-image',
      connection: [ 'docker' ], // @todo change this to actual adapter once we figure out what we want to use.
      autoPK: false,
      autoCreatedAt: false,
      autoUpdatedAt: true,
      schema: true,
      syncable: true,

      config: {
        resource: 'image'
      },

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
          type: 'json',
          required: false
        },
        Created: {
          type: 'string',
          required: false,
          minLength: 1,
          maxLength: 100
        },
        Size: {
          type: 'integer',
          required: false
        },
        VirtualSize: {
          type: 'integer',
          required: false
        },
      },
      beforeValidate: beforeValidate
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:model:image' ),
    enumerable: true,
    configurable: true,
    writable: true
  }
});

function beforeValidate( data, done ) {
  module.debug( 'afterCreate' );

  // Convert names into a single string.
  if( data.RepoTags && data.RepoTags.length > 0 && !data.Name  ) {
    data.Name = data.RepoTags[0];
  }

  delete data.RepoTags;

  done();

}