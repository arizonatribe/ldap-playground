/* Environment variables */
require('dotenv-expand')(require('dotenv').config({silent: true}));
/* ES6/ES7 transpiling */
require('babel-register');
/* Shimming for features not yet ready in this version of NodeJS */
require('babel-polyfill');
/* Our actual application */
require('./server');