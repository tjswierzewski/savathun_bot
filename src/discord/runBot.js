import WebSocket from 'ws';
import Phrase from '../models/phrase';
import Trigger from '../models/trigger';
import discordAxios from './helpers/discordAxios';
import { printIncoming, printOutgoing } from './helpers/printer';

const punctuation = '!#$%&()*+,-./:;<=>?@[\\]^_{|}~';

let sequenceNumber = null;
let alive = false;
let sessionId = null;
let lastMessageTime = 0;
const timeout = process.env.TIMEOUT;
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
/**
 * Post a Phrase from database to discord channel
 * @param {string} channel discord channel id
 */
const postRandomPhrase = async (channel) => {
  const count = await Phrase.count().exec();
  const rand = Math.floor(Math.random() * count);
  const url = `/channels/${channel}/messages`;
  const phrase = await Phrase.findOne().skip(rand).exec();
  const message = { content: phrase.phrase };
  sendPost(url, message);
  lastMessageTime = Date.now();
};
/**
 * Check if message contains any keywords
 * @param {array} message array of words in message
 * @return {boolean} if message contains word in the trigger list
 */
const checkKeyword = async (message) => {
  let triggerList = await Trigger.find().exec();
  triggerList = triggerList.map((trigger) => {
    return trigger.trigger;
  });
  return triggerList.some((trigger) => message.includes(trigger));
};
/**
 * Restart bot proccess
 * @param {object} client discord object
 */
const restartBot = (client) => {
  client.terminate();
  clearInterval(interval);
  runBot();
};
/**
 * Break string into an array of words with no puncuation
 * @param {string} message message to break into array
 * @return {array} message broken into an array
 */
const parseMessage = (message) => {
  printIncoming(message);
  message = message.split(' ');
  message = message.map((word) =>
    word
      .split('')
      .filter((letter) => punctuation.indexOf(letter) === -1)
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
const respondToMessage = async (message, channel) => {
  if (Date.now() - lastMessageTime > timeout * 60000) {
    if (await checkKeyword(message)) {
      postRandomPhrase(channel);
    }
  }
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
            break;

          case 'MESSAGE_CREATE':
            if (!data.d.author.bot) {
              const message = parseMessage(data.d.content);
              respondToMessage(message, data.d.channel_id);
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
