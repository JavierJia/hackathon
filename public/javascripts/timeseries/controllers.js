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
                'cdma':value.cdma.strength,
                'evdo': value.evdo.strength,
                'gsm': value.gsm.strength,
                'lte': value.lte.strength,
                'wcdma': value.wcdma.strength
              });
            break;
          case "quality":
            $scope.resultArray.push(
              {
                'time':key,
                'cdma':value.cdma.quality,
                'evdo': value.evdo.quality,
                'gsm': value.gsm.quality,
                'lte': value.lte.quality,
                'wcdma': value.wcdma.quality
              });
            break;
        };
      });
    };
    $scope.$watchGroup(['$scope.data', '$scope.config.selection.type'],
      function(newVal, oldVal) {
        if((newVal && !Asterix.isTimeQuery) || newVal[1] != oldVal[1]) {
          $scope.preProcess($scope.data, $scope.conf.type);
        }
      }
    );
  })
  .directive('timeSeries', function (Asterix) {
    var margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 50
    };
    var width = $scope.config.width - margin.left - margin.right;
    var height = $scope.config.height - margin.top - margin.bottom;
    return {
      restrict: "E",
      scope: {
        config: "=",
        data: "="
      },
      controller: 'TimeSeriesCtrl',
      link: function ($scope, $element, $attrs) {
        var chart = d3.select($element[0]);
        $scope.$watch('resultArray', function (newVal, oldVal) {
          if(newVal.length == 0)
            return;
          chart.selectAll('*').remove();

          var timeSeries = dc.lineChart(chart[0][0]);
          var timeBrush = timeSeries.brush();
          timeBrush.on('brushend', function (e) {
            var extent = timeBrush.extent();
            Asterix.parameters.time.start = extent[0];
            Asterix.parameters.time.end = extent[1];
            Asterix.parameters.scale.time = "hour";
            Asterix.isTimeQuery = true;
            Asterix.query(Asterix.parameters);
          });

          var ndx = crossfilter(newVal);
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
            .group(cdmaGroup)
            .stack(evdoGroup)
            .stack(gsmGroup)
            .stack(lteGroup)
            .stack(wcdmaGroup)
            .x(d3.time.scale().domain([minDate, maxDate]));

          dc.renderAll();

          chart.append('text')
            .style('font','12px sans-serif')
            .html(maxDate.getFullYear()+"-"+(maxDate.getMonth()+1)+"-"+maxDate.getDate());

        })
      }
    };
  });