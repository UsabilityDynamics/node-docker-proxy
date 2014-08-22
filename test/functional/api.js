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

    this.veneerPowered = function veneerPowered( done ) {

      return function validateResponse( error, res, body ) {
        body.should.have.properties( 'ok', 'message' );
        res.headers.should.have.properties( 'x-server', 'x-powered-by', 'x-status' );
        res.headers[ 'x-server' ].should.equal( 'veneer.io/v2' );
        res.headers[ 'x-powered-by' ].should.equal( 'veneer.io' );
        done();
      }

    }

  },

  "Veneer Proxy APIs": {

    'test': function( done ) {
      done();
    }

  }

};