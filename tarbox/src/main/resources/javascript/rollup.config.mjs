import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import multi from '@rollup/plugin-multi-entry';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { glob } from 'glob';

const gameFiles = glob.sync('games/**/*.js');

export const gameConfig = {
  input: gameFiles,
  output: {
    file: '../static/js/game.min.js', // Output directory
    format: 'es',
    sourcemap: true, // Optional: Enable source maps
    globals: {
      '@stomp/stompjs': 'StompJs'
    },
    chunkFileNames: '[name]-[hash].js' // Naming pattern for dynamically generated chunks
  },
  external: ['@stomp/stompjs'],
  plugins: [
    multi(),
    resolve({
      browser: true
    }),
    terser(), 
  ],
};

export const homeConfig = {
  input: 'home.js',
  output: {
    file: '../static/js/home.min.js', // Output directory
    format: 'es',
    sourcemap: true, // Optional: Enable source maps
  },
  plugins: [
    multi(),
    resolve({
      browser: true
    }),
    terser(), 
  ],
};

export const downloadConfig = {
  input: 'download.js',
  output: {
    file: '../static/js/download.min.js', // Output directory
    format: 'es',
    sourcemap: true, // Optional: Enable source maps
  },
  plugins: [
    multi(),
    resolve({
      browser: true
    }),
    commonjs(), 
    // terser(), 
  ],
};

export default [homeConfig, gameConfig, downloadConfig];


