'use strict'

var H = require('highland')
var turf = {
  destination: require('turf-destination'),
  centroid: require('turf-centroid'),
  bearing: require('turf-bearing'),
  distance: require('turf-distance')
}
var unit = 'kilometers'

function tanDeg (deg) {
  var rad = deg * Math.PI / 180
  return Math.tan(rad)
}

function getNested (feature, options) {
  var properties = feature.properties
  if (options.nested) {
    if (properties[options.nested]) {
      properties = properties[options.nested]
    } else {
      properties = {}
    }
  }
  return properties
}

function checkFeatures (feature, options) {
  var properties = getNested(feature, options)
  var angle = properties.angle || options.angle

  var geometryType = feature.geometry.type

  if (angle === undefined) {
    throw new Error('feature must include angle property, or global angle option must be set')
  }

  if (geometryType === 'LineString') {
    if (feature.geometry.coordinates.length === 2) {
      return feature
    } else {
      throw new Error('only accepts only accepts LineStrings with two points')
    }
  } else if (geometryType === 'GeometryCollection') {
    if (feature.geometry.geometries.length === 2 &&
      feature.geometry.geometries[0].type === 'Point' &&
      feature.geometry.geometries[1].type === 'Point') {
      return {
        type: 'Feature',
        properties: feature.properties,
        geometry: {
          type: 'LineString',
          coordinates: [
            feature.geometry.geometries[0].coordinates,
            feature.geometry.geometries[1].coordinates
          ]
        }
      }
    } else {
      throw new Error('only accepts GeometryCollections containing two Points')
    }
  } else if (geometryType === 'Point') {
    if (properties.bearing !== undefined && properties.distance !== undefined) {
      return feature
    } else {
      throw new Error('only accepts single Points with distance and bearing properties')
    }
  } else {
    throw new Error('only accepts LineStrings with two points, GeometryCollections \n' +
      'containing two Points, or single Points with distance and bearing properties')
  }
}

function processFeature (feature, options) {
  var geometryType = feature.geometry.type
  if (geometryType === 'Point') {
    return processPoint(feature, options)
  } else if (geometryType === 'LineString') {
    return processLineString(feature, options)
  }
}

function processPoint (feature, options) {
  var properties = getNested(feature, options)

  var distance = properties.distance / 1000
  var angle = properties.angle || options.angle

  var centroid = turf.destination(feature, distance, properties.bearing, unit)

  var distCentroid = tanDeg(angle / 2) * distance

  var points = [
    turf.destination(centroid, distCentroid, properties.bearing + 90, unit),
    turf.destination(centroid, -distCentroid, properties.bearing + 90, unit)
  ]

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        feature.geometry,
        {
          type: 'LineString',
          coordinates: [
            points[0].geometry.coordinates,
            points[1].geometry.coordinates
          ]
        }
      ]
    }
  }
}

function processLineString (feature, options) {
  var properties = getNested(feature, options)
  var angle = properties.angle || options.angle

  var centroid = turf.centroid(feature)

  var points = feature.geometry.coordinates.map(function (coordinate) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinate
      }
    }
  })

  var distCentroid = turf.distance(points[0], centroid, unit)
  var bearing = turf.bearing(points[0], points[1])

  var distCamera = distCentroid / tanDeg(angle / 2)
  var camera = turf.destination(centroid, distCamera, bearing + 90, unit)

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        camera.geometry,
        feature.geometry
      ]
    }
  }
}

module.exports.fromFeature = function (feature, options) {
  options = options || {}
  feature = checkFeatures(feature, options)
  return processFeature(feature, options)
}

module.exports.fromStream = function (options) {
  options = options || {}
  var curriedCheckFeatures = H.flip(checkFeatures, options)
  var curriedProcessFeature = H.flip(processFeature, options)

  return H.pipeline(
    H.map(curriedCheckFeatures),
    H.stopOnError(function (err) {
      console.error('Error:', err.message)
    }),
    H.map(curriedProcessFeature)
  )
}
