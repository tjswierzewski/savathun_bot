import WebSocket from 'ws';
import Phrase from '../models/phrase';
import Trigger from '../models/trigger';
import { commandHandler } from './commandHandler';
import { getCommands } from './commands';
import discordAxios from './helpers/discordAxios';
import { printIncoming, printOutgoing } from './helpers/printer';
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
      seq: this.sequenceNumber,
    },
  });

  identify = JSON.stringify({
    op: 2,
    d: {
      token: process.env.BOT_TOKEN,
      intents: 1785,
      properties: {
        $os: 'OSX',
        $browser: 'Ishtar',
        $device: 'Ghost',
      },
      presence: {
        activities: [
          {
            name: 'Spinning webs',
            type: 0,
          },
        ],
        status: 'online',
        since: 91879201,
        afk: false,
      },
    },
  });
  /**
   * Sends websocket heartbeat message with op code 1
   * @param {boolean} status true if connection is functional
   */
  sendHeartbeat = () => {
    const heartbeat = JSON.stringify({ op: 1, d: this.sequenceNumber });
    this.client.send(heartbeat);
    printOutgoing(heartbeat);
    this.alive = false;
  };
  /**
   * Makes a post request to a specified
   * @param {string} url endpoint of post request
   * @param {object} message message object
   */
  sendPost = async (url, message) => {
    try {
      discordAxios.post(url, message);
      printOutgoing(message);
    } catch (error) {
      printOutgoing(error);
    }
  };
  /**
   * Makes a delete request to a specified
   * @param {string} url endpoint of delete request
   */
  sendDelete = async (url) => {
    try {
      discordAxios.delete(url);
    } catch (error) {
      printOutgoing(error);
    }
  };
  /**
   * Post a Phrase from database to discord channel
   * @param {string} channel discord channel id
   */
  postRandomPhrase = async (channel) => {
    const count = await Phrase.count().exec();
    const rand = Math.floor(Math.random() * count);
    const url = `/channels/${channel}/messages`;
    const phrase = await Phrase.findOne().skip(rand).exec();
    const message = { content: phrase.phrase };
    this.sendPost(url, message);
    this.lastMessageTime = Date.now();
  };
  /**
   * Check if message contains any keywords
   * @param {array} message array of words in message
   * @return {boolean} if message contains word in the trigger list
   */
  checkKeyword = async (message) => {
    let triggerList = await Trigger.find().exec();
    triggerList = triggerList.map((trigger) => {
      return trigger.trigger;
    });
    return triggerList.some((trigger) => message.includes(trigger));
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
  parseMessage = (message) => {
    printIncoming(message);
    message = message.split(' ');
    message = message.map((word) =>
      word
        .split('')
        .filter((letter) => this.punctuation.indexOf(letter) === -1)
        .join('')
        .toLowerCase(),
    );
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
  createHeartbeat = (interval) => {
    this.sendHeartbeat();
    this.timer = setTimeout(() => {
      if (this.alive) {
        this.createHeartbeat(interval);
        return;
      }
      this.restartBot();
    }, interval);
  };

  postCommands = (commands) => {
    commands.forEach(async (command) => {
      printOutgoing(`Posting command ${command.name}`);
      try {
        const response = await discordAxios.post(
          `/applications/${process.env.APPLICATION_ID}/guilds/831880241310990357/commands`,
          command,
        );
        printIncoming(`${response.data.name} posted`);
      } catch (error) {
        console.error(error.response.data);
      }
    });
  };

  /**
   * Connects to discord websockets and handles recived messages
   */
  runBot = () => {
    this.client = new WebSocket(process.env.WEBSOCKET_URL);

    this.client.on('open', async () => {
      printOutgoing('Bot Connected');
      const commands = await getCommands();
      this.postCommands(commands);
    });

    this.client.on('close', (code, reason) => {
      printOutgoing(`Bot Disconnected: ${reason}`);
    });

    this.client.on('message', (message) => {
      const data = JSON.parse(message);
      printIncoming(data);
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
              commandHandler(this, data.d);

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

export default DiscordBot;
