var proxy = require('redbird')({
  port: 8080,
  ssl: {
    port: 8443,
    key: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-key.pem",
    csr: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-csr.pem",
    cert: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-cert.pem",
  }
});

// Route to any global ip
proxy.register("optimalbits.com", "http://167.23.42.67:8000");

// Route to any local ip, for example from docker containers.

setTimeout( function() {
  //proxy.register("www.usabilitydynamics.com", "http://fallujah:49153", {ssl: true});

  proxy.register("sites.usabilitydynamics.com", "http://fallujah:49153" );

  proxy.register("usabilitydynamics.com/test", "http://fallujah:49153");

  proxy.register("www.usabilitydynamics.com", "http://fallujah:49153", {
    ssl: {
      port: 8443,
      redirectPort: 80,
      key: "/etc/ssl/usabilitydynamics.com",
      cert: "/etc/ssl/certs/usabilitydynamics.com",
    }
  } );

}, 100);

proxy.register("site2.com", "http://fallujah:49154");

// Route from hostnames as well as paths
proxy.register("example.com/static", "http://172.17.42.1:8002");
proxy.register("example.com/media", "http://172.17.42.1:8003");

// Subdomains, paths, everything just works as expected
proxy.register("abc.example.com", "http://172.17.42.4:8080");
proxy.register("abc.example.com/media", "http://172.17.42.5:8080");

// Route to any href including a target path
proxy.register("foobar.example.com", "http://172.17.42.6:8080/foobar");

// console.log( require( 'util').inspect( proxy.routing, { colors: true , depth:5, showHidden: false } ) );
