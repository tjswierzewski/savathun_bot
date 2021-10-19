/**
 * Colorize string to show message is from websocket
 * @param {string} message string to be printed
 */
export const printIncoming = (message) => {
  console.log('\x1b[35m%s\x1b[0m', message);
};
/**
 * Colorize string to show message is to websocket
 * @param {string} message string to be printed
 */
export const printOutgoing = (message) => {
  console.log('\x1b[33m%s\x1b[0m', message);
};
