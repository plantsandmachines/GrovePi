var util         = require('util')
var Sensor       = require('./sensor')
var commands     = require('../../commands')
var fs = require('fs');

const i2c0Path  = '/dev/i2c-0';
const i2c1Path  = '/dev/i2c-1';
const i2c2Path  = '/dev/i2c-2';


function I2cSensor() {
  Sensor.apply(this, Array.prototype.slice.call(arguments))
}
util.inherits(I2cSensor, Sensor)
I2cSensor.prototype = new I2cSensor()

function I2CDriver () {

  if (arguments.callee._singletonInstance) {
    return arguments.callee._singletonInstance;
  }

  arguments.callee._singletonInstance = this;

  var i2cBus = require('i2c-bus');
  var busNumber;


  if (fs.existsSync(i2c0Path)) {
    busNumber = 0
  } else if (fs.existsSync(i2c1Path)) {
    busNumber = 1
  } else if (fs.existsSync(i2c2Path)) {
    busNumber = 2
  } else {
    var err = console.log('ERR: Could not determine your i2c device')
  }

  var bus = i2cBus.openSync(busNumber);
  this.getBus = function () {
    return bus;
  };
}
I2cSensor.prototype.bus = I2CDriver().getBus();


module.exports = I2cSensor