/**
 * Creates Waterline Collection for Backends
 *
 * - Schema is enabled to keep the container data stored in memory limited to only what we need.
 * - The "memory,disk" order does not write to disk but we inherit some of the methods such as createEach
 *
 */
Object.defineProperties( module, {
  exports: {
    value: {
      identity: 'container',
      tableName: 'docker-container',
      connection: [ 'memory', 'disk' ],
      pkFormat: 'string',
      migrate: 'safe', // drop, alter, safe
      autoPK: false,
      autoCreatedAt: false,
      autoUpdatedAt: true,
      schema: true,
      syncable: true,

      // Custom Types
      types: {
        observable: function(data){
          // console.log( require( 'util').inspect( observable, { colors: true , depth:5, showHidden: false } ) );
          return data;
        },
        properties: function(data) {
          return data;
        }
      },

      // Schema Attributes
      attributes: {
        Name: {
          type: 'string',
          primaryKey: true,
          unique: true,
          required: true,
          minLength: 5,
          maxLength: 100
        },
        NetworkSettings: {
          type: 'json',
          defaultsTo: {},
          required: false
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
        State: {
          type: 'json'
        },
        Volumes: {
          type: 'json'
        },
        VolumesRW: {
          type: 'json'
        },
        _backends: {
          type: 'json',
          defaultsTo: {}
          //collection: 'backend',
          //via: 'container',
          //dominant: true
        },
        _frontends: {
          type: 'array',
          defaultsTo: []
        }
      },

      // class methods
      fetchUpstream: fetchUpstream,
      stateChange: stateChange,
      remove: removeDocument,
      insert: insertDocument,
      // observeEach: observeEach,

      // lifecycle callbacks
      beforeDestroy: beforeDestroy,
      afterDestroy: afterDestroy,
      beforeValidate: beforeValidate,
      afterCreate: afterCreate,

      // @todo Add later.
      // beforeFetch: function() {},
      // afterFetch: function() {}

    },
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
function observeEach() {
  module.debug( 'observeEach' );
}

/**
 * Observe Entire Collection.
 *
 * This should be added by Adapter, this is temporary.
 *
 */
function fetchUpstream( query, callback ) {
  module.debug( 'fetchUpstream' );

  //console.log( require( 'util').inspect( this, { colors: true , depth:5, showHidden: false } ) );

  callback( null, {} );
}

/**
 *
 * @param data
 * @param done
 * @returns {stateChange}
 */
function stateChange( data, done ) {
  module.debug( 'stateChange' );

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
 * Afer Container is Removed
 *
 * - Flush all Backends.
 *
 * @param containers
 */
function afterDestroy( containers ) {
  module.debug( 'afterDestroy' );

  containers.forEach( function singleContainer( container ) {

    // console.log( 'afterDestroy', container._id );

  });

  if( 'function' === typeof arguments[1] ) {
    arguments[1].call( this, null );
  }
}

/**
 *
 * @param data
 * @param done
 */
function afterCreate( data, done ) {
  module.debug( 'afterCreate' );

  // console.log( require( 'util').inspect( data, { colors: true , depth:5, showHidden: false } ) );

  done();
}

/**
 *
 * @param data
 * @param done
 */
function beforeValidate( data, done ) {
  module.debug( 'beforeValidate' );

  var _ = require( 'lodash' );
  var _hostname;

  // Convert names into a single string.
  if( data.Names && data.Names.length > 0 && !data.Name  ) {
    data.Name = data.Names[0];
  }

  try {
    // Use container Name as a default hostname for proxying.
    _hostname = [ (data.Name || '').replace( '/', '' ), '' ].join( '.internal' )

  } catch( error ) {
    console.log( require( 'util').inspect( error, { colors: true , depth:5, showHidden: false } ) );
  }

  // data.Name = data.Names[0].replace( '/', '' )
  // Set Domain from name if does not exist.
  // data.Domain = data.Domain || data.Name;

  // This is used by Proxy to match request hostname.

  if( data.Config && data.Config.Hostname ) {
    _hostname = [ data.Config.Hostname, data.Config.Domainname ].join( '.' )
  }

  if( data.NetworkSettings && data.NetworkSettings.Ports && data.NetworkSettings.Ports ) {

    Object.keys( data.NetworkSettings.Ports ).forEach( function( key ) {

      var _data = data.NetworkSettings.Ports[ key ];

      // Skip private/internal ports
      if( _data === null ) {
        return;
      }

      var _port = key.split( '/' )[0];
      var _host = [ _hostname, _port ].join( ':' );

      data._backends[ _host ] = {
        host: _host,
        hostname: _hostname,
        port: _port,
        path: '/',
        protocol: 'http',
        target: {
          host: _.first( _data ).HostIp,
          port: _.first( _data ).HostPort,
          ws: true,
          secure: false
        }
      };

      // data._hosts.push( _host );

    });

  }

  if( ( !data.NetworkSettings || !data.NetworkSettings.Ports ) && data.Ports ) {

    data.Ports.forEach( function( backendData ) {

      var _host = [ _hostname || '', backendData.PrivatePort ].join( ':' );

      data._backends[ _host ] = {
        host: _host || '',
        hostname: _hostname || '',
        port: backendData.PrivatePort || '',
        path: '/',
        protocol: 'http',
        target: {
          host: backendData.IP,
          port: backendData.PublicPort,
          ws: true,
          secure: false
        }
      };

      // data._hosts.push( _host );

    });

    //console.log( require( 'util').inspect( data, { colors: true , depth:5, showHidden: false } ) );

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
