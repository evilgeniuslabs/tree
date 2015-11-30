var app = angular.module('app', []);

app.config(function ($httpProvider) {
  $httpProvider.defaults.transformRequest = function (data) {
    if (data === undefined) {
      return data;
    }
    return $.param(data);
  };
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;';
});

app.controller('MainCtrl', function ($scope, $http, $timeout, variableService) {
  $scope.brightness = "255";
  $scope.busy = false;
  $scope.power = 1;
  $scope.color = "#0000ff";
  $scope.drawColor = "#0000ff";
  $scope.r = 0;
  $scope.g = 0;
  $scope.b = 255;
  $scope.numLeds = 0;
  $scope.leds = []
  $scope.powerText = "On";
  $scope.status = "Please enter your access token:";
  $scope.disconnected = false;
  $scope.accessToken = "";
  $scope.isDeviceSelected = false;

  $scope.patterns = [];
  $scope.patternIndex = 0;

  $scope.devices = [];

  $scope.onSelectedDeviceChange = function() {
    $scope.isDeviceSelected = $scope.device != null;

    if($scope.device != null && $scope.device.connected == true)
      $scope.connect();
  }

  $scope.onSelectedPatternChange = function() {
    $scope.setPattern();
  }

  $scope.onSelectedColorChange = function() {
    $scope.setColor();
  }

  $scope.getDevices = function () {
    $scope.status = 'Getting devices...';

    $http.get('https://api.particle.io/v1/devices?access_token=' + $scope.accessToken).
      success(function (data, status, headers, config) {
        if (data && data.length > 0) {
          var deviceId = null;

          if (Modernizr.localstorage) {
            deviceId = localStorage["deviceId"];
          }

          for (var i = 0; i < data.length; i++) {
            var device = data[i];
            device.title = (device.connected == true ? "● " : "◌ ") + device.name;
            device.status = device.connected == true ? "online" : "offline";

            if (data[i].id == deviceId) {
              $scope.device = data[i];
              $scope.onSelectedDeviceChange();
            }
          }

          $scope.devices = data;

          if (!$scope.device)
            $scope.device = data[0];

          $scope.isDeviceSelected = $scope.device != null;
        }
        $scope.status = 'Loaded devices';
      }).
      error(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.status = data.error_description;
      });
  }

  if (Modernizr.localstorage) {
    $scope.accessToken = localStorage["accessToken"];

    if ($scope.accessToken && $scope.accessToken != "") {
      $scope.status = "";
      $scope.getDevices();
    }
  }

  $scope.save = function () {
    localStorage["accessToken"] = $scope.accessToken;
    $scope.status = "Saved access token";

    $scope.getDevices();
  }

  $scope.connect = function () {
    // $scope.busy = true;

    localStorage["deviceId"] = $scope.device.id;

    $scope.status = 'Loading power...';
    variableService.getVariableValue("power", $scope.device.id, $scope.accessToken)
    .then(function (response) {
      $scope.power = response.data.result;
      $scope.status = 'Loaded power';
    })

    .then(function (data) {
      $scope.status = 'Loading brightness...';
      return variableService.getVariableValue("brightness", $scope.device.id, $scope.accessToken);
    })
    .then(function (response) {
      $scope.brightness = response.data.result;
      $scope.status = 'Loaded brightness';
    })

    .then(function (data) {
      $scope.status = 'Loading red...';
      return variableService.getVariableValue("r", $scope.device.id, $scope.accessToken);
    })
    .then(function (response) {
      $scope.r = response.data.result;
      $scope.status = 'Loaded red';
    })

    .then(function (data) {
      $scope.status = 'Loading green...';
      return variableService.getVariableValue("g", $scope.device.id, $scope.accessToken);
    })
    .then(function (response) {
      $scope.g = response.data.result;
      $scope.status = 'Loaded green';
    })

    .then(function (data) {
      $scope.status = 'Loading blue...';
      return variableService.getVariableValue("b", $scope.device.id, $scope.accessToken);
    })
    .then(function (response) {
      $scope.b = response.data.result;
      $scope.status = 'Loaded blue';
    })

    .then(function (data) {
      $scope.status = 'Loading LED count...';
      return variableService.getVariableValue("numLeds", $scope.device.id, $scope.accessToken);
    })
    .then(function (response) {
      $scope.numLeds = response.data.result;
      $scope.status = 'Loaded LED count';
      $scope.leds = [];
      for(var i = 0; i < $scope.numLeds; i++) {
        $scope.leds.push({ index: i, color: "#000000" });
      }
    })

    .then(function () {
      $scope.getPatterns();
    })

    .then(function () {
      $scope.getPatternIndex();
    })
  }

  $scope.getPower = function () {
    // $scope.busy = true;
    $http.get('https://api.particle.io/v1/devices/' + $scope.device.id + '/power?access_token=' + $scope.accessToken).
      success(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.power = data.result;
      }).
      error(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.status = data.error_description;
      });
  };

  $scope.powerOn = function () {
    // $scope.busy = true;
    $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/variable',
      data: { access_token: $scope.accessToken, args: "pwr:1" },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).
    success(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.power = data.return_value;
      $scope.status = $scope.power == 1 ? 'Turned on' : 'Turned off';
    }).
    error(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.status = data.error_description;
    });
  };

  $scope.powerOff = function () {
    // $scope.busy = true;
    $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/variable',
      data: { access_token: $scope.accessToken, args: "pwr:0" },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).
    success(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.power = data.return_value;
      $scope.status = $scope.power == 1 ? 'Turned on' : 'Turned off';
    }).
    error(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.status = data.error_description;
    });
  };

  $scope.getBrightness = function () {
    // $scope.busy = true;
    $http.get('https://api.particle.io/v1/devices/' + $scope.device.id + '/brightness?access_token=' + $scope.accessToken).
      success(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.brightness = data.result;
      }).
      error(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.status = data.error_description;
      });
  };

  $scope.setBrightness = function ($) {
    // $scope.busy = true;
    $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/variable',
      data: { access_token: $scope.accessToken, args: "brt:" + $scope.brightness },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).
    success(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.brightness = data.return_value;
      $scope.status = 'Brightness set';
    }).
    error(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.status = data.error_description;
    });
  };

  $scope.onLedClick = function(index) {
    // $scope.busy = true;
    $scope.status = 'Setting pixel color...';

    var led = $scope.leds[index];
    led.color = $scope.drawColor;
    var color = $scope.hexToRgb($scope.drawColor);

    $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/variable',
      data: { access_token: $scope.accessToken, args: "i:" + index + "," + color.r + "," + color.g + "," + color.b },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).
    success(function (data, status, headers, config) {
      $scope.busy = false;
      // $scope.r = data.return_value;
      $scope.status = 'Pixel color set';
    }).
    error(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.status = data.error_description;
    });
  }

  $scope.setColor = function ($) {
    var color = $scope.hexToRgb($scope.color);

    $scope.r = color.r;
    $scope.g = color.g;
    $scope.b = color.b;

    $scope.setRGB();
  };

  $scope.hexToRgb = function (color) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  $scope.setRGB = function ($) {
    // $scope.busy = true;
    $scope.status = 'Setting color...';
    $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/variable',
      data: { access_token: $scope.accessToken, args: "c:" + $scope.r + "," + $scope.g + "," + $scope.b },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).
    success(function (data, status, headers, config) {
      $scope.busy = false;
      // $scope.r = data.return_value;
      $scope.status = 'Color set';
    }).
    error(function (data, status, headers, config) {
      $scope.busy = false;
      $scope.status = data.error_description;
    });
  };

  $scope.getPatternIndex = function () {
    // $scope.busy = true;
    $http.get('https://api.particle.io/v1/devices/' + $scope.device.id + '/patternIndex?access_token=' + $scope.accessToken).
      success(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.patternIndex = data.result;
        $scope.pattern = $scope.patterns[$scope.patternIndex];
      }).
      error(function (data, status, headers, config) {
        $scope.busy = false;
        $scope.status = data.error_description;
      });
  };

  $scope.getPatterns = function () {
    // $scope.busy = true;

    $scope.patterns = [];

    // get the pattern name list
    var promise = $http.get('https://api.particle.io/v1/devices/' + $scope.device.id + '/patternNames?access_token=' + $scope.accessToken);

    promise.then(
      function (payload) {
        var patternNames = JSON.parse(payload.data.result);

        for(var i = 0; i < patternNames.length; i++) {
            $scope.patterns.push({ index: i, name: patternNames[i] });
        }

        $scope.patternCount = patternNames.length;
        $scope.status = 'Loaded patterns';
      },
      function (errorPayload) {
        $scope.busy = false;
        $scope.status = data.error_description;
      });
  };

  $scope.setPattern = function () {
    // $scope.busy = true;

    var promise = $http({
      method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + $scope.device.id + '/patternIndex',
      data: { access_token: $scope.accessToken, args: $scope.pattern.index },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
	  .then(
	    function (payload) {
	      $scope.busy = false;
	      $scope.status = 'Pattern set';
	    },
	    function (errorPayload) {
	      $scope.busy = false;
	    });
  };
});

app.factory('variableService', function ($http) {
  return {
    getVariableValue: function (variableName, deviceId, accessToken) {
      return $http({
        method: 'GET',
        url: 'https://api.particle.io/v1/devices/' + deviceId + '/' + variableName + '?access_token=' + accessToken,
      });
    },

    getExtendedVariableValue: function (variableName, deviceId, accessToken) {
      return $http({
        method: 'POST',
        url: 'https://api.particle.io/v1/devices/' + deviceId + '/varCursor',
        data: { access_token: accessToken, args: variableName },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    }
  }
});
