angular.module('hackathon.common', [])
  .service('Asterix', function($http, $timeout) {
    var startDate = new Date(2015, 9, 1, 0, 0, 0, 0);
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

      query: function(parameters) {
        var json = (JSON.stringify({
          queryType: parameters.queryType,
          area: parameters.area,
          time : {
            start: Date.parse(parameters.time.start),
            end: Date.parse(parameters.time.end)
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
            switch (asterixService.result.queryType) {
              case "Signal":
                asterixService.signalMapResult = result.results;
                break;
              case "AppUsage":
                asterixService.appMapResult = result.results;
                break;
            }
            break;
          case "time":
            switch (asterixService.result.queryType) {
              case "Signal":
                asterixService.signalTimeResult = result.results;
                break;
              case "AppUsage":
                asterixService.appTimeResult = result.results;
                break;
            }
            break;
          default:
            console.log("ws get unknown data: " + result);
            break;
        }
      });
    };

    return asterixService;
  });
