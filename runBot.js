import WebSocket from 'ws';

let sequenceNumber = null;
let alive = false;
let sessionId = null;

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
          name: 'Reading the Lore',
          type: 0,
        },
      ],
      status: 'online',
      since: 91879201,
      afk: false,
    },
  },
});

const sendHeartbeat = (client, status) => {
  if (!status) {
    client.terminate();
  }
  const heartbeat = JSON.stringify({ op: 1, d: sequenceNumber });
  client.send(heartbeat);
  console.log(heartbeat);
  alive = false;
};

const runBot = () => {
  const discord = new WebSocket(process.env.WEBSOCKET_URL);

  discord.on('message', (message) => {
    const data = JSON.parse(message);
    console.log(data);
    sequenceNumber = data.s;
    switch (data.op) {
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
