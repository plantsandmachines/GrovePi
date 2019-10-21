// TODO: call disable function on exit
var DigitalSensor = require('./base/digitalSensor')
var commands     = require('../commands')

function EncoderDigitalSensor(pin) {
  DigitalSensor.apply(this, Array.prototype.slice.call(arguments))
}
EncoderDigitalSensor.prototype = new DigitalSensor()

var lastSignal = 1;

EncoderDigitalSensor.prototype.read = function() {
  var write = this.board.writeBytes(commands.dRead.concat([this.pin, commands.unused, commands.unused]))
  if (write) {
    this.board.wait(100)
    this.board.readByte()
    var bytes = this.board.readBytes()

    //console.log('Encoder test' ,bytes instanceof Buffer, bytes[0],bytes[1],lastSignal != bytes[0]);
    if (lastSignal != bytes[0]){
      lastSignal = bytes[0];
      return true;
    }
    else {
      return false
    }
  } else {
    console.log( ' encoder write of "read" command failed');
    return false
  }
}
EncoderDigitalSensor.prototype.enable = function() {
  var write = this.board.writeBytes(commands.encoderEn.concat([commands.unused, commands.unused, commands.unused]))
  if (write) {
    console.log('wrote enable of encoder')
    this.board.wait(200);
    return true
  } else {
    console.log('could not write enable of encoder')
    return false
  }
}
EncoderDigitalSensor.prototype.disable = function() {
  var write = this.board.writeBytes(commands.encoderDis.concat([commands.unused, commands.unused, commands.unused]))
  if (write) {
    this.board.wait(200);
    return true
  } else {
    return false
  }
}


module.exports = EncoderDigitalSensor