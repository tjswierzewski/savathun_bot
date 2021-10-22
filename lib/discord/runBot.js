"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ws = _interopRequireDefault(require("ws"));

var _phrase = _interopRequireDefault(require("../models/phrase"));

var _trigger = _interopRequireDefault(require("../models/trigger"));

var _discordAxios = _interopRequireDefault(require("./helpers/discordAxios"));

var _printer = require("./helpers/printer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const punctuation = '!#$%&()*+,-./:;<=>?@[\\]^_{|}~';
let sequenceNumber = null;
let alive = false;
let sessionId = null;
let userId = null;
let lastMessageTime = 0;
let timeout = 5;
const resume = JSON.stringify({
  op: 6,
  d: {
    token: process.env.BOT_TOKEN,
    session_id: sessionId,
    seq: sequenceNumber
  }
});
const identify = JSON.stringify({
  op: 2,
  d: {
    token: process.env.BOT_TOKEN,
    intents: 1785,
    properties: {
      $os: 'OSX',
      $browser: 'Ishtar',
      $device: 'Ghost'
    },
    presence: {
      activities: [{
        name: 'Spinning webs',
        type: 0
      }],
      status: 'online',
      since: 91879201,
      afk: false
    }
  }
});
/**
 * Sends websocket heartbeat message with op code 1
 * @param {object} client Websocket connection
 * @param {boolean} status true if connection is functional
 */

const sendHeartbeat = (client, status) => {
  if (!status) {
    client.terminate();
  }

  const heartbeat = JSON.stringify({
    op: 1,
    d: sequenceNumber
  });
  client.send(heartbeat);
  (0, _printer.printOutgoing)(heartbeat);
  alive = false;
};
/**
 * Makes a post request to a specified
 * @param {string} url endpoint of post request
 * @param {object} message message object
 */


const sendPost = async (url, message) => {
  try {
    const response = _discordAxios.default.post(url, message);

    (0, _printer.printIncoming)(response);
  } catch (error) {
    (0, _printer.printIncoming)(error);
  }
};

const postRandomPhrase = async data => {
  const count = await _phrase.default.count().exec();
  const rand = Math.floor(Math.random() * count);
  const url = `/channels/${data.d.channel_id}/messages`;
  const phrase = await _phrase.default.findOne().skip(rand).exec();
  const message = {
    content: phrase.phrase
  };
  sendPost(url, message);
  lastMessageTime = Date.now();
};

const checkKeyword = async (message, data) => {
  let triggerList = await _trigger.default.find().exec();
  triggerList = triggerList.map(trigger => {
    return trigger.trigger;
  });

  if (triggerList.some(trigger => message.includes(trigger))) {
    postRandomPhrase(data);
  }
};

const restartBot = client => {
  client.terminate();
  runBot();
};
/**
 * Connects to discord websockets and handles recived messages
 */


const runBot = () => {
  const discord = new _ws.default(process.env.WEBSOCKET_URL);
  discord.on('message', message => {
    const data = JSON.parse(message);
    (0, _printer.printIncoming)(data);
    sequenceNumber = data.s;

    switch (data.op) {
      case 0:
        switch (data.t) {
          case 'READY':
            sessionId = data.d.session_id;
            userId = data.d.user.id;
            break;

          case 'MESSAGE_CREATE':
            if (!data.d.author.bot) {
              let message = data.d.content;
              (0, _printer.printIncoming)(message);
              message = message.split(' ');
              message = message.map(word => word.split('').filter(letter => punctuation.indexOf(letter) === -1).join('').toLowerCase());

              if (Date.now() - lastMessageTime > timeout * 60000) {
                checkKeyword(message, data);
              }
            }

            break;

          default:
            break;
        }

        break;

      case 1:
        sendHeartbeat(discord, alive);

      case 7:
        restartBot(discord);
        break;

      case 9:
        if (!data.d) {
          sessionId = null;
        }

        restartBot(discord);
        break;

      case 10:
        alive = true;
        sessionId = data.d.session_id;
        setInterval(sendHeartbeat, data.d.heartbeat_interval, discord, alive);

        if (sessionId) {
          discord.send(resume);
          break;
        }

        discord.send(identify);
        break;

      case 11:
        alive = true;
        break;

      default:
        break;
    }
  });
};

var _default = runBot;
exports.default = _default;