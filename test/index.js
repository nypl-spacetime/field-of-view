'use strict'

const fieldOfView = require('./../dist/field-of-view.node.js')
const test = require('tap').test

const inputFeatures = require('./input.json').features
const outputFeatures = require('./output.json').features

const stringify = (obj) => JSON.stringify(obj, (key, val) =>
  val.toFixed ? Number(val.toFixed(13)) : val
)

inputFeatures
  .forEach((inputFeature, i) => {
    test('field-of-view', function (t) {
      t.same(stringify(fieldOfView.fromFeature(inputFeature)), stringify(outputFeatures[i]))
      t.end()
    })
  })
