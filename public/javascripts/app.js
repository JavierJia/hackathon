var app = angular.module('hackathon', ['hackathon.map','hackathon.timeseries']);

app.controller("AppCtrl", function ($scope, Asterix) {
  $scope.selection = {
    carrier: "cdma",
    type: "strength"
  };

  $scope.signalMapConf = {
    queryType: "Signal",
    width : $(window).width(),
    height: $(window).height()*0.4,
    selection: $scope.selection
  };

  $scope.signalTimeConf = {
    width: $(window).width(),
    height: 150,
    selection: $scope.selection
  };

});
