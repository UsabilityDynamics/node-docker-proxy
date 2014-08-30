var Docker        = require('dockerode');
var events = require('eventemitter2');
  JSuck = require("jsuck");

var DockerEvents = module.exports = function DockerEvents(options) {

  events.EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    newListener: false,
    maxListeners: 20
  });

  this.docker = new Docker( options || {} );
  this.running = false;

  this.start();

  // setInterval( function recycleDocker() { service.docker.start(); }, 60000 );

};

DockerEvents.prototype = Object.create(events.EventEmitter2.prototype, {constructor: {value: DockerEvents}});

DockerEvents.create = function create( options ) {
  return new DockerEvents( options );
}

DockerEvents.prototype.start = function start() {
  var self = this;

  this.running = true;

  this.docker.getEvents(function(err, res) {

    if (err) {
      return self.emit("error", err);
    }

    self.res = res;

    self.emit("connect", null, self );

    var parser = new JSuck();

    res.pipe(parser);

    parser.on("data", function(data) {
      self.emit("_message", self.formatMessage( data ));
      self.emit(data.status, self.formatMessage( data ));
    });

    parser.on("end", function() {

      setTimeout( function reconnectDocker() {
        self.start()
      }, 1000 );


      self.emit("disconnect");
      self.res = null;

      if (self.running) {
        self.start();
      }
    });
  });

  return this;
};

DockerEvents.prototype.formatMessage = function formatMessage( data ) {

  return data;

  if( message.status === 'start' ) {

    service.app.emit( 'docker:container:start', null, {
      id: message.id,
      type: 'container',
      image: message.from,
      time: message.time
    });

  }

  if( message.status === 'stop' ) {

    service.app.emit( 'docker:container:stop', null, {
      id: message.id,
      type: 'container',
      image: message.from,
      time: message.time
    });

  }

  return data;

}

DockerEvents.prototype.stop = function stop() {
  this.running = false;

  if (this.res) {
    this.res.destroy();
  }

  return this;
};