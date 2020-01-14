/*
  Mimic.js - adds custom scratch block to control the Mimic robot arm.
  Created by Zaron Thompson, June 28, 2017.
*/

(function (ext) {

	_self = ext;
	_baseUrl = "http://localhost:8080/mimic/api/";
	_enableButtonPressedEvent = false;
	_isButtonPressed = false;
	_enableKnobTurnedEvent = false;
	_isKnobTurned = false;
	
	listenForEvents = function()
	{
		if (_enableButtonPressedEvent == true)
		{
			send("ButtonPressed").then(function(data){
				if (data === true)
					_isButtonPressed = true;
			});
		}
		
		if (_enableKnobTurnedEvent == true)
		{
			send("KnobTurned").then(function(data){
				if (data === true)
					_isKnobTurned = true;
			});
		}
		
		//run again
		window.setTimeout(function() { listenForEvents(); }, 500); //every .5 sec
	}
	
	send = function (cmd, params, ajaxOptions) {
		
		//generate url
		var url = _baseUrl + cmd
		if (params != null){
			var paramStr = "";
			for (var name in params) {
				paramStr += name + "=" + params[name] + "&"
			}
			if (paramStr.length > 0) {
				url += "?" + paramStr.substring(0, paramStr.length - 1);
			}
		}
		
		//send request
		var options = {
            url: url,
            dataType: 'jsonp',
            timeout : 2000
        };
		if (ajaxOptions != null)
			$.extend(options, ajaxOptions);
		return $.ajax(options);
	};
	
	getServoID = function(servoName)
	{
		switch (servoName)
		{
			case "shoulder": return 1;
			case "upper arm": return 2;
			case "forearm": return 3;
			case "hand": return 4;
			case "gripper": return 5;
			default: return 1;
		}
	};
	
	getSynchronized = function(sync)
	{
		if (sync === "synchronized")
			return true;
		return false;
	};

    ext._getStatus = function () {
        return { status: 2, msg: "Ready" };
    };
	
	ext.failedConnection = function() {
		register();
		return "Verify that the scratch module within the Mimic software is activated and running";
	};

    ext._shutdown = function () {
    };
	
	ext.ledOn = function(red, green, blue) {
		send("LedOn", {Red:red, Green:green, Blue:blue});
	};
	
	ext.ledOff = function() {
		send("LedOff");
	};

    ext.play = function(notes, callback) {
		send("Play", {Notes: notes}, {timeout:6000}).always(callback);
	};
	
	ext.playback = function(recording) {
		//refresh the list
		if (recording === '<refresh>'){
			register();
		}
		
		//begin playback
		else
			send("Playback", {Recording: recording});
	};
	
	ext.servosStop = function() {
		send("ServosStop");
	};
	
	ext.servosOff = function() {
		send("ServosOff");
	};
	
	ext.servoPosition = function(servoName, position) {
		send("ServoPosition", {ServoID: getServoID(servoName), Position: position});
	};
	
	ext.servoMove = function(servoName, position) {
		send("ServoMove", {ServoID: getServoID(servoName), Position: position});
	};
	
	ext.servoMoveAll = function(servo1Pos, servo2Pos, servo3Pos, servo4Pos, servo5Pos) {
		send("ServoMoveAll", {Servo1Pos: servo1Pos, Servo2Pos: servo2Pos, Servo3Pos: servo3Pos, Servo4Pos: servo4Pos, Servo5Pos: servo5Pos});
	};
	
	ext.servoMoveTarget = function(x, y, z) {
		send("ServoMoveTarget", {X: x, Y: y, Z: z});
	};
	
	ext.moveSettings = function(speed, easeIn, easeOut, sync) {
		send("MoveSettings", {Speed: speed, EaseIn: easeIn, EaseOut: easeOut, Sync: getSynchronized(sync)});
	};
	
	ext.servoOff = function(servoName) {
		send("ServoOff", {ServoID: getServoID(servoName)});
	};
	
	ext.moveWait = function(callback) {
		send("MoveWait", null, {timeout:60000}).always(callback);
	};
	
	ext.buttonPressed = function(servoID) {
		_enableButtonPressedEvent = true;
		if (_isButtonPressed === true){
			_isButtonPressed = false;
			return true;
		}
		return false;
	};
	
	ext.knobTurned = function(servoID) {
		_enableKnobTurnedEvent = true;
		if (_isKnobTurned === true){
			_isKnobTurned = false;
			return true;
		}
		return false;
	};
	
	ext.isMoving = function(callback) {
		send("IsMoving").then(callback);
	};
	
	ext.isLongButton = function(callback) {
		send("IsButtonPressLong").then(callback);
	};
	
	ext.getButtonPressCount = function(callback) {
		send("GetButtonPressCount").then(callback);
	};
	
	ext.resetButtonPressCount = function(servoName) {
		send("ResetButtonPressCount");
	};
	
	ext.setKnobPosition = function(position, minRange, maxRange) {
		send("SetKnobPosition", {Position: position, MinRange: minRange, MaxRange: maxRange});
	};
	
	ext.getKnobPosition = function(callback) {
		send("GetKnobPosition").then(callback);
	};

    var descriptor = {
        blocks: [
		  [' ', 'playback %m.recordings', 'playback'],
		  [' ', 'move to x:%n y:%n z:%n', 'servoMoveTarget', 0, 0, 0],
		  [' ', 'move shoulder:%n upper arm:%n forearm:%n hand:%n gripper:%n', 'servoMoveAll', 0, 0, 0, 0, 0],
		  [' ', 'move %m.servoName to position %n', 'servoMove', 'gripper', 0],
		  ['w', 'wait until done', 'moveWait'],
		  [' ', 'move settings speed:%n ease in:%n ease out:%n %m.sync', 'moveSettings', 50, 0, 0, 'synchronized'],
		  ['R', 'is moving', 'isMoving'],
		  [' ', 'position %m.servoName at %n', 'servoPosition', 'gripper', 0],
		  [' ', 'stop moving', 'servosStop'],
		  [' ', 'servos off', 'servosOff'],
		  [' ', 'servo %m.servoName off', 'servoOff', 'gripper'],
		  [' ', 'led on  red:%n green:%n blue:%n', 'ledOn', 255, 255, 255],
		  [' ', 'led off', 'ledOff'],
          ['w', 'play %s', 'play', 'C,E-16,R,C5-2'],
		  ['h', 'when button pressed', 'buttonPressed'],
		  ['R', 'was a long button pressed', 'isLongButton'],
		  ['R', 'button press count', 'getButtonPressCount'],
		  [' ', 'reset button press count', 'resetButtonPressCount'],
		  ['h', 'when knob turned', 'knobTurned'],
		  [' ', 'set knob position:%n min:%n max:%n', 'setKnobPosition', 0, -100, 100],
		  ['R', 'knob position', 'getKnobPosition'],
        ],
		menus: {
			servoName: ['shoulder', 'upper arm', 'forearm', 'hand', 'gripper'],
			sync: ['synchronized', 'unsynchronized']
		},
        url: 'https://mimicrobot.github.io/scratch/'
    };
	
	register = function(){
		//unregister old
		ScratchExtensions.unregister('Mimic robot arm');
		
		//register new
		send("GetRecordings").then(function(data){
			//success
			if (data != null)
				data.push('<refresh>')
			descriptor.menus.recordings = data;
			ScratchExtensions.register('Mimic robot arm', descriptor, ext);
			listenForEvents();
		}, function(){
			//failed
			ScratchExtensions.register('Mimic robot arm', {blocks: [['r', 'failed to connect - refresh', 'failedConnection']]}, ext);
		});
	};
	register();
	

})({});