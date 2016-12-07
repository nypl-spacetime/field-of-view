'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var turfDestination = _interopDefault(require('@turf/destination'));
var turfCentroid = _interopDefault(require('@turf/centroid'));
var turfBearing = _interopDefault(require('@turf/bearing'));
var turfDistance = _interopDefault(require('@turf/distance'));

var units = 'meters';

function tanDeg(deg) {
  var rad = deg * Math.PI / 180;
  return Math.tan(rad);
}

function cosDeg(deg) {
  var rad = deg * Math.PI / 180;
  return Math.cos(rad);
}

function getNested(feature, options) {
  var properties = feature.properties;
  if (options.nested) {
    if (properties[options.nested]) {
      properties = properties[options.nested];
    } else {
      properties = {};
    }
  }
  return properties;
}

function checkFeatures(feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var geometryType = feature.geometry.type;

  if (angle === undefined) {
    throw new Error('feature must include angle property, or global angle option must be set');
  }

  if (geometryType === 'LineString') {
    if (feature.geometry.coordinates.length === 2) {
      return feature;
    } else {
      throw new Error('only accepts only accepts LineStrings with two points');
    }
  } else if (geometryType === 'GeometryCollection') {
    if (feature.geometry.geometries.length === 2 && feature.geometry.geometries[0].type === 'Point' && feature.geometry.geometries[1].type === 'Point') {
      return feature;
    } else {
      throw new Error('only accepts GeometryCollections containing two Points');
    }
  } else if (geometryType === 'Point') {
    if (properties.bearing !== undefined && properties.distance !== undefined) {
      return feature;
    } else {
      throw new Error('only accepts single Points with distance and bearing properties');
    }
  } else {
    throw new Error('only accepts LineStrings with two points, GeometryCollections \n' + 'containing two Points, or single Points with distance and bearing properties');
  }
}

function processFeature(feature, options) {
  var geometryType = feature.geometry.type;
  if (geometryType === 'Point') {
    return processPoint(feature, options);
  } else if (geometryType === 'LineString') {
    return processLineString(feature, options);
  } else if (geometryType === 'GeometryCollection') {
    return processGeometryCollection(feature, options);
  }
}

function processPoint(feature, options) {
  var properties = getNested(feature, options);

  var distance = properties.distance;
  var angle = properties.angle || options.angle;

  var centroid = turfDestination(feature, distance, properties.bearing, units);

  var distCentroid = tanDeg(angle / 2) * distance;

  var points = [turfDestination(centroid, distCentroid, properties.bearing + 90, units), turfDestination(centroid, -distCentroid, properties.bearing + 90, units)];

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [feature.geometry, {
        type: 'LineString',
        coordinates: [points[0].geometry.coordinates, points[1].geometry.coordinates]
      }]
    }
  };
}

function processLineString(feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var centroid = turfCentroid(feature);

  var points = feature.geometry.coordinates.map(function (coordinate) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinate
      }
    };
  });

  var distCentroid = turfDistance(points[0], centroid, units);
  var bearing = turfBearing(points[0], points[1]);

  var distCamera = distCentroid / tanDeg(angle / 2);
  var camera = turfDestination(centroid, distCamera, bearing + 90, units);

  return {
    type: 'Feature',
    properties: feature.properties,
    geometry: {
      type: 'GeometryCollection',
      geometries: [camera.geometry, feature.geometry]
    }
  };
}

function processGeometryCollection(feature, options) {
  var properties = getNested(feature, options);
  var angle = properties.angle || options.angle;

  var camera = feature.geometry.geometries[0];
  var centroid = feature.geometry.geometries[1];

  var distance = turfDistance(camera, centroid, units);
  var bearing = turfBearing(camera, centroid);

  var distFieldOfViewCorner = distance / cosDeg(angle / 2);

  var fieldOfViewPoint1 = turfDestination(camera, distFieldOfViewCorner, bearing + angle / 2, units);
  var fieldOfViewPoint2 = turfDestination(camera, distFieldOfViewCorner, bearing - angle / 2, units);

  return {
    type: 'Feature',
    properties: Object.assign(feature.properties, {
      bearing: bearing,
      distance: distance
    }),
    geometry: {
      type: 'GeometryCollection',
      geometries: [camera, {
        type: 'LineString',
        coordinates: [fieldOfViewPoint1.geometry.coordinates, fieldOfViewPoint2.geometry.coordinates]
      }]
    }
  };
}

function fromFeature(feature, options) {
  options = options || {};
  feature = checkFeatures(feature, options);
  return processFeature(feature, options);
}

exports.fromFeature = fromFeature;
