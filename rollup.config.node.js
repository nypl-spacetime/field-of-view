import babel from 'rollup-plugin-babel'

export default {
  entry: 'index.js',
  dest: 'dist/field-of-view.node.js',
  format: 'cjs',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: 'es2015-rollup'
    })
  ]
}
