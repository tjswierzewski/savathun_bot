"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = require("mongoose");

const triggerSchema = new _mongoose.Schema({
  trigger: String
}, {
  timestamps: {
    createdAt: 'created_at'
  }
});
const Trigger = (0, _mongoose.model)('Trigger', triggerSchema);
var _default = Trigger;
exports.default = _default;