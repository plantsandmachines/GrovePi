//var GrovePi = require('node-grovepi').GrovePi;
var fs = require('fs');

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



  //Hardware

  drv.setMotors = function( newMotors ){
    console.log( 'setting motors!', newMotors);
    i2cBus.openPromisified(busNumber).then(function(i2c1) {

      drv.i2c1 = i2c1;
      //var toDo;
      if (( newMotors[MOTOR1].direction !== undefined && newMotors[MOTOR1].direction != motors[MOTOR1].direction) || (newMotors[MOTOR2].direction !== 'undefined' && newMotors[MOTOR2].direction != motors[MOTOR2].direction )) {
        if (newMotors[MOTOR1].direction == 1 && newMotors[MOTOR2].direction == 1) {
          //toDo = function (cb) {
          console.log(' got correct motor, actually publishing direction change BothClockWise');
            drv.i2c1.writeByte(drv.address, DirectionSet, BothClockWise);
        } else if (newMotors[MOTOR1].direction == 1 && newMotors[MOTOR2].direction == -1) {
          //toDo = function (cb) {
          console.log(' got correct motor, actually publishing direction change M1CWM2ACW');
            drv.i2c1.writeByte(drv.address, DirectionSet, M1CWM2ACW);
        } else if (newMotors[MOTOR1].direction == -1 && newMotors[MOTOR2].direction == 1) {
          //toDo = function (cb) {
          console.log(' got correct motor, actually publishing direction change M1ACWM2CW');
            drv.i2c1.writeByte(drv.address, DirectionSet, M1ACWM2CW);
        } else if (newMotors[MOTOR1].direction == -1 && newMotors[MOTOR2].direction == -1) {
          //toDo = function (cb) {
          console.log(' got correct motor, actually publishing direction change BothAntiClockWise');
            drv.i2c1.writeByte(drv.address, DirectionSet, BothAntiClockWise);
        }
      }

      //if (toDo !== undefined) {

        //async.retry({times: 3, interval: 200}, toDo, function (err, result) {

      console.log('did set the direction of the motors.');
      motors[MOTOR1].direction = newMotors[MOTOR1].direction;
      motors[MOTOR2].direction = newMotors[MOTOR2].direction;

      //var setStuff = [];
      if (newMotors[MOTOR1].speed !== undefined && newMotors[MOTOR1].speed != motors[MOTOR1].speed) {
          drv.set(MOTOR1, newMotors[MOTOR1].speed);
      }
      if (newMotors[MOTOR2].speed !== undefined && newMotors[MOTOR2].speed != motors[MOTOR2].speed) {
          drv.set(MOTOR2, newMotors[MOTOR2].speed);
      }
          //console.log('trying to set the speed of the motors. things to set: ' + setStuff.length);

          //async.series(setStuff, function () {
          //  console.log('did set motors');
          //})

        //});
      //} else {
      //  var setStuff = [];
      //  if (newMotors[MOTOR1].speed !== undefined && newMotors[MOTOR1].speed != motors[MOTOR1].speed) {
      //    setStuff.push(function (cb) {
      //      drv.set(MOTOR1, newMotors[MOTOR1].speed, cb);
      //    });
      //  }
      //  if (newMotors[MOTOR2].speed !== undefined && newMotors[MOTOR2].speed != motors[MOTOR2].speed) {
      //    setStuff.push(function (cb) {
      //      drv.set(MOTOR2, newMotors[MOTOR2].speed, cb);
      //    });
      //  }
      //  console.log('trying to set the speed of the motors. things to set: ' + setStuff.length);
      //  async.series(setStuff, function () {
      //    console.log('did set motors');
      //  })
      //}
    },function(err){
      console.log(' cought error on open bus for '+drv.address,err);
    }).then(function(){
      drv.i2c1.close();
    },function(err){
      console.log(' cought error on setMotors:',err);
    })

  };

  drv.setDirection = function(channelNr, direction, callback) {
    if ( channelNr != MOTOR1 && channelNr != MOTOR2 ){
      return;
    }
    console.log(' got correct motor, actually publishing');

    var newMotors = JSON.parse(JSON.stringify(motors));
    newMotors[channelNr].direction = direction;
    drv.setMotors(newMotors);
  };

  drv.set = function(channelNr, value, callback){
    if ( channelNr != MOTOR1 && channelNr != MOTOR2 ){
      return;
    }

    //i2cBus.openPromisified(busNumber).then(function(i2c1) {

      //drv.i2c1 = i2c1;
      console.log(' got correct motor and a bus, actually setting speed');
      var newMotors = JSON.parse(JSON.stringify(motors));
      newMotors[channelNr].speed = Math.max(0, Math.min(255, value));
      drv.i2c1.writeWord(drv.address, MotorSpeedSet, newMotors[MOTOR2].speed * 256 + newMotors[MOTOR1].speed);
  };

  drv.getMotors = function(){
    return motors;
  };


  // Function used by PaM Interface
  drv.send = drv.setMotors;
  drv.read = drv.getMotors;

  // reset everything

  var reset = function(){
    i2cBus.openPromisified(busNumber).then(function(i2c1) {
      drv.i2c1 = i2c1;
      drv.i2c1.writeByte(drv.address, DirectionSet, BothClockWise);
    },function(err){
      console.log(' cought error on open bus for reset at'+drv.address,err);
    }).then(function(){
      drv.i2c1.writeWord(drv.address, MotorSpeedSet, 0);
    },function(err){
      console.log(' cought error on reset speed '+ drv.address,err);
    }).then(function(){
      drv.i2c1.close();
    },function(err){
      console.log(' cought error close after reset:'+ drv.address,err);
    })
  };
  console.log(' reset board at address '+ drv.address);
}

I2CMotorDriver.prototype = new I2CSensor();

//I2CMotorDriver.prototype.read = function(){
//  return this.getMotors();
//};

module.exports = I2CMotorDriver;
