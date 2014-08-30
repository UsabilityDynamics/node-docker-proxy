var Docker        = require('dockerode');
var ObjectEmitter = require('object-emitter');
var JSuck         = require("jsuck");
var fs            = require("fs");

var DockerEvents = module.exports = function DockerEvents(options) {

  ObjectEmitter.call(this, {
    delimiter: ':',
    throwErrors: false
  });

  options = options || {}

  if( options.socketPath && !fs.statSync( options.socketPath ).isSocket() ) {
    options.socketPath = null;
  }

  this.docker = new Docker( options );
  this.running = false;

  this.start();


  // setInterval( function recycleDocker() { service.docker.start(); }, 60000 );

};

DockerEvents.prototype = Object.create(ObjectEmitter.prototype, {constructor: {value: DockerEvents}});

DockerEvents.create = function create( options ) {
  return new DockerEvents( options );
}

DockerEvents.prototype.start = function start() {
  var self = this;

  this.running = true;

  process.nextTick( function() {
    self.emit( 'ready', null, self.docker );
  })

  this.docker.getEvents(function(err, res) {

    if (err) {
      return self.emit("error", err);
    }

    self.res = res;

    self.emit("connect", null, self );

    var parser = new JSuck();

    res.pipe(parser);

    parser.on("data", function(data) {
      self.emit( "_message", null, self._normalizeMessage( data ) );
      self.emit( data.status, null, self._normalizeMessage( data ) );
    });

    parser.on("end", function() {

      setTimeout( function reconnectDocker() {
        self.start()
      }, 1000 );

      self.emit( "disconnect", null, self );

      self.res = null;

      if (self.running) {
        self.start();
      }

    });

  });

  return this;

};

DockerEvents.prototype.stop = function stop() {
  this.running = false;

  if (this.res) {
    this.res.destroy();
  }

  return this;
};


DockerEvents.prototype._normalizeMessage = function _normalizeMessage( data ) {

  return data;

  if( message.status === 'start' ) {

    service.app.emit( 'container:start', null, {
      id: message.id,
      type: 'container',
      image: message.from,
      source: this.options.host,
      time: message.time
    });

  }

  if( message.status === 'stop' ) {

    service.app.emit( 'container:stop', null, {
      id: message.id,
      type: 'container',
      image: message.from,
      source: this.options.host,
      time: message.time
    });

  }

  return data;

}

Object.defineProperties( DockerEvents.prototype, {
  listContainers: {
    get: function() {
      return this.docker.listContainers.bind( this.docker )
    },
    enumerable: true,
    configurable: false
  },
  getEvents: {
    get: function() {
      return this.docker.getEvents.bind( this.docker )
    },
    enumerable: true,
    configurable: false
  },
  getContainer: {
    get: function() {
      return this.docker.getContainer.bind( this.docker )
    },
    enumerable: true,
    configurable: false
  },
});

