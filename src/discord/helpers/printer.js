export const printIncoming = (message) => {
  console.log('\x1b[35m%s\x1b[0m', message);
};

export const printOutgoing = (message) => {
  console.log('\x1b[33m%s\x1b[0m', message);
};
