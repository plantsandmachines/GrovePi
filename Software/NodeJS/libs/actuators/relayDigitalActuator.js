var DigitalSensor = require('../sensors/base/digitalSensor')
var commands     = require('../commands')

function RelayDigitalActuator(pin) {
  DigitalSensor.apply(this, Array.prototype.slice.call(arguments))
}
RelayDigitalActuator.prototype = new DigitalSensor()

RelayDigitalActuator.prototype.enable = function() {
  var write = this.board.writeBytes(commands.dWrite.concat([this.pin, 1, commands.unused]))
  if (write) {
    this.board.wait(200)
    return true
  } else {
    return false
  }
}
RelayDigitalActuator.prototype.disable = function() {
  var write = this.board.writeBytes(commands.dWrite.concat([this.pin, 0, commands.unused]))
  if (write) {
    this.board.wait(200)
    return true
  } else {
    return false
  }
}
RelayDigitalActuator.prototype.set = function ( enable ){
  if ( enable ){
    return this.enable();
  } else {
    return this.disable();
  }
}

// used by Pam Software
RelayDigitalActuator.prototype.send = RelayDigitalActuator.prototype.set;

module.exports = RelayDigitalActuator