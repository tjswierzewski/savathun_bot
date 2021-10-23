import WebSocket from 'ws';
import Phrase from '../models/phrase';
import Trigger from '../models/trigger';
import discordAxios from './helpers/discordAxios';
import { printIncoming, printOutgoing } from './helpers/printer';

const punctuation = '!#$%&()*+,-./:;<=>?@[\\]^_{|}~';

let sequenceNumber = null;
let alive = false;
let sessionId = null;
let userId = null;
let lastMessageTime = 0;
const timeout = 5;
let interval = null;

const resume = JSON.stringify({
  op: 6,
  d: {
    token: process.env.BOT_TOKEN,
    session_id: sessionId,
    seq: sequenceNumber,
  },
});

const identify = JSON.stringify({
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
 * @param {object} client Websocket connection
 * @param {boolean} status true if connection is functional
 */
const sendHeartbeat = (client, status) => {
  if (!status) {
    restartBot();
    return;
  }
  const heartbeat = JSON.stringify({ op: 1, d: sequenceNumber });
  client.send(heartbeat);
  printOutgoing(heartbeat);
  alive = false;
};
/**
 * Makes a post request to a specified
 * @param {string} url endpoint of post request
 * @param {object} message message object
 */
const sendPost = async (url, message) => {
  try {
    const response = discordAxios.post(url, message);
    printIncoming(response);
  } catch (error) {
    printIncoming(error);
  }
};
const postRandomPhrase = async (data) => {
  const count = await Phrase.count().exec();
  const rand = Math.floor(Math.random() * count);
  const url = `/channels/${data.d.channel_id}/messages`;
  const phrase = await Phrase.findOne().skip(rand).exec();
  const message = { content: phrase.phrase };
  sendPost(url, message);
  lastMessageTime = Date.now();
};

const checkKeyword = async (message, data) => {
  let triggerList = await Trigger.find().exec();
  triggerList = triggerList.map((trigger) => {
    return trigger.trigger;
  });
  if (triggerList.some((trigger) => message.includes(trigger))) {
    postRandomPhrase(data);
  }
};

const restartBot = (client) => {
  client.terminate();
  clearInterval(interval);
  runBot();
};
/**
 * Connects to discord websockets and handles recived messages
 */
const runBot = () => {
  const discord = new WebSocket(process.env.WEBSOCKET_URL);

  discord.on('message', (message) => {
    const data = JSON.parse(message);
    printIncoming(data);
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
              printIncoming(message);
              message = message.split(' ');
              message = message.map((word) =>
                word
                  .split('')
                  .filter((letter) => punctuation.indexOf(letter) === -1)
                  .join('')
                  .toLowerCase(),
              );
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
        interval = setInterval(sendHeartbeat, data.d.heartbeat_interval, discord, alive);
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

export default runBot;
