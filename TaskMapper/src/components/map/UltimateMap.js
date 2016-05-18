import React, { Component, PropTypes } from 'react'
import {
  MapView,
  AsyncStorage,
  AlertIOS,
  View,
  Text,
} from 'react-native'

import hslToRgb from '../common/colorConvert'

var chicagoRegion = {
  latitude: 41.889357,
  longitude: -87.637604,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.09,
}

function circleCoords(cLat, cLong, rInMeters) {
  if (rInMeters === 0) {
    return []
  }
  var coords = []
  var tau = 2*Math.PI
  var rLat = rInMeters/111111.1
  var rLong = rInMeters/(111111.1 * Math.cos(cLat*tau/360))

  var n = 6 // "circle" = n-sided polygon
  for (var i = 0; i <= n; i++) {
    var lat = cLat + rLat * Math.cos(tau*i/n)
    var long = cLong + rLong * Math.sin(tau*i/n)
    coords.push({latitude: lat, longitude: long})
  }
  return coords
}

function makeOverlay(marker) {
  return {
    coordinates: circleCoords(marker.latitude, marker.longitude, marker.radius),
    strokeColor: marker.color, // impendingColor(fracThrough),
    lineWidth: 3,
  }
}

function makeAnnotation(marker) {
  var format = {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}
  return {
    title: marker.txt + " : " + new Date(marker.due).toLocaleDateString('en-US', format),
    latitude: marker.latitude,
    longitude: marker.longitude,
    tintColor: marker.color,
  }
}

function makeMarker(task) {
  var currentTime = new Date().getTime()
  var setTime = new Date(task.set).getTime()
  var dueTime = new Date(task.due).getTime()
  var fracThrough = (currentTime-setTime)/(dueTime-setTime)
  return {
    txt: task.txt,
    desc: task.desc,
    set: task.set,
    due: task.due,
    latitude: task.location.lat,
    longitude: task.location.lng,
    color: task.color,
    radius: impendingRadius(fracThrough),
  }
}

function impendingRadius(x) {
  if (0 <= x && x < 1) {
    return 200/(1 - x)
  } else {
    return 0
  }
}

function impendingColor(x) {
  if (0 <= x && x < 1) {
    var hue = (x/3)+(2/3)
  } else {
    var hue = 1
  }
  return hslToRgb(hue, 1, 0.5)
}

function inCircle(self, marker) {
  console.log(self)
  console.log(marker)
  if (marker.radius === 0) {
    return false
  }
  var tau = 2 * Math.PI
  var avgY = (self.latitude + marker.latitude)/2

  var yDist = (self.latitude - marker.latitude)*111111.1
  var xDist = (self.longitude - marker.longitude)*(111111.1 * Math.cos(avgY*tau/360))

  var dist = Math.sqrt( Math.pow(xDist, 2) + Math.pow(yDist, 2) )
  return (dist < marker.radius)
}

var UltimateMap = React.createClass({
  getInitialState: function() {
    return {
      region: chicagoRegion,
      markers: [],
      myPosition: {
        latitude: 0,
        longitude: 0,
      },
    }
  },
  alertMenu(marker) {
    AlertIOS.alert(
      marker.txt + ":  " + marker.desc,
      null,
      [
        {text: 'Complete and Delete', onPress: () => this.deleteMarker(marker)},
        // {text: 'Edit', onPress: () => this.openItem(rowData, rowID)},
        {text: 'Snooze'}
      ]
    )
  },

  deleteMarker(marker){
    var name = marker.txt;
    AsyncStorage.getItem("tasks")
    .then( (rawTasks) => JSON.parse(rawTasks))
    .then( (tasks) => {
      var names = [];
      for(i=0; i<tasks.length; i++){
        names.push(tasks[i].txt)
      }
      index = names.indexOf(name)
      tasks.splice(index, 1)
      this.setState({tasks: tasks})
      AsyncStorage.setItem("tasks", JSON.stringify(this.state.tasks))
    })
  },

  componentDidMount: function() {
    setInterval(() => {
      AsyncStorage.getItem("tasks")
      .then( (rawTasks) => JSON.parse(rawTasks))
      .then( (tasks) => {
        this.setState({markers: tasks.map(makeMarker)})
      })
    }, 1000/60)

    setInterval(() => {
      var self = this.state.myPosition
      for (var i in this.state.markers) {
        var marker = this.state.markers[i]
        if (inCircle(self, marker)) {
          this.alertMenu(marker)
        }
      }
    }, 1000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        var myPosition = {
          latitude: parseFloat(position.coords.latitude),
          longitude: parseFloat(position.coords.longitude),
        }
        this.setState({
          myPosition: myPosition
        })
      },
      (error) => alert(error.message),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 5000}
    )
    this.watchID = navigator.geolocation.watchPosition((position) => {
      var lastPosition = {
        lat: parseFloat(position.coords.latitude),
        long: parseFloat(position.coords.longitude),
      }
      this.setState({
        lastPosition
      })
    })
  },
  render: function() {
    return (
      <MapView style={{flex: 1}}
      region={this.state.region}
      showsUserLocation={true}
      annotations={this.state.markers.map(makeAnnotation)}
      overlays={this.state.markers.map(makeOverlay)} />
    )
  },
  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchID)
  },
})

module.exports = UltimateMap
