"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ws = _interopRequireDefault(require("ws"));

var _phrase = _interopRequireDefault(require("../models/phrase"));

var _trigger = _interopRequireDefault(require("../models/trigger"));

var _commandHandler = require("./commandHandler");

var _commands = require("./commands");

var _discordAxios = _interopRequireDefault(require("./helpers/discordAxios"));

var _printer = require("./helpers/printer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class containing functions and responses of a bot to discord
 */
class DiscordBot {
  /**
   * changing attributes of a bot
   */
  constructor() {
    this.client;
    this.sequenceNumber = null;
    this.alive = false;
    this.sessionId = null;
    this.lastMessageTime = 0;
    this.timeout = process.env.TIMEOUT;
    this.timer;
  }

  punctuation = '!#$%&()*+,-./:;<=>?@[\\]^_{|}~';
  resume = JSON.stringify({
    op: 6,
    d: {
      token: process.env.BOT_TOKEN,
      session_id: this.sessionId,
      seq: this.sequenceNumber
    }
  });
  identify = JSON.stringify({
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
   * @param {boolean} status true if connection is functional
   */

  sendHeartbeat = () => {
    const heartbeat = JSON.stringify({
      op: 1,
      d: this.sequenceNumber
    });
    this.client.send(heartbeat);
    (0, _printer.printOutgoing)(heartbeat);
    this.alive = false;
  };
  /**
   * Makes a post request to a specified
   * @param {string} url endpoint of post request
   * @param {object} message message object
   */

  sendPost = async (url, message) => {
    try {
      _discordAxios.default.post(url, message);

      (0, _printer.printOutgoing)(message);
    } catch (error) {
      (0, _printer.printOutgoing)(error);
    }
  };
  /**
   * Makes a delete request to a specified
   * @param {string} url endpoint of delete request
   */

  sendDelete = async url => {
    try {
      _discordAxios.default.delete(url);
    } catch (error) {
      (0, _printer.printOutgoing)(error);
    }
  };
  /**
   * Post a Phrase from database to discord channel
   * @param {string} channel discord channel id
   */

  postRandomPhrase = async channel => {
    const count = await _phrase.default.count().exec();
    const rand = Math.floor(Math.random() * count);
    const url = `/channels/${channel}/messages`;
    const phrase = await _phrase.default.findOne().skip(rand).exec();
    const message = {
      content: phrase.phrase
    };
    this.sendPost(url, message);
    this.lastMessageTime = Date.now();
  };
  /**
   * Check if message contains any keywords
   * @param {array} message array of words in message
   * @return {boolean} if message contains word in the trigger list
   */

  checkKeyword = async message => {
    let triggerList = await _trigger.default.find().exec();
    triggerList = triggerList.map(trigger => {
      return trigger.trigger;
    });
    return triggerList.some(trigger => message.includes(trigger));
  };
  /**
   * Restart bot proccess
   */

  restartBot = () => {
    clearTimeout(this.timer);
    this.client.close(1012, 'Bot restarted');
    this.runBot();
  };
  /**
   * Break string into an array of words with no puncuation
   * @param {string} message message to break into array
   * @return {array} message broken into an array
   */

  parseMessage = message => {
    (0, _printer.printIncoming)(message);
    message = message.split(' ');
    message = message.map(word => word.split('').filter(letter => this.punctuation.indexOf(letter) === -1).join('').toLowerCase());
    return message;
  };
  /**
   * Actions to take when receving a message
   * @param {array} message message array
   * @param {string} channel channel id
   */

  respondToMessage = async (message, channel) => {
    if (Date.now() - this.lastMessageTime > this.timeout * 60000) {
      if (await this.checkKeyword(message)) {
        this.postRandomPhrase(channel);
      }
    }
  };
  /**
   * Create rythmic heartbeat that stops when lost connection
   * @param {integer} interval ms for period of interval
   * @param {boolean} flag if interval should continue
   */

  createHeartbeat = interval => {
    this.sendHeartbeat();
    this.timer = setTimeout(() => {
      if (this.alive) {
        this.createHeartbeat(interval);
        return;
      }

      this.restartBot();
    }, interval);
  };
  postCommands = commands => {
    commands.forEach(async command => {
      (0, _printer.printOutgoing)(`Posting command ${command.name}`);

      try {
        const response = await _discordAxios.default.post(`/applications/${process.env.APPLICATION_ID}/guilds/831880241310990357/commands`, command);
        (0, _printer.printIncoming)(`${response.data.name} posted`);
      } catch (error) {
        console.error(error.response.data);
      }
    });
  };
  /**
   * Connects to discord websockets and handles recived messages
   */

  runBot = () => {
    this.client = new _ws.default(process.env.WEBSOCKET_URL);
    this.client.on('open', async () => {
      (0, _printer.printOutgoing)('Bot Connected');
      const commands = await (0, _commands.getCommands)();
      this.postCommands(commands);
    });
    this.client.on('close', (code, reason) => {
      (0, _printer.printOutgoing)(`Bot Disconnected: ${reason}`);
    });
    this.client.on('message', message => {
      const data = JSON.parse(message);
      (0, _printer.printIncoming)(data);
      this.sequenceNumber = data.s;

      switch (data.op) {
        case 0:
          switch (data.t) {
            case 'READY':
              this.sessionId = data.d.session_id;
              break;

            case 'MESSAGE_CREATE':
              if (!data.d.author.bot) {
                const message = this.parseMessage(data.d.content);
                this.respondToMessage(message, data.d.channel_id);
              }

              break;

            case 'INTERACTION_CREATE':
              (0, _commandHandler.commandHandler)(this, data.d);

            default:
              break;
          }

          break;

        case 1:
          this.sendHeartbeat();

        case 7:
          this.restartBot();
          break;

        case 9:
          if (!data.d) {
            this.sessionId = null;
          }

          this.restartBot();
          break;

        case 10:
          this.alive = true;
          this.sessionId = data.d.session_id;
          this.createHeartbeat(data.d.heartbeat_interval);

          if (this.sessionId) {
            this.client.send(this.resume);
            break;
          }

          this.client.send(this.identify);
          break;

        case 11:
          this.alive = true;
          break;

        default:
          break;
      }
    });
  };
}

var _default = DiscordBot;
exports.default = _default;