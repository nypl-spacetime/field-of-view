#!/usr/bin/env node
'use strict'

var fs = require('fs')
var argv = require('minimist')(process.argv.slice(2))
var JSONStream = require('JSONStream')
var fieldOfView = require('./')

var geojson = {
  open: '{"type":"FeatureCollection","features":[',
  close: ']}\n'
}

if (process.stdin.isTTY && !argv._[0]) {
  console.error('Usage: field-of-view [-o file] FILE\n' +
    '-a    angle of field of view.\n' +
    '-k    key in feature\'s properties which holds field-of-view options. default is null\n' +
    '-o    output file. if not given, field-of-view uses stdout')

  process.exit(1)
}

var stream = ((argv._.length ? fs.createReadStream(argv._[0]) : process.stdin))
stream.setEncoding('utf8')

var options = {}

if (argv.a) {
  options.angle = argv.a
}

if (argv.k) {
  options.nested = argv.k
}

stream
  .pipe(JSONStream.parse('features.*'))
  .pipe(fieldOfView.fromStream(options))
  .pipe(JSONStream.stringify(geojson.open, ',', geojson.close))
  .pipe(argv.o ? fs.createWriteStream(argv.o, 'utf8') : process.stdout)
