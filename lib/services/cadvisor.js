/**
 * cadvisor API gateway
 *
 *  sudo docker run \
 *    --volume=/var/run:/var/run:rw \
 *    --volume=/sys:/sys:ro \
 *    --volume=/var/lib/docker/:/var/lib/docker:ro \
 *    --publish=8080 \
 *    --detach=true \
 *    --name=cadvisor \
 *    google/cadvisor:latest
 *
 */
require( '../docker-proxy' ).service( function serviceHandler( error, service ) {

  this.settings.set({
    name: 'cadvisor',
    cluster: false
  });

  var cadvisor = require('cadvisor')
  var backend = cadvisor('208.52.164.203:49156')

  // get machine information
  backend.machine(function(err, data){
    // console.log( require( 'util').inspect( data, { colors: true , depth:5, showHidden: false } ) );
  })

  // get top level
  backend.container('/', function(err, data){
    // console.log( require( 'util').inspect( data, { colors: true , depth:5, showHidden: false } ) );
  })

  // get docker containers
  backend.container('/system.slice', function(err, data){
    // console.log( require( 'util').inspect( data, { colors: true , depth:1, showHidden: false } ) );
  })

  // get a specific docker container information
  backend.container('/docker/mycontainer', function(err, data){
    //console.log( 'machine.mycontainer', err || data  );

  })


}, module );
