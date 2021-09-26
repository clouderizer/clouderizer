const AWS = require('aws-sdk');
var async = require('async');

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports.getRandomKey = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 8; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}