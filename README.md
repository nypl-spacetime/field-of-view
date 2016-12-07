# field-of-view

JavaScript library which creates photo fields of view from

-
-
-

![](screenshot.png)

## Installation

    npm install field-of-view

## Usage

Single GeoJSON features:

```js
var fieldOfView = require('field-of-view')
var feature = {
  type: 'Feature',
  properties: {
    angle: 50
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [
        4.90028,
        52.37249
      ],
      [
        4.90065,
        52.37262
      ]
    ]
  }
}
console.log(fieldOfView.fromFeature(feature));
```

## API
