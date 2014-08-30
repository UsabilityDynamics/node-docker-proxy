console.log( 'Balancer Service' );
var express = require("express")
var clusterMaster = require("../../common/cluster")

clusterMaster({
  exec: __dirname + "/worker.js",
  size: 2,
  env: process.env,
  args: process.argv,
  silent: false,
  repl: false,
  signals: true
})

// Messages from Daemon Master
process.on( 'message', function processMessage(m, server) {
  // console.log( require( 'util').inspect( m, { colors: true , depth:5, showHidden: false } ) );

  if( m.cmd ) {

    // graceful shutdown
    if( m.cmd === 'shutdown' ) {
      clusterMaster.quit()
    }

    if( m.cmd === 'resizeService' ) {
      console.log( 'LB:resizeService' );

      clusterMaster.resize( m.size || 1, function() {
        console.log( 'resize cb', arguments );
      });

    }

    if( m.cmd === 'restart' ) {
      clusterMaster.restart()
    }

    if( m.cmd === 'die' ) {
      clusterMaster.quitHard()
    }

  }
});
