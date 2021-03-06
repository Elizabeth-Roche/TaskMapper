'use strict'
import React, { Component } from 'react'
import {
    Image,
    Text,
    AlertIOS,
    View,
    StyleSheet,
    TextInput,
    TouchableHighlight,
    TouchableWithoutFeedback,
} from 'react-native'

var TimerMixin = require('react-timer-mixin')

var CountDown = React.createClass({
  mixins: [TimerMixin],
  getInitialState: function () {
    return {
      task: this.props.item,
      time: 'loading...',
      dueDate: this.props.dueDate,
      disabled: true
    }
  },
  componentDidMount(){
    this._countdown()
  },
  render(){
    var style = [styles.text]
    var component
    if (this.state.disabled) {
      style.push({color: 'gray'})
      style.push(this.props.disabledTextStyle)
      component =
          <View
              style={[styles.wrapper,this.props.buttonStyle]}
              >

              <Text style={[style]}>{this.state.time}</Text>

          </View>
    } else {
      component =
          <TouchableHighlight
              style={[styles.wrapper,this.props.buttonStyle]}
              onPress={this._onPress}
              >
            <Text style={[style,this.props.textStyle]}>{this.props.text}({this.state.time})</Text>
          </TouchableHighlight>
    }
    return (
        component
    )
  },
  _onPress(){
    if (this.state.disabled) {
      //nothing
    } else {
      this.setState({disabled: true})
      this._countdown()
      if(this.props.onPress){
          this.props.onPress()
      }
    }
  },

  _countdown(){
    var timer = function () {
       var time = (this.state.time) - 1
      this.setState({time: time})
      if (time > 0) {
        this.setTimeout(timer, 1000)
        if (time == 1 ){
          AlertIOS.alert(
                this.state.task.txt + ' at ' + this.state.task.name, 'Due now!'
              )
        }
      } else {
        this.setState({disabled: false})
        this.setState({time: 0})
      }
    };
    this.setTimeout(timer, 1000);
  }
  })

//   _countdown(){
//     var timer = function () {
//       var time = this.state.time - 1
//       this.setState({time: time})
//       if (time > 0) {
//         this.setTimeout(timer, 1000)
//         if (time == 1 ){
//           AlertIOS.alert(
//                 "This alert happens at 1second and is in the counter.js!"
//               )
//         }
//       } else {
//         this.setState({disabled: false})
//         this.setState({time: 0})
//       }
//     };
//     this.setTimeout(timer, 1000);
//   }
// })

var styles = StyleSheet.create({
  text: {
    color: 'black'
  },
  wrapper: {
    padding: 10,
    marginRight:10,
    backgroundColor: '#e5e5e5',
  }
})

module.exports = CountDown
