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
  }
});

