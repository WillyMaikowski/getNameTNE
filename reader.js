#!/usr/bin/node
var pcsc = require( 'pcsclite' );


pcsc = pcsc();
pcsc.on( 'error', function( err ) { console.log( 'PCSC error', err ); } );
pcsc.on( 'reader', function( reader ) {
  console.log( reader.name, 'conectado :)' );

  reader.on( 'error', function(err) { console.log( this.name, 'error', err ); } );
  reader.on( 'end', function() { console.log( this.name, 'desconectado :(' ); } );
  reader.on( 'status', function( status ) {
    //console.log( this.name, 'cambio status...' );
    var changes = this.state ^ status.state;
    if( ! changes ) return;

    if( ( changes & this.SCARD_STATE_EMPTY ) && ( status.state & this.SCARD_STATE_EMPTY ) ) {
      //console.log( this.name, "sin tarjeta :|" );
      reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) { if( err ) console.log( reader.name, "error", err ); } );

    } else if( ( changes & this.SCARD_STATE_PRESENT ) && ( status.state & this.SCARD_STATE_PRESENT ) ) {
      //console.log( this.name, "nueva tarjeta :O" );

      reader.connect( {share_mode: this.SCARD_SHARE_SHARED}, function( err, protocol ) {
        if( err ) return console.log( reader.name, 'error al conectar', err );

        reader._protocol = protocol;

        // apagamos beep de proximidad de tarjeta ya que confunde
        // todo: que se haga en el onconnect
        reader.transmit( new Buffer( [0xFF, 0x00, 0x52, 0x00, 0x00] ), 40, protocol, function() {} );
        
        //Load Auth Keys
        reader.transmit( new Buffer( [0xFF, 0x82, 0x00, 0x00, 0x06, 0x32, 0xAC, 0x3B, 0x90, 0xAC, 0x13] ), 88, protocol, function() {} );
        //Auth Data Bytes
        reader.transmit( new Buffer( [0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00, 0x0C, 0x60, 0x00] ), 80, protocol, function() {} );
        //Read Binary Blocks
        reader.transmit( new Buffer( [0xFF, 0xB0, 0x00, 0x0C, 0x10] ), 40, protocol, function( err, data ) { 
          if( err ) return console.log( 'error al leer la tarjeta', err );
          var str = data.toString().substring( 0, 15 ).split("").reverse().join("");
          console.log( str );
        } );

      } );
    }
  } );
} );

