"use strict";

var _mongoose = require("mongoose");

var _runBot = _interopRequireDefault(require("./discord/runBot"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Connect to MongoDB
 */
const startMongoDB = async () => {
  try {
    await (0, _mongoose.connect)(process.env.MONGO_URL || 'mongodb://localhost:27017/savathun-bot', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.log(error);
  }
};

const db = _mongoose.connection;
db.on('error', err => {
  console.log(err);
});
db.once('open', () => {
  (0, _runBot.default)();
});
startMongoDB();