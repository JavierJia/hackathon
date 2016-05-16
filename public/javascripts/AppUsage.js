var app = angular.module('hackathon.app', ['hackathon.appMap','hackathon.appTimeseries']);

app.controller("AppCtrl", function ($scope, Asterix) {
  $scope.fb = {fb: "foreground"};

  $scope.appMapConf = {
    queryType: "AppUsage",
    width : $(window).width(),
    height: $(window).height()*0.3,
    fb: $scope.fb
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
      return Asterix.appTimeResult;
    },
    function (newVal, oldVal) {
      $scope.appTimeResult = newVal;
    });

  $scope.appTimeConf = {
    width: $(window).width()*0.7,
    height: 250,
    fb: $scope.fb
  };

});
