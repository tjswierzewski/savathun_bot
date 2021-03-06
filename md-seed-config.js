import mongoose from 'mongoose';
import Phrases from './seeders/phrases.seeder';
import Triggers from './seeders/triggers.seeder';

const env = require('dotenv').config();
const mongoURL = env.parsed.MONGO_URL;

/**
 * Seeders List
 * order is important
 * @type {Object}
 */
export const seedersList = { Phrases, Triggers };
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
