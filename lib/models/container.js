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
      connection: [ 'memory', 'disk' ], // @todo change this to actual adapter once we figure out what we want to use.
      pkFormat: 'string',
      migrate: 'safe', // drop, alter, safe
      autoPK: false,
      autoCreatedAt: false,
      autoUpdatedAt: true,
      schema: true,
      syncable: true,
      types: {
        observable: function(data){
          console.log( require( 'util').inspect( observable, { colors: true , depth:5, showHidden: false } ) );
          return data;
        },
        properties: function(data) {
          return data;
        }
      },
      attributes: {
        Name: {
          type: 'string',
          primaryKey: true,
          //unique: true,
          required: true,
          minLength: 5,
          maxLength: 100
        },
        Id: {
          type: 'string',
          columnName: '_id',
          unique: true,
          required: false
        },
        Command: {
          type: 'string',
          required: false
        },
        MountLabel: {
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
        NetworkSettings: {
          type: 'json',
          defaultsTo: {},
          required: false
        },
        HostConfig: {
          type: 'json'
        },
        Config: {
          type: 'object',
          attributes: {
            Env: 'array',
            ExposedPorts: 'json',
            Hostname: 'string',
            WorkingDir: 'string',
            NetworkDisabled: 'boolean',
            Volumes: 'json',
            Domainname: 'string',
          },
          required: false
        },
        Path: {
          type: 'string',
          required: false,
          defaultsTo: "/",
          minLength: 1,
          maxLength: 200
        },
        State: {
          type: 'json'
        },
        Volumes: {
          type: 'json'
        },
        VolumesRW: {
          type: 'json'
        },
        Backend: {
          type: 'json',
          defaultsTo: {
            hostname: null
          },
          properties: {
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
            }
          }
        }
      },

      // class methods
      observe: observeCollection,
      remove: removeDocument,
      insert: insertDocument,
      changeEvent: changeEvent,

      // lifecycle callbacks
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
    data.Name = data.Names[0];
  }

  //data.Name = data.Names[0].replace( '/', '' )

  // Set Domain from name if does not exist.
  // data.Domain = data.Domain || data.Name;

  // This is used by Proxy to match request hostname.
  if( data.Config ) {
    data.Backend.Hostname = [ data.Config.Hostname, data.Config.Domainname ].join( '' )
  }

  if( data.HostConfig && data.HostConfig.PortBindings ) {

    Object.keys( data.HostConfig.PortBindings ).forEach( function( key ) {

      //data.Backend.portBindings = data.HostConfig.PortBindings[ key ];

      //data.Backend.portBindings[key].backendPort = key.split( '/' )[0];
      //data.Backend.portBindings[key].protocol = key.split( '/' )[1];

      // console.log( 'data.Backend', data.Backend );


    });

  }


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
