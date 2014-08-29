/**
 *
 *
 * DEBUG=connect-proxy-models:server mocha
 *
 * ### Lifescyle Callbacks
 * - beforeValidate
 * - afterValidate
 * - afterCreate
 * - beforeUpdate
 * - afterUpdate
 * - beforeDestroy
 * - afterDestroy
 *
 * ### Instance Methods
 *
 * - start
 * - stop
 * - use
 *
 */
Object.defineProperties( module, {
  exports: {
    value: require( 'waterline' ).Collection.extend({
      identity: 'server',
      tableName: 'node-server',
      connection: 'persistent',
      schema: true,
      attributes: {
        title: {
          type: 'string',
          required: false
        },
        status: {
          type: 'string',
          required: false
        },
        address: {
          type: 'string',
          required: false
        },
        port: {
          type: 'number',
          required: false
        },
        options: {
          type: 'json'
        },
        start: function start( callback ) {
          module.debug( 'start [title=%s]', this.title );

          var server = this;

          server.app = require('express')();

          server.__middleware = server.__middleware || [];

          server.app.use.apply( server.app, server.__middleware ).listen( server.port, server.address, function serverCreated() {
            module.debug( 'Server started using [%d] middleware and http://%s:%d', server.__middleware.length, this.address().address, this.address().port );

            server.app.__server = this;

            server.app.set( 'server', {
              port: this.address().port,
              address: this.address().address
            });

            if( 'function' === typeof callback ) {
              callback.call( server.app )
            }

          });

          // @chianable
          return this;

        },
        stop: function stop( done ) {
          module.debug( 'stop [title=%s]', this.title );

          if( this.app && this.app.__server && this.app.__server.close ) {
            this.app.__server.close();
          }

          done();

          // chainable
          return this;
          
        },
        use: function use( middleware ) {
          module.debug( 'use [title=%s]', this.title, middleware && middleware.name ? middleware.name : null );

          this.__middleware = this.__middleware || [];

          this.__middleware.push( middleware );

          // @chainable
          return this;
          
        },
        toJSON: function toJSON() {
          var plainObject = this.toObject();
          delete plainObject.__server;
          delete plainObject.__middleware;
          return plainObject;
        }
      },
      beforeValidate: function beforeValidate( data, done ) {
        module.debug( ':beforeValidate [title=%s]', data.title );
        done();
      },
      afterValidate: function afterValidate( data, done ) {
        module.debug( ':afterValidate [title=%s]', data.title );
        done();
      },
      beforeCreate: function beforeCreate( data, done ) {
        module.debug( ':beforeCreate [title=%s]', data.title );
        done();
      },
      afterCreate: function afterCreate( data, done ) {
        module.debug( ':afterCreate [title=%s]', data.title );
        done();
      },
      beforeUpdate: function beforeUpdate( data, done ) {
        module.debug( ':beforeUpdate [title=%s]', data.title );
        done();
      },
      afterUpdate: function afterUpdate( data, done ) {
        module.debug( ':afterUpdate [title=%s]', data.title );
        done();
      },
      beforeDestroy: function beforeDestroy( data, done ) {
        module.debug( ':beforeDestroy [title=%s]', data.title );
        done();
      },
      afterDestroy: function afterDestroy( data, done ) {
        module.debug( ':afterDestroy [title=%s]', data.title );
        done();
      }
    }),
    enumerable: true,
    configurable: true,
    writable: true
  },
  version: {
    value: 1.0,
    enumerable: true,
    configurable: true,
    writable: false
  },
  debug: {
    value: require( 'debug' )( 'docker:proxy:model:server' ),
    enumerable: true,
    configurable: true,
    writable: false
  }
});