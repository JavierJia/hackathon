var app = angular.module('hackathon.app', ['hackathon.appMap','hackathon.appTimeseries']);

app.controller("AppCtrl", function ($scope, Asterix) {

  $scope.appMapConf = {
    queryType: "AppUsage",
    width : $(window).width(),
    height: $(window).height()*0.3,
    fb: "f"
  };

  $scope.$watch(
    function(){
      return Asterix.appMapResult;
    },
    function (newVal, oldVal) {
      $scope.appMapResult = newVal;
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
