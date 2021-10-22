"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Sets up common paramaters for discord axios requests
 */
const discordAxios = _axios.default.create({
  baseURL: 'https://discord.com/api/v9',
  headers: {
    Authorization: `Bot ${process.env.BOT_TOKEN}`
  }
});

var _default = discordAxios;
exports.default = _default;