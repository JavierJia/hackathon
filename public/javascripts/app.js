var app = angular.module('hackathon', ['hackathon.map','hackthon.timeseries']);

app.controller("AppCtrl", function ($scope, Asterix) {
  $scope.signalMapConf = {
    mapType: "Signal",
    width : $(window).width(),
    height: $(window).height()*0.4,
    carrier: "cdma",
    type: "strength"
  };
  
  $scope.timeseries_width = $(window).width();
  $scope.timeseries_height = $(window).height()*0.2;
});

app.controller("SelectCtrl", function ($scope) {
  $scope.init = function () {
    
  };
  
  $scope.search = function () {
    
  }
})