import WebSocket from 'ws';
import { printIncoming, printOutgoing } from './helpers/printer';

const punctuation = '!#$%&()*+,-./:;<=>?@[\\]^_{|}~';

let sequenceNumber = null;
let alive = false;
let sessionId = null;
let userId = null;

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
    client.terminate();
  }
  const heartbeat = JSON.stringify({ op: 1, d: sequenceNumber });
  client.send(heartbeat);
  printOutgoing(heartbeat);
  alive = false;
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
            if (message.includes('darkness')) {
              printOutgoing('Hello Little Light');
            }
            break;

          default:
            break;
        }
        break;
      case 1:
        sendHeartbeat(discord, alive);
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

export default runBot;
