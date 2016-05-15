angular.module('hackathon.common', [])
  .service('Asterix', function($http, $timeout) {
    var startDate = new Date(2015, 8, 1, 0, 0, 0, 0);
    var endDate = new Date();
    var ws = new WebSocket("ws://localhost:9000/ws");
    var asterixService = {

      parameters: {
        queryType: "Signal",
        area: {
          swLog: -46.23046874999999,
          swLat: 53.85252660044951,
          neLog: -146.42578125,
          neLat: 21.453068633086783
        },
        time: {
          start: startDate,
          end: endDate
        },
        scale: {
          time: "hour",
          map: "boro"
        },
      },

      query: function(parameters, isTimeQuery) {
        var json = (JSON.stringify({
          queryType: parameters.queryType,
          area: parameters.area,
          time : {
            start: isTimeQuery?Date.parse(parameters.time.start):Date.parse(startDate),
            end: isTimeQuery?Date.parse(parameters.time.end):Date.parse(endDate)
          },
          scale: parameters.scale
        }));
        ws.send(json);
      },
      signalMapResult: {},
      signalTimeResult: {},
      appMapResult: {},
      appTimeResult: {},
      isTimeQuery: false
    };

    ws.onmessage = function(event) {
      $timeout(function() {
        console.log(event.data);
        asterixService.result = JSON.parse(event.data);
        switch (asterixService.result.dimension) {
          case "map":
            switch (asterixService.result.type) {
              case "Signal":
                asterixService.signalMapResult = asterixService.result.results;
                break;
              case "AppUsage":
                asterixService.appMapResult = asterixService.result.results;
                break;
            }
            break;
          case "time":
            switch (asterixService.result.type) {
              case "Signal":
                asterixService.signalTimeResult = asterixService.result.results;
                break;
              case "AppUsage":
                asterixService.appTimeResult = asterixService.result.results;
                break;
            }
            break;
          default:
            console.log("ws get unknown data: " + asterixService.result);
            break;
        }
      });
    };

    return asterixService;
  });
