'use strict'

var fs = require('fs')
var H = require('highland')
var test = require('tap').test
var JSONStream = require('JSONStream')
var fieldOfView = require('../')

var inputStream = fs.createReadStream('./test/input.geojson')
  .pipe(JSONStream.parse('features.*'))

var outputStream = fs.createReadStream('./test/output.geojson')
  .pipe(JSONStream.parse('features.*'))

H([H(inputStream), H(outputStream)])
  .zipAll0()
  .each(function (pair) {
    test('field-of-view', function (t) {
      t.same(fieldOfView.fromFeature(pair[0]), pair[1])
      t.end()
    })
  })
