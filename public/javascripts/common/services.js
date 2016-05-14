angular.module('cloudberry.common', [])
  .service('Asterix', function($http, $timeout) {
    var startDate = new Date(2012, 1, 1, 0, 0, 0, 0);
    var endDate = new Date();
    var ws = new WebSocket("ws://localhost:9000/ws");
    var asterixService = {

      parameters: {
        dataset: "hackathon",
        carrier: "AT&T",
        signal_dbm: -10,
        signal_level: 4,
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
        level: "neighborhood",
        repeatDuration: 0
      },

      query: function(parameters, queryType) {
        var json = (JSON.stringify({
          dataset: parameters.dataset,
          carrier: parameters.carrier,
          signal_dbm: parameters.signal_dbm,
          signal_level: parameters.signal_level,
          area: parameters.area,
          timeRange : {
            start: Date.parse(parameters.time.start),
            end: Date.parse(parameters.time.end)
          },
          level: parameters.level,
          repeatDuration: parameters.repeatDuration
        }));
        ws.send(json);
      },
      queryType : "",
      mapResult: {},
      timeResult: {}
    };

    ws.onmessage = function(event) {
      $timeout(function() {
        console.log(event.data);
        asterixService.result = JSON.parse(event.data);
        switch (result.aggType) {
          case "map":
            asterixService.mapResult = result.result;
            break;
          case "time":
            asterixService.timeResult = result.result;
            break;
          default:
            console.log("ws get unknown data: " + result);
            break;
        }
      });
    };

    return asterixService;
  });
