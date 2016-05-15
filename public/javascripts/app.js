var app = angular.module('hackathon', ['hackathon.map','hackathon.timeseries']);

app.controller("AppCtrl", function ($scope, Asterix) {
  $scope.selection = {
    carrier: "cdma",
    type: "strength"
  };

  $scope.signalMapConf = {
    queryType: "Signal",
    width : $(window).width(),
    height: $(window).height()*0.3,
    selection: $scope.selection
  };

  $scope.$watch(
    function(){
      return Asterix.signalMapResult;
    },
    function (newVal, oldVal) {
      $scope.signalMapResult = newVal;
  });

  $scope.$watch(
    function(){
      return Asterix.signalTimeResult;
    },
    function (newVal, oldVal) {
      $scope.signalTimeResult = newVal;
  });

  $scope.signalTimeConf = {
    width: $(window).width()*0.8,
    height: 200,
    selection: $scope.selection
  };

});
