/**
 * Start Docker Proxy
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {
  this.debug( 'serviceHandler', 'Router' );

  service.settings.set({
    name: 'proxy',
    cluster: true
  });

  var proxy = require('redbird')({
    port: 8080,
    ssl: {
      port: 8443,
      key: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-key.pem",
      csr: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-csr.pem",
      cert: "/Users/andy.potanin/Libraries/docker-proxy/static/etc/ssl/dev-cert.pem",
    }
  }, proxyListening );

  service.once( 'ready', function () {
    service.log.info( 'Docker Proxy Router fully loaed.' );

    proxy.register("sites.usabilitydynamics.com", "http://fallujah:49169" );
    proxy.register("usabilitydynamics.com/test", "http://fallujah:49168");
    proxy.register("www.usabilitydynamics.com", "http://fallujah:49169", {
      ssl: {
        key: "/etc/ssl/usabilitydynamics.com",
        cert: "/etc/ssl/certs/usabilitydynamics.com",
      }
    } );
    proxy.register("usabilitydynamics.com", "http://fallujah:49168");
    proxy.register("site1.com", "http://fallujah:49160");
    proxy.register("site2.com", "http://fallujah:49160");
    proxy.register("www.site1.com", "http://fallujah:49160");
    proxy.register("www.site2.com", "http://fallujah:49160");
    proxy.register("example.com/static", "http://172.17.42.1:8002");
    proxy.register("example.com/media", "http://172.17.42.1:8003");
    proxy.register("abc.example.com", "http://172.17.42.4:8080");
    proxy.register("abc.example.com/media", "http://172.17.42.5:8080");
    proxy.register("foobar.example.com", "http://172.17.42.6:8080/foobar");

  });

  function proxyListening( error, server ) {
    service.log.info( 'Load balancer web server started on %s:%s.', server.address().address, server.address().port );
  }

}, module );
