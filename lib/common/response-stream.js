/**
 * Custom Response Stream Handler.
 *
 * @param callback
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function responseStream( callback, req, res, next ) {

  var StreamHandler = require( 'stream' ).PassThrough();

  StreamHandler.setHeader = function setHeader( key, value ) {
    // console.log( 'StreamHandler.setHeader', key, value );
    req.set( key, value );
  };

  StreamHandler.writeHead = function writeHead( status ) {
    // console.log( 'StreamHandler.writeHead', status );
    req.status = status;
  };

  StreamHandler.on( 'data', function onData( chunk ) {
    ( this.__build = this.__build || [] ).push(  chunk.toString() )
  });

  StreamHandler.on( 'end', function onEnd() {
    // console.log( 'StreamHandler:end' );

    // Assemble body.
    req.body = this.__build.join( '' );

    // Try to format JSON.
    try { req.body = JSON.parse( req.body ); } catch( error ) {
      // console.error( 'Unable to parse response.', req.url );
    }

    // Use custom callback.
    if( 'function' === typeof callback ) {
      return callback( req, res, next );
    }

    // No callback given, send.
    res.send( req.status, req.body );

  });

  return StreamHandler;
}

Object.defineProperties( module.exports = responseStream, {
  create: {
    value: function create( callback, req, res, next ) {
      return new responseStream( callback, req, res, next );
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});