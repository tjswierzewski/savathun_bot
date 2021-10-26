import { connect, connection } from 'mongoose';
import DiscordBot from './discord/discordBot';

/**
 * Connect to MongoDB
 */
const startMongoDB = async () => {
  try {
    await connect(process.env.MONGO_URL || 'mongodb://localhost:27017/savathun-bot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const db = connection;
db.on('error', (err) => {
  console.log(err);
});
db.once('open', () => {
  const bot = new DiscordBot();
  bot.runBot();
});

startMongoDB();
