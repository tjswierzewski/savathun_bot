"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.printOutgoing = exports.printIncoming = void 0;

/**
 * Colorize string to show message is from websocket
 * @param {string} message string to be printed
 */
const printIncoming = message => {
  console.log('\x1b[35m%s\x1b[0m', message);
};
/**
 * Colorize string to show message is to websocket
 * @param {string} message string to be printed
 */


exports.printIncoming = printIncoming;

const printOutgoing = message => {
  console.log('\x1b[33m%s\x1b[0m', message);
};

exports.printOutgoing = printOutgoing;