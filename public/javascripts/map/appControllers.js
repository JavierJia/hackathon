angular.module('hackathon.appMap', ['leaflet-directive', 'hackathon.common'])
  .controller('MapCtrl', function($scope, $window, $http, $compile, Asterix, leafletData) {
    // map setting
    angular.extend($scope, {
      // TODO make this center and level as parameters to make it general
      center: {
        lat: 41.004,
        lng: -73.784,
        zoom: 4
      },
      tiles: {
        name: 'Mapbox',
        url: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
        type: 'xyz',
        options: {
          accessToken: 'pk.eyJ1IjoiamVyZW15bGkiLCJhIjoiY2lrZ2U4MWI4MDA4bHVjajc1am1weTM2aSJ9.JHiBmawEKGsn3jiRK_d0Gw',
          id: 'jeremyli.p6f712pj'
        }
      },
      controls: {
        custom: []
      },
      geojsonData: {},
      polygons: {},
      boroIcon: {},
      neighborIcon: {},
      status:{
        zoomLevel: 10,
        logicLevel: 'boro'
      },
      styles: {
        boroStyle: {
          fillColor: '#f7f7f7',
          weight: 2,
          opacity: 1,
          color: '#92c5de',
          dashArray: '3',
          fillOpacity: 0.2
        },
        neighborStyle: {
          fillColor: '#f7f7f7',
          weight: 1,
          opacity: 1,
          color: '#92c5de',
          fillOpacity: 0.2
        },
        hoverStyle: {
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        },
        colors: ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f'],
      },

    });

    // initialize
    $scope.init = function() {
      leafletData.getMap().then(function(map) {
        $scope.map = map;
        $scope.bounds = map.getBounds();
        map.setView([41.005, -73.784],10);

      });

      setInfoControl();
      $scope.$on("leafletDirectiveMap.zoomend", function() {
        if ($scope.map) {
          $scope.status.zoomLevel = $scope.map.getZoom();
          $scope.bounds = $scope.map.getBounds();
          Asterix.parameters.area.swLat = $scope.bounds._southWest.lat;
          Asterix.parameters.area.swLog = $scope.bounds._southWest.lng;
          Asterix.parameters.area.neLat = $scope.bounds._northEast.lat;
          Asterix.parameters.area.neLog = $scope.bounds._northEast.lng;
          Asterix.parameters.queryType = $scope.config.queryType;
          Asterix.isTimeQuery = false;
          if ($scope.status.zoomLevel > 11) {
            $scope.status.logicLevel = 'neighbor';
            Asterix.parameters.scale.map = $scope.status.logicLevel;
            Asterix.query(Asterix.parameters, false);

            if($scope.polygons.boroPolygons) {
              $scope.map.removeLayer($scope.polygons.boroPolygons);
              $scope.map.addLayer($scope.polygons.neighborPolygons);
            }
          } else if ($scope.status.zoomLevel <= 11) {
            $scope.status.logicLevel = 'boro';
            Asterix.parameters.scale.map = $scope.status.logicLevel;
            Asterix.query(Asterix.parameters, false);

            if($scope.polygons.neighborPolygons) {
              $scope.map.removeLayer($scope.polygons.neighborPolygons);
              $scope.map.addLayer($scope.polygons.boroPolygons);
            }
          }
        }
      });

      // $scope.$on("leafletDirectiveMap.dragend", function() {
      //   $scope.bounds = $scope.map.getBounds();
      //   Asterix.parameters.area.swLat = $scope.bounds._southWest.lat;
      //   Asterix.parameters.area.swLog = $scope.bounds._southWest.lng;
      //   Asterix.parameters.area.neLat = $scope.bounds._northEast.lat;
      //   Asterix.parameters.area.neLog = $scope.bounds._northEast.lng;
      //   Asterix.parameters.scale.map = $scope.status.logicLevel;
      //   Asterix.parameters.queryType = $scope.config.queryType;
      //   Asterix.isTimeQuery = false;
      //   Asterix.query(Asterix.parameters);
      // });
    };


    function setInfoControl() {
      // Interaction function
      function highlightFeature(leafletEvent) {
        var layer = leafletEvent.target;
        layer.setStyle($scope.styles.hoverStyle);
        if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
        }
        $scope.selectedPlace = layer.feature;
      }

      function resetHighlight(leafletEvent) {
        var style = {
          weight: 2,
          fillOpacity: 0.5,
          color: 'white'
        };
        if (leafletEvent)
          leafletEvent.target.setStyle(style);
      }

      function zoomToFeature(leafletEvent) {
        if (leafletEvent)
          $scope.map.fitBounds(leafletEvent.target.getBounds());
      }

      function onEachFeature(feature, layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      }

      // add info control
      var info = L.control();

      info.onAdd = function() {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this._div.innerHTML = [
          '<h4>Level : {{ status.logicLevel }}</h4>',
          '<b>Region: {{ selectedPlace.properties.id || "No place selected" }}</b>',
          '<br/>',
          'Value: {{ selectedPlace.properties.count || "0" }}'
        ].join('');
        $compile(this._div)($scope);
        return this._div;
      };

      info.options = {
        position: 'topleft'
      };
      $scope.controls.custom.push(info);

      loadGeoJsonFiles(onEachFeature);

    }
    // load geoJson
    function loadGeoJsonFiles(onEachFeature) {
      $http.get("assets/resources/data/1.geojson")
        .success(function(data) {
          $scope.geojsonData.boro = data;
          $scope.polygons.boroPolygons = L.geoJson(data, {
            style: $scope.styles.boroStyle,
            onEachFeature: onEachFeature
          });
          $scope.polygons.boroPolygons.addTo($scope.map);
          $scope.boroCenter = {};
          angular.forEach(data.features, function (d) {
            var sumLat = 0;
            var sumLng = 0;
            var Cnt = 0;
            for(var i=0; i < d.geometry.coordinates[0].length; i++) {
              sumLat += parseFloat(d.geometry.coordinates[0][i][1]);
              sumLng += parseFloat(d.geometry.coordinates[0][i][0]);
              Cnt += 1;
            }
            $scope.boroCenter[d.properties.id] = {lat: parseFloat(sumLat)/Cnt, lng:parseFloat(sumLng)/Cnt};
            $scope.boroIcon[d.properties.id] = L.icon({
              iconUrl: '',
              iconSize:     [38, 38], // size of the icon
              iconAnchor:   [19, 19], // point of the icon which will correspond to marker's location
              popupAnchor:  [-19, -19] // point from which the popup should open relative to the iconAnchor
            });
          });
        })
        .error(function(data) {
          console.log("Load boro data failure");
        });
      $http.get("assets/resources/data/tier2bound.geojson")
        .success(function(data) {
          $scope.geojsonData.neighbor = data;
          $scope.polygons.neighborPolygons = L.geoJson(data, {
            style: $scope.styles.neighborStyle,
            onEachFeature: onEachFeature
          });
          $scope.neighorCenter = {};
          angular.forEach(data.features, function (d) {
            var sumLat = 0;
            var sumLng = 0;
            var Cnt = 0;
            for(var i=0; i< d.geometry.coordinates[0].length; i++) {
              sumLat += parseFloat(d.geometry.coordinates[0][i][1]);
              sumLng += parseFloat(d.geometry.coordinates[0][i][0]);
              Cnt += 1;
            }
            $scope.neighorCenter[d.properties.id] = {lat: parseFloat(sumLat)/Cnt, lng:parseFloat(sumLng)/Cnt};
            $scope.neighborIcon[d.properties.id] = L.icon({
              iconUrl: '',
              iconSize:     [38, 38], // size of the icon
              iconAnchor:   [19, 19], // point of the icon which will correspond to marker's location
              popupAnchor:  [-19, -19] // point from which the popup should open relative to the iconAnchor
            });
          });
        })
        .error(function(data) {
          console.log("Load neighbor data failure");
        });


    }

    /**
     * Update map based on a set of spatial query result cells
     * @param    [Array]     mapPlotData, an array of coordinate and weight objects
     */
    $scope.drawMap = function (result) {
      var maxWeight = -100000;
      var minWeight = 100000;

      var getCount = function (data, type) {
        switch (type) {
          case "background":
            return data.b.count;
            break;
          case "foreground":
            return data.f.count;
            break;
        }
      };

      var getName = function (data, type) {
        switch (type) {
          case "background":
            return data.b.app;
            break;
          case "foreground":
            return data.f.app;
            break;
        }
      };

      var getIconUrl = function (data, type) {
        switch (type) {
          case "background":
            if(data.b.icon != "NULL")
              return "http:"+data.b.icon;
            else
              return "http://www.androidpolice.com/wp-content/themes/ap2/ap_resize/ap_resize.php?src=http%3A%2F%2Fwww.androidpolice.com%2Fwp-content%2Fuploads%2F2015%2F03%2Fnexus2cee_an-150x150.png&w=150&h=150&zc=3";
            break;
          case "foreground":
            if(data.f.icon != "NULL")
              return "http:"+data.f.icon;
            else
              return "http://www.androidpolice.com/wp-content/themes/ap2/ap_resize/ap_resize.php?src=http%3A%2F%2Fwww.androidpolice.com%2Fwp-content%2Fuploads%2F2015%2F03%2Fnexus2cee_an-150x150.png&w=150&h=150&zc=3";
            break;
        }
      }

      // find max/min weight
      angular.forEach(result, function(value, key) {
        maxWeight = Math.max(maxWeight, getCount(value.summary, $scope.config.fb.fb));
        minWeight = Math.min(minWeight, getCount(value.summary, $scope.config.fb.fb));

      });

      var range = maxWeight - minWeight;
      if (range < 0) {
        range = 0
        maxWeight = 0
        minWeight = 0
      }
      if (range < 10) {
        range = 10
      }

      var colors = $scope.styles.colors;

      function getColor(d) {
        return d > minWeight + range * 0.9 ? colors[10] :
          d > minWeight + range * 0.8 ? colors[9] :
            d > minWeight + range * 0.7 ? colors[8] :
              d > minWeight + range * 0.6 ? colors[7] :
                d > minWeight + range * 0.5 ? colors[6] :
                  d > minWeight + range * 0.4 ? colors[5] :
                    d > minWeight + range * 0.3 ? colors[4] :
                      d > minWeight + range * 0.2 ? colors[3] :
                        d > minWeight + range * 0.1 ? colors[2] :
                          d > minWeight ? colors[1] :
                            colors[0];
      }

      function style(feature) {
        return {
          fillColor: getColor(feature.properties.count),
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.5
        };
      }

      // update count
      if ($scope.status.logicLevel == "boro" && $scope.geojsonData.boro) {
        for(var key in $scope.neighborIcon) {
          if($scope.neighborIcon.hasOwnProperty(key)) {
            if ($scope.map.hasLayer($scope.neighborIcon[key])) {
              $scope.map.removeLayer($scope.neighborIcon[key]);
            }
          }
        }
        angular.forEach($scope.geojsonData.boro.features, function(d) {
          if (d.properties.count)
            d.properties.count = 0;
          for (var k in result) {
            //TODO make a hash map from ID to make it faster
            if (result[k].key == d.properties.id) {
              $scope.boroIcon[result[k].key].options.iconUrl = getIconUrl(result[k].summary, $scope.config.fb.fb);
              L.marker([$scope.boroCenter[result[k].key].lat,$scope.boroCenter[result[k].key].lng] , {icon: $scope.boroIcon[result[k].key]}).addTo($scope.map).bindPopup(getName(result[k].summary, $scope.config.fb.fb));
              d.properties.count = getCount(result[k].summary, $scope.config.fb.fb);
            }
          }
        });

        // draw
        $scope.polygons.boroPolygons.setStyle(style);


      } else if ($scope.status.logicLevel == "neighbor" && $scope.geojsonData.neighbor) {
        for(var key in $scope.boroIcon) {
          if($scope.boroIcon.hasOwnProperty(key)) {
            if ($scope.map.hasLayer($scope.boroIcon[key])) {
              $scope.map.removeLayer($scope.boroIcon[key]);
            }
          }
        }
        angular.forEach($scope.geojsonData.neighbor.features, function(d) {
          if (d.properties.count)
            d.properties.count = 0;
          for (var k in result) {
            if (result[k].key == d.properties.id) {
              $scope.neighborIcon[result[k].key].options.iconUrl = getIconUrl(result[k].summary, $scope.config.fb.fb);
              L.marker([$scope.neighorCenter[result[k].key].lat,$scope.neighorCenter[result[k].key].lng] , {icon: $scope.neighborIcon[result[k].key]}).addTo($scope.map).bindPopup(getName(result[k].summary, $scope.config.fb.fb));
              d.properties.count = getCount(result[k].summary, $scope.config.fb.fb);
            }
          }
        });

        // draw
        $scope.polygons.neighborPolygons.setStyle(style);



      }
      // add legend
      if ($('.legend'))
        $('.legend').remove();

      $scope.legend = L.control({
        position: 'topleft'
      });

      $scope.legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
          grades = [Math.floor(minWeight)]

        for (var i = 1; i < 10; i++) {
          var value = Math.floor((i * 1.0 / 10) * range + minWeight);
          if (value > grades[i - 1]) {
            grades.push(value);
          }
        }

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="background:' + getColor(grades[i]) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
      };
      if ($scope.map)
        $scope.legend.addTo($scope.map);
    }
  })
  .directive("appMap", function () {
    return {
      restrict: 'E',
      controller: 'MapCtrl',
      scope: {
        config: "=",
        data: "="
      },
      template:[
        '<leaflet lf-center="center" tiles="tiles" events="events" controls="controls" width="1170" height="500" ng-init="init()"></leaflet>'
      ].join(''),
      link: function ($scope, $element, $attrs) {
        $scope.$watchGroup(['data', 'config.fb.fb'], function(newVal, oldVal) {
            $scope.drawMap($scope.data);
          }
        );
      }
    };
  });
