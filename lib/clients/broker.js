/**
 * Client for vBroker.
 *
 * - clearSubscriptions
 * - hasSubscriptions
 * - unsubscribe
 *
 */
Object.defineProperties( module.exports, {
  connect: {
    value: function connect( options ) {

      require('object-emitter').mixin( module );
      require('object-settings').mixin( module );

      module.options = options || module.options || {};

      module.exports.sock.connect( options.port || 16000 );

      module.exports.sock.on( 'connect',     module.exports.handleConnect );
      module.exports.sock.on( 'reconnect',   module.exports.handleReconnect );
      module.exports.sock.on( 'disconnect',  module.exports.handleDisconnect );
      module.exports.sock.on( 'message',     module.exports.handleMessage );

      return module.exports;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  handleConnect: {
    value: function handleConnect(topic, data){
      console.log( 'handleConnect' );
    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  handleReconnect: {
    value: function handleReconnect(topic, data){
      console.log( 'handleReconnect' );
    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  handleDisconnect: {
    value: function handleDisconnect(topic, data){
      console.log( 'handleDisconnect' );
    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  handleMessage: {
    value: function handleMessage(topic, data){

      ( module.exports.callbacks || [] ).forEach( function( fucker ) {
        fucker.call( null, topic, data );
      });

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  subscribe: {
    value: function subscribe( topic, callback ) {

      module.exports.sock.subscribe( topic );

      module.exports.callbacks.push( callback );

      return module.exports;

    },
    enumerable: true,
    configurable: false,
    writable: true
  },
  sock: {
    value: require('axon').socket('sub'),
    enumerable: true,
    configurable: false,
    writable: true
  },
  callbacks: {
    value: [],
    enumerable: true,
    configurable: false,
    writable: true
  },
  stop: {
    value: function stop() {

      if( module.exports.sock ) {
        module.exports.sock.stop();
      }

      return module.exports;

    },
    enumerable: true,
    configurable: false,
    writable: true
  }
});
