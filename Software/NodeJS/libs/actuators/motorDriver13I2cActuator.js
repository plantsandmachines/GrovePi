//var GrovePi = require('node-grovepi').GrovePi;
var fs = require('fs');

var sleep = require('sleep');
var I2CSensor = require('../sensors/base/i2cSensor');
var async = require('async');
const DRIVER_ADDR = 0x0f;

const i2c0Path  = '/dev/i2c-0';
const i2c1Path  = '/dev/i2c-1';
const i2c2Path  = '/dev/i2c-2';

/******I2C command definitions*************/
const MotorSpeedSet   = 0x82;
const PWMFrequenceSet = 0x84;
const DirectionSet    = 0xaa;
const MotorSetA       = 0xa1;
const MotorSetB       = 0xa5;
const Nothing         = 0x01;

/**************Motor Direction***************/
const BothClockWise     = 0x0a;
const BothAntiClockWise = 0x05;
const M1CWM2ACW         = 0x06;
const M1ACWM2CW         = 0x09;

/**************Motor ID**********************/
const MOTOR1 =  1;
const MOTOR2 =  2;


function I2CMotorDriver( i2cAddress ){
  var i2cBus = require('i2c-bus');

  var drv = this;
  I2CSensor.apply(drv,Array.prototype.slice.call(arguments));
  drv.data = {};

  drv.initialized = false;
  drv.bus = null;
  // Bus Address from i2cdetect command
  if ( i2cAddress ){
    drv.address = parseInt(i2cAddress);
  } else {
    drv.address = DRIVER_ADDR;
  }
  var busNumber;
  drv.address = DRIVER_ADDR;
  var motors = {
    1: {speed: 0, direction: 1},
    2: {speed: 0, direction: 1}
  };

  if (fs.existsSync(i2c0Path)) {
    busNumber = 0
  } else if (fs.existsSync(i2c1Path)) {
    busNumber = 1
  } else if (fs.existsSync(i2c2Path)) {
    busNumber = 2
  } else {
    var err = console.log('ERR: Could not determine your i2c device')
  }

  drv.i2c1 = i2cBus.openSync(busNumber);

  //Hardware

  drv.setMotors = function( newMotors ){
    motors = newMotors;
    var toDo;
    if (motors[MOTOR1].direction == 1 && motors[MOTOR2].direction == 1) {
      toDo = function(cb, result) {drv.i2c1.writeByteSync(drv.address, DirectionSet, BothClockWise);cb()};
    } else if (motors[MOTOR1].direction == 1 && motors[MOTOR2].direction == -1) {
      toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, M1CWM2ACW);cb()};
    } else if (motors[MOTOR1].direction == -1 && motors[MOTOR2].direction == 1) {
      toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, M1ACWM2CW);cb()};
    } else if (motors[MOTOR1].direction == -1 && motors[MOTOR2].direction == -1) {
      toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, BothAntiClockWise);cb()};
    }
    async.retry({times: 3, interval: 200}, toDo, function(err, result) {
      sleep.usleep(100000);
    });
  };

  drv.send = drv.setMotors;

  drv.setDirection = function(channelNr, direction) {
    if ( channelNr != MOTOR1 && channelNr != MOTOR2 ){
      return;
    }

    motors[channelNr].direction = direction;

    console.log(' got correct motor, actually publishing');

    drv.setMotors(motors);
  };

  drv.set = function(channelNr, value){
    if ( channelNr != MOTOR1 && channelNr != MOTOR2 ){
      return;
    }
    motors[channelNr].speed = Math.max(0,Math.min(255,value));
    console.log(' got correct motor, actually setting speed');
    var toDo =
      function (cb) {
        //shifts the motor2 value 2 characters to the left, sending a 4 character hexa value
        drv.i2c1.writeWordSync(drv.address,MotorSpeedSet, motors[MOTOR2].speed * 256 + motors[MOTOR1].speed );
        cb();
      };


    async.retry({times: 3, interval: 200}, toDo, function(err, result) {
      sleep.usleep(100000);
    });

  };

  drv.setDirection(MOTOR1,1);

  console.log('motors:',motors);
  drv.getMotors = function(){
    return motors;
  };


}

I2CMotorDriver.prototype = new I2CSensor();

I2CMotorDriver.prototype.read = function(){
  return this.getMotors();
};

module.exports = I2CMotorDriver;
