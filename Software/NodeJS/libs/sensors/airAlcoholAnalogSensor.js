
var AnalogSensor = require('./base/analogSensor')
var commands     = require('../commands')

var RS_Air;

var init = true;

function AirAlcoholAnalogSensor(pin) {
  console.log('alcohol sensor arguments:', Array.prototype.slice.call(arguments));
  AnalogSensor.apply(this, Array.prototype.slice.call(arguments))
  //this.board.pinMode(15,this.board.OUTPUT);
  //var writeRet = this.board.writeBytes(commands.dWrite.concat([15, commands.unused, commands.unused]))
  //if (writeRet){
  //  console.log('should heat?');
  //} else {
  //  console.log(' turning heater on failed');
  //}
}
AirAlcoholAnalogSensor.prototype = new AnalogSensor()

AirAlcoholAnalogSensor.prototype.calibrate = function(){
  var sensorValue = 0;
  for(var x = 0 ; x < 100.0 ; x++)
  {
    sensorValue = sensorValue + parseInt(AnalogSensor.prototype.read.call(this));
  }
  sensorValue /= 100.0;

  var sensorVolt = (sensorValue / 1024) * 5.0 ;
  RS_Air = sensorVolt / ( 5.0 - sensorVolt );
  console.log('RS_Air '+ RS_Air);
  return RS_Air;

}


AirAlcoholAnalogSensor.prototype.read = function() {

  if ( init ) {
    this.board.pinMode(15,this.board.OUTPUT);
    var writeRet = this.board.writeBytes(commands.dWrite.concat([15, commands.unused, commands.unused]));
    if (writeRet){
      console.log('should heat?');
    } else {
      console.log(' turning heater on failed');
    }
    init = false;
  }
//
  //var res = parseInt(AnalogSensor.prototype.read.call(this));
  ////console.log('pureData :' + (1023 - res) );
  //var promille = (((1023-res)-650)/375 ) * 10;
  ////console.log('"promille": '+ Math.max(0, promille  ));
  //var volt = (res/1025)*5.0;
  //var RS_Gas = volt/(5.0-volt);
//
  //var ratio = RS_Gas/RS_Air;
  var response = AnalogSensor.prototype.read.call(this);

  var responseInt = parseInt(response);

  if ( ! isNaN(responseInt) && responseInt > -1 ){
    return 1023 - responseInt;
  } else {
    //console.log(response);
    return response;
  }



}


module.exports = AirAlcoholAnalogSensor
