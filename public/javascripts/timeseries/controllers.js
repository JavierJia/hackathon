angular.module('hackathon.timeseries', ['hackathon.common'])
  .controller('TimeSeriesCtrl', function ($scope, $window, Asterix) {
    $scope.d3 = $window.d3;
    $scope.dc = $window.dc;
    $scope.crossfilter = $window.crossfilter;


    $scope.preProcess = function (result, type) {
      $scope.resultArray = [];
      var parseDate = d3.time.format("%Y-%m-%d %H").parse;
      angular.forEach(result, function (value, key) {
        key = parseDate(value.key);
        switch (type) {
          case "strength":
            $scope.resultArray.push(
              {
                'time':key,
                'cdma':value.summary.cdma.strength,
                'evdo': value.summary.evdo.strength,
                'gsm': value.summary.gsm.strength,
                'lte': value.summary.lte.strength,
                'wcdma': value.summary.wcdma.strength
              });
            break;
          case "quality":
            $scope.resultArray.push(
              {
                'time':key,
                'cdma':value.summary.cdma.quality,
                'evdo': value.summary.evdo.quality,
                'gsm': value.summary.gsm.quality,
                'lte': value.summary.lte.quality,
                'wcdma': value.summary.wcdma.quality
              });
            break;
        };
      });
    };
    // $scope.$watchGroup(['$scope.data', '$scope.config.selection.type'],
    //   function(newVal, oldVal) {
    //     console.log("controller")
    //     if((newVal && !Asterix.isTimeQuery) || newVal[1] != oldVal[1]) {
    //       $scope.preProcess($scope.data, $scope.config.type);
    //     }
    //   }
    // );
  })
  .directive('timeSeries', function (Asterix) {
    return {
      restrict: "E",
      scope: {
        config: "=",
        data: "="
      },
      controller: 'TimeSeriesCtrl',
      link: function ($scope, $element, $attrs) {
        var chart = d3.select($element[0]);
        var margin = {
          top: 10,
          right: 50,
          bottom: 30,
          left: 50
        };
        var width = $scope.config.width - margin.left - margin.right;
        var height = $scope.config.height - margin.top - margin.bottom;
        $scope.$watchGroup(['data', 'config.selection.type'], function (newVal, oldVal) {
          if((newVal && !Asterix.isTimeQuery) || newVal[1] != oldVal[1]) {
            $scope.preProcess($scope.data, $scope.config.selection.type);
          }
          else
            return;
          chart.selectAll('*').remove();

          var timeSeries = dc.lineChart(chart[0][0]);
          var timeBrush = timeSeries.brush();
          timeBrush.on('brushend', function (e) {
            var extent = timeBrush.extent();
            console.log(extent)
            Asterix.parameters.time.start = extent[0];
            Asterix.parameters.time.end = extent[1];
            Asterix.parameters.scale.time = "hour";
            Asterix.isTimeQuery = true;
            Asterix.query(Asterix.parameters, true);
          });

          var ndx = crossfilter($scope.resultArray);
          var timeDimension = ndx.dimension(function (d) {
            if (d.time != null) return d.time;
          })
          var cdmaGroup = timeDimension.group().reduceSum(function (d) {
            return d.cdma;
          });

          var evdoGroup = timeDimension.group().reduceSum(function (d) {
            return d.evdo;
          });

          var gsmGroup = timeDimension.group().reduceSum(function (d) {
            return d.gsm;
          });

          var lteGroup = timeDimension.group().reduceSum(function (d) {
            return d.lte;
          });

          var wcdmaGroup = timeDimension.group().reduceSum(function (d) {
            return d.wcdma;
          });

          var minDate = timeDimension.bottom(1)[0].time;
          var maxDate = timeDimension.top(1)[0].time;


          chart.append('text')
            .style('font','12px sans-serif')
            .html(minDate.getFullYear()+"-"+(minDate.getMonth()+1)+"-"+minDate.getDate());

          timeSeries
            .renderArea(true)
            .width(width)
            .height(height)
            .margins(margin)
            .dimension(timeDimension)
            .group(cdmaGroup,"cdma")
            .stack(evdoGroup,"evdo")
            .stack(gsmGroup,"gsm")
            // .stack(lteGroup)
            .stack(wcdmaGroup,"wcdma")
            .x(d3.time.scale().domain([minDate, maxDate]))
            .legend(dc.legend().x(850).y(10).itemHeight(13).gap(5));

          timeSeries.render();

          chart.append('text')
            .style('font','12px sans-serif')
            .html(maxDate.getFullYear()+"-"+(maxDate.getMonth()+1)+"-"+maxDate.getDate());

        })
      }
    };
  });