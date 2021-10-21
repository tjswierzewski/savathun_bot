import mongoose from 'mongoose';
import Phrases from './seeders/phrases.seeder';

const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/savathun-bot';

/**
 * Seeders List
 * order is important
 * @type {Object}
 */
export const seedersList = { Phrases };
/**
 * Connect to mongodb implementation
 * @return {Promise}
 */
export const connect = async () =>
  await mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
/**
/**
 * Drop/Clear the database implementation
 * @return {Promise}
 */
export const dropdb = async () => mongoose.connection.db.dropDatabase();
