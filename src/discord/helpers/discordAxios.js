import axios from 'axios';
/**
 * Sets up common paramaters for discord axios requests
 */
const discordAxios = axios.create({
  baseURL: 'https://discord.com/api/v9',
  headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
});

export default discordAxios;
