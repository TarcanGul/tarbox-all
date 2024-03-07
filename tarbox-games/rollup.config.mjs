import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

const electronConfig = {
  input: './src/main.ts',
  output: {
    file: './dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve(),
    json(),
    copy({
      targets: [
        { src: 'src/data', dest: 'dist' },
      ]
    })
  ],
  external: ['electron']
};

const reactConfig = {
  input: './src/renderer/App.tsx',
  output: {
    dir: './dist/renderer',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript(),
    resolve({
      extensions: ['.js', '.ts', '.tsx', '.css'], 
      browser: true
    }),
    commonjs(),
    babel({
      presets: ['@babel/preset-react', '@babel/preset-env'],
      babelHelpers: 'bundled'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
      preventAssignment: true
    }),
    postcss(),
    terser(),
    filesize()
  ]
};

const preloadConfig = {
  input: './src/preload.ts',
  output: {
    file: './dist/preload.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve()
  ],
  external: ['electron']
}

const dataConfig = {
  input: './src/data',
  output: {
    dir: './dist/data'
  },
  plugins: [
    copy()
  ]
}

export default [preloadConfig, electronConfig, reactConfig];