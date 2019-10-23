//var GrovePi = require('node-grovepi').GrovePi;
var sleep = require('sleep');
var I2CSensor = require('../sensors/base/i2cSensor');
var async = require('async');
const DRIVER_ADDR = 0x0f;

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

  drv.i2c1 = drv.getBus();

  //Hardware
  var motors = {
    1: {speed: 0, direction: 1},
    2: {speed: 0, direction: 1}
  };
  drv.setMotors = function( newMotors ){
    console.log( 'setting motors!', newMotors);
    var toDo;
    if ( ( newMotors[MOTOR1].direction !== undefined && newMotors[MOTOR1].direction != motors[MOTOR1].direction) || (newMotors[MOTOR2].direction !== 'undefined' && newMotors[MOTOR2].direction != motors[MOTOR2].direction )){
      if (newMotors[MOTOR1].direction == 1 && newMotors[MOTOR2].direction == 1) {
        toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, BothClockWise);sleep.usleep(100000);cb()};
      } else if (newMotors[MOTOR1].direction == 1 && newMotors[MOTOR2].direction == -1) {
        toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, M1CWM2ACW);sleep.usleep(100000);cb()};
      } else if (newMotors[MOTOR1].direction == -1 && newMotors[MOTOR2].direction == 1) {
        toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, M1ACWM2CW);sleep.usleep(100000);cb()};
      } else if (newMotors[MOTOR1].direction == -1 && newMotors[MOTOR2].direction == -1) {
        toDo = function(cb) {drv.i2c1.writeByteSync(drv.address, DirectionSet, BothAntiClockWise);sleep.usleep(100000);cb()};
      }
    }

    if ( toDo !== undefined ){
      console.log('trying to set the direction of the motors.;');
      async.retry({times: 3, interval: 200}, toDo, function(err, result) {

        console.log('did set the direction of the motors.');
        motors[MOTOR1].direction = newMotors[MOTOR1].direction;
        motors[MOTOR2].direction = newMotors[MOTOR2].direction;

        var setStuff = [];
        if ( newMotors[MOTOR1].speed !== undefined && newMotors[MOTOR1].speed != motors[MOTOR1].speed ){
          setStuff.push( function(cb){
            drv.set(MOTOR1,newMotors[MOTOR1].speed, cb);
          });
        }
        if ( newMotors[MOTOR2].speed !== undefined && newMotors[MOTOR2].speed != motors[MOTOR2].speed ){
          setStuff.push( function(cb){
            drv.set(MOTOR2,newMotors[MOTOR2].speed, cb);
          });
        }
        console.log('trying to set the speed of the motors. things to set: ' + setStuff.length);
        async.series(setStuff, function(){
          console.log( 'did set motors');
        })
      });
    } else {
      var setStuff = [];
      if ( newMotors[MOTOR1].speed !== undefined && newMotors[MOTOR1].speed != motors[MOTOR1].speed ){
        setStuff.push( function(cb){
          drv.set(MOTOR1,newMotors[MOTOR1].speed, cb);
        });
      }
      if ( newMotors[MOTOR2].speed !== undefined && newMotors[MOTOR2].speed != motors[MOTOR2].speed ){
        setStuff.push( function(cb){
          drv.set(MOTOR2,newMotors[MOTOR2].speed, cb);
        });
      }
      console.log('trying to set the speed of the motors. things to set: ' + setStuff.length);
      async.series(setStuff, function(){
        console.log( 'did set motors');
      })
    }

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
    var newMotors = JSON.parse(JSON.stringify(motors));
    newMotors[channelNr].speed = Math.max(0,Math.min(255,value));
    console.log(' got correct motor, actually setting speed');
    var toDo =
      function (cb) {
        //shifts the motor2 value 2 characters to the left, sending a 4 character hexa value
        drv.i2c1.writeWordSync(drv.address,MotorSpeedSet, newMotors[MOTOR2].speed * 256 + newMotors[MOTOR1].speed );
        sleep.usleep(100000);
        cb();
      };


    async.retry({times: 3, interval: 200}, toDo, function(err, result) {
      motors[channelNr].speed = value;
      if (callback !== undefined && typeof callback == 'function') {
        callback();
      }
    });

  };

  drv.getMotors = function(){
    return motors;
  };


  // Function used by PaM Interface
  drv.send = drv.setMotors;
  drv.read = drv.getMotors;

  // reset everything
  drv.i2c1.writeByteSync(drv.address, DirectionSet, BothClockWise);
  sleep.usleep(100000);
  drv.i2c1.writeWordSync(drv.address,MotorSpeedSet, 0 );
  sleep.usleep(100000);
}

I2CMotorDriver.prototype = new I2CSensor();


//I2CMotorDriver.prototype.read = function(){
//  return this.getMotors();
//};

module.exports = I2CMotorDriver;



