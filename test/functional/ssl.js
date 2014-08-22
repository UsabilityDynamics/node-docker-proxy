/**
 * Test Shared Veneer.io Service APIs
 *
 */
module.exports = {

  /**
   * Prepare Request Client and Shared Validation Method(s).
   *
   */
  before: function() {

    this.request = require( 'request' ).defaults({
      json: true
    });

    this.seemsValid = function seemsValid( backend, done ) {

      return function validateResponse( error, res, body ) {

        if( !error || !body ) {
          console.log( body );
        }

        if( res.headers[ 'x-system' ] != backend ) {
          return done( new Error( 'Backend does not match' ) );
        }

        //body.should.have.properties( 'ok', 'message' );
        //res.headers[ 'x-server' ].should.equal( 'docker-proxy/v3' );

        done();
      }

    }

  },

  "basic proxy works": {
    'usabilitydynamics.com': function( done ) { this.request( 'http://usabilitydynamics.com', this.seemsValid( 'wpCloud', done ) ); },
    'www.usabilitydynamics.com': function( done ) { this.request( 'http://www.usabilitydynamics.com', this.seemsValid( 'wpCloud', done ) ); }
  },

  "backends work": {
    'wpCloud.net': function( done ) { this.request( 'http://wpCloud.net', this.seemsValid( 'wpCloud', done ) ); },
    'dodApps.net': function( done ) { this.request( 'http://dodApps.net', this.seemsValid( 'dodApps', done ) ); }
  },

  "SSL works": {
    //'www.usabilitydynamics.com': function( done ) { this.request( 'https://www.usabilitydynamics.com', this.seemsValid( 'wpCloud', done ) ); },
    //'www.tandemproperties.com': function( done ) { this.request( 'http://tandemproperties.com', this.seemsValid( 'wpCloud', done ) ); }
  }

};