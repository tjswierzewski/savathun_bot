"use strict";

var _mongoose = require("mongoose");

var _discordBot = _interopRequireDefault(require("./discord/discordBot"));

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
  const bot = new _discordBot.default();
  bot.runBot();
});
startMongoDB();