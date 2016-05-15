angular.module('hackathon.appTimeseries', ['hackathon.common'])
  .controller('TimeSeriesCtrl', function ($scope, $window, Asterix) {
    $scope.d3 = $window.d3;
    $scope.dc = $window.dc;
    $scope.crossfilter = $window.crossfilter;


    $scope.preProcess = function (result, type) {
      $scope.resultArray = [];
      var parseDate = d3.time.format("%Y-%m-%d %H").parse;
      angular.forEach(result, function (value, key) {
        key = parseDate(value.key);
        console.log(value.summary)
        switch (type) {
          case "foreground":
            $scope.resultArray.push(
              {
                'time':key,
                'Chrome Browser - Google' :value.summary['Chrome Browser - Google'].f,
                'Facebook': value.summary['Facebook'].f,
                'Gmail': value.summary['Gmail'].f,
                'Google Play Store': value.summary['Google Play Store'].f,
                'Maps': value.summary['Maps'].f,
                'Instagram': value.summary['Instagram'].f,
                'YouTube': value.summary['YouTube'].f,
                'WhatsApp Messenger': value.summary['WhatsApp Messenger'].f,
                'Messenger': value.summary['Messenger'].f,
                'Snapchat': value.summary['Snapchat'].f
              });
            break;
          case "background":
            $scope.resultArray.push(
              {
                'time':key,
                'time':key,
                'Chrome Browser - Google' :value.summary['Chrome Browser - Google'].b,
                'Facebook': value.summary['Facebook'].b,
                'Gmail': value.summary['Gmail'].b,
                'Google Play Store': value.summary['Google Play Store'].b,
                'Maps': value.summary['Maps'].b,
                'Instagram': value.summary['Instagram'].b,
                'YouTube': value.summary['YouTube'].b,
                'WhatsApp Messenger': value.summary['WhatsApp Messenger'].b,
                'Messenger': value.summary['Messenger'].b,
                'Snapchat': value.summary['Snapchat'].b
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

          var ChromeGroup = timeDimension.group().reduceSum(function (d) {
            return d['Chrome Browser - Google'];
          });

          var FacebookGroup = timeDimension.group().reduceSum(function (d) {
            return d['Facebook'];
          });

          var GmailGroup = timeDimension.group().reduceSum(function (d) {
            return d['Gmail'];
          });

          var PlayGroup = timeDimension.group().reduceSum(function (d) {
            return d['Google Play Store'];
          });

          var MapsGroup = timeDimension.group().reduceSum(function (d) {
            return d['Maps'];
          });

          var InstagramGroup = timeDimension.group().reduceSum(function (d) {
            return d['Instagram'];
          });

          var YouTubeGroup = timeDimension.group().reduceSum(function (d) {
            return d['YouTube'];
          });

          var WhatsAppGroup = timeDimension.group().reduceSum(function (d) {
            return d['WhatsApp Messenger'];
          });

          var MessengerGroup = timeDimension.group().reduceSum(function (d) {
            return d['Messenger'];
          });

          var SnapchatGroup = timeDimension.group().reduceSum(function (d) {
            return d['Snapchat'];
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
            .group(ChromeGroup,"Google Chrome")
            .stack(FacebookGroup,"Facebook")
            .stack(GmailGroup,"Gmail")
            .stack(PlayGroup,"Google Play")
            .stack(MapsGroup,"Maps")
            .stack(InstagramGroup,"Instagram")
            .stack(YouTubeGroup,"Youtube")
            .stack(WhatsAppGroup,"WhatsApp")
            .stack(MessengerGroup, "Messenger")
            .stack(SnapchatGroup, "Snapchat")
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