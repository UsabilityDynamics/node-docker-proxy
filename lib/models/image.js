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
      connection: [ 'memory' ],
      attributes: {
        name: {
          type: 'string',
          required: false,
          minLength: 5,
          maxLength: 100
        },
        hostname: {
          type: 'string',
          required: true,
          minLength: 5,
          maxLength: 100
        },
        backend: {
          type: 'json'
        },
        config: {
          type: 'json'
        },
        priority: {
          type: 'integer'
        }
      },
      afterCreate: function afterCreate() {
        module.debug( 'container', 'afterCreate' );
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
