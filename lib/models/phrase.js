"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = require("mongoose");

const phraseSchema = new _mongoose.Schema({
  phrase: String
}, {
  timestamps: {
    createdAt: 'created_at'
  }
});
const Phrase = (0, _mongoose.model)('Phrase', phraseSchema);
var _default = Phrase;
exports.default = _default;