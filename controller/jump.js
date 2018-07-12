var cString = "";
var arr = [];
var c = 0;
function parseDat(data){
  for(var i in data){
    var char = data[i];
    if(char === ","){
      arr[c] = cString;
      cString = "";
      c += 1;
    } else if (char === "#") {
      arr[2] = cString;
      cString = "";
      var a = arr;
      arr = [];
      c = 0;
      return a;
    } else if(char !== "\n" && char !== "\r") {
      cString += char;
    }
  }
  return null;
}
var BTSP = require('bluetooth-serial-port');
var serial = new BTSP.BluetoothSerialPort();
var {exec} = require('child_process');
var prevState = null;
var cX = null;
var cY = null;
var cZ = null;
serial.on('found', function(address, name){
  if(name.indexOf('DSD TECH') != -1){
    console.log(address);
    serial.findSerialPortChannel(address, function(channel){
      console.log(channel);
      serial.connect(address, channel, function(){
        console.log('connected');
        serial.on('data', function(buffer){
          var dat = buffer.toString('utf8');
          var data = parseDat(dat);
            if(data){
              //Configuration:
              var x = parseInt(data[0]);
              var y = parseInt(data[1]);
              var z = parseInt(data[2]);
              //Should be how this is configured:
              //(Accounting for accelerometer rotation)
              x = z;
              y = y;
              z = x;
              var sensitivity = 3;
              if(cX){
                if(cZ > Math.abs(z) && Math.abs(z) + sensitivity < Math.abs(cZ)){
                  //STOMP
                  console.log("STOMP: " + prevState);
                  if(prevState !== null){
                    exec('start ' + prevState);
                  }
                }
                prevState = null;
                if(Math.abs(cY) > Math.abs(y) && Math.abs(y) + sensitivity < Math.abs(cY)){
                  //LEFT
                  prevState = "a";
                } else if (Math.abs(cY) < Math.abs(y) && Math.abs(y) - sensitivity > Math.abs(cY)){
                  //RIGHT
                  prevState = "d";
                }
                if(Math.abs(cX) > Math.abs(x) && Math.abs(x) + sensitivity < Math.abs(cX)){
                  //UP
                  prevState = "w";
                } else if (Math.abs(cX) < Math.abs(x) && Math.abs(x) - sensitivity > Math.abs(cX)){
                  //DOWN
                  prevState = "s";
                }
                cX = x;
                cY = y;
                cZ = z;
              } else {
                cX = x;
                cY = y;
                cZ = z;
              }
            }
        });
      }, function(){
        console.log('cannot connect');
      });
    }, function(){
      console.log('found nothing');
    });
  }
});
serial.inquire();
