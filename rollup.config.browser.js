import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'index.js',
  dest: 'dist/field-of-view.min.js',
  format: 'iife',
  moduleName: 'fieldOfView',
  sourceMap: true,
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      presets: 'es2015-rollup'
    }),
    uglify()
  ]
}
