Object.defineProperties( module.exports, {
  findById: {
    /**
     * Find by _id Key
     *
     * @param collection
     * @param _id
     * @param cb
     */
    value: function findById(collection, _id, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {
        if( data._id === _id ) {
          cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  findByName: {
    /**
     * Find by name Key
     *
     * @param collection
     * @param _id
     * @param cb
     */
    value: function findByName(collection, name, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {
        if( data.name === name ) {
          cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  findByHost: {
    /**
     * Find by "host" key.
     *
     * @param collection
     * @param host
     * @param cb
     */
    value: function findByHost(collection, host, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {

        if( data.host === host || data.domain === host ) {
          cb.apply( null, [ data ] );
        }

        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
  findByDomain: {
    /**
     * Find by "domain" key.
     *
     * @param collection
     * @param host
     * @param cb
     */
    value: function findByDomain(collection, host, cb){
      var coll = collection.slice( 0 ); // create a clone

      (function _loop( data ) {

        data.domain = data.domain || [ data.Config.Hostname, data.Config.Domainname].join( '.' );

        console.log( data.domain, '-', host );

        if( data.domain === host ) {
          cb.apply( null, [ data ] );
        }

        else if( coll.length ) {
          setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
      }( coll.shift() ));
    },
    writable: true
  },
});

