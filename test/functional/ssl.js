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

    this.looksValid = function looksValid( backend, done ) {

      return function validateResponse( error, res, body ) {

        if( !error || !body ) {
          console.log( body );
        }

        if( res.headers[ 'x-system' ] != backend ) {
          return done( new Error( 'Backend does not match' ) );
        }

        //body.should.have.properties( 'ok', 'message' );
        //res.headers[ 'x-server' ].should.equal( 'veneer/v3' );
        done();
      }

    }

  },

  "basic proxy works": {
    'usabilitydynamics.com': function( done ) { this.request( 'http://usabilitydynamics.com', this.looksValid( 'wpCloud', done ) ); },
    'www.usabilitydynamics.com': function( done ) { this.request( 'http://www.usabilitydynamics.com', this.looksValid( 'wpCloud', done ) ); },
    'www.tandemproperties.com': function( done ) { this.request( 'http://tandemproperties.com', this.looksValid( 'wpCloud', done ) ); },
    'www.dodapps.com': function( done ) { this.request( 'http://www.dodapps.com', this.looksValid( 'dodApps', done ) ); },
    'dodapps.com': function( done ) { this.request( 'http://dodapps.com', this.looksValid( 'dodApps', done ) ); },
  },

  "backends work": {
    'wpCloud.net': function( done ) { this.request( 'http://wpCloud.net', this.looksValid( 'wpCloud', done ) ); },
    'dodApps.net': function( done ) { this.request( 'http://dodApps.net', this.looksValid( 'dodApps', done ) ); }
  },

  "SSL works": {
    //'usabilitydynamics.com': function( done ) { this.request( 'https://usabilitydynamics.com', this.looksValid( 'wpCloud', done ) ); },
    //'www.usabilitydynamics.com': function( done ) { this.request( 'https://www.usabilitydynamics.com', this.looksValid( 'wpCloud', done ) ); },
    //'www.tandemproperties.com': function( done ) { this.request( 'http://tandemproperties.com', this.looksValid( 'wpCloud', done ) ); },
    'dodapps.com': function( done ) { this.request( 'https://www.dodapps.com', this.looksValid( 'dodApps', done ) ); },
    //'cp.dodapps.com': function( done ) { this.request( 'https://cp.dodapps.com', this.looksValid( 'wpCloud', done ) ); },
    //'dodapps.com': function( done ) { this.request( 'https://dodapps.com', this.looksValid( 'wpCloud', done ) ); },
  }

};