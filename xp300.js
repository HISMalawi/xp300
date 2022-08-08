#!/usr/bin/env node

"use strict"

var net = require('net');
var path = require("path");
var config = require(path.resolve(".", "config.json"));
var xp300 = require(path.resolve(".", "xp300.json"));
var client = require('node-rest-client').Client;
var line = "";
var urls = [];

var reading = false;
var sampleResult = "D1U201704250000000000000043000000000570049200145004480091100295003240031800409000920049900023000050002900477001330013400111003370";


var net = require('net');


var options_auth = {
                user: config.lisUser,
                password: config.lisPassword
        };

function sendData(urls){
                var url = encodeURI(urls[0].replace("+", "---"));
                url = url.replace("---", "%2B");
                urls.shift();
                //console.log(url);
                (new client(options_auth)).get(url, function (data) {
                        if(urls.length > 0){
                                sendData(urls);
                        }
    });
}


var server = net.createServer(function(socket) {

    socket.on('data', function(data) {
	console.log("checking---------------------------------------------");
	console.log(data);
	var count = String(data).length;
	
	for (var counter=0; counter < count; counter++)
	{
		var dat = String(data)[counter];
		  if (dat == " ")
		  { }
		  else{
		     if(String(dat).match(/^\x02/)) {

			    console.log("Got STX");

			    reading = true;

			    line += String(dat).replace(/^\x02/, "");

			} else if(String(dat).match(/^\x03/)) {

			    console.log("Got ETX");

			    reading = false;

			    console.log(line);

			    var result = line;

			    var id = result.substr(33, 10);

			    var specimenId = id;

			    console.log("Sample ID: %s", id);

			    var base = 50;

			    var tests = ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT", "LYM% (W-SCR)",
				"MXD% (W-MCR)", "NEUT% (W-LCR)", "LYM# (W-SCC)", "MXD# (W-MCC)", "NEUT# (W-LCC)",
				"RDW-SD", "RDW-CV", "PDW", "MPV", "P-LCR","PCT"];

			    var results = {};

			    var signs = {
				"0": "",
				"1": "+",
				"2": "-",
				"3": "",
				"4": "^"
			    };

			    for(var i = 0; i < tests.length; i++) {

				var test = tests[i];

				if(i == 1) {

				    results[test] = (isNaN(parseFloat(result.substr(base + 5, 2) +
				        "." + result.substr(base + 5 + 2, 2))) ? "" :
				        (signs[result.substr(base + (i * 5) + 4, 1)]) + String(parseFloat(result.substr(base + 5, 2) + "." +
				        result.substr(base + 5 + 2, 2))));

				} else if (i == 7) {

				    results[test] = (isNaN(parseFloat(result.substr(base + (i * 5), 4))) ?
				        "" : (signs[result.substr(base + (i * 5) + 4, 1)]) + String(parseFloat(result.substr(base + (i * 5), 4))));

				} else {

				    results[test] = (isNaN(parseFloat(result.substr(base + (i * 5), 3) +
				        "." + result.substr(base + (i * 5) + 3, 1))) ?
				        "" : (signs[result.substr(base + (i * 5) + 4, 1)]) + String(parseFloat(result.substr(base + (i * 5), 3) +
				        "." + result.substr(base + (i * 5) + 3, 1))));

				}

				if(specimenId.trim().length > 0 && xp300[test] != undefined) {

				    var measureId = xp300[test];
				    var measureValue = results[test];

				    var options = {
				        user: config.username,
				        password: config.password
				    };
					console.log(measureValue + " " +measureId);
					var link = config.lisPath;
                			link = link.replace(/\#\{SPECIMEN_ID\}/, specimenId);						
					
					var uri = link.replace(/\#\{MEASURE_ID\}/, measureId);
                        		uri = uri.replace(/\#\{RESULT\}/, measureValue);
                        		if(measureId != undefined){
		                                urls.push(uri);
                			 }
						


				}

			    }
			  

			 

			} else {

			    // process.stdout.write(String(data).trim());

			    line += String(dat);
			}
		       }
	}	
	   sendData(urls);
	   line = "";
	   urls = [];
    });

});

server.listen(1234, '10.43.95.2');

