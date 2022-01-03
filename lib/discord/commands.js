"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCommands = void 0;

var _readManifest = require("../bungie-api/read-manifest");

const getCommands = async () => {
  const weaponTypes = await (0, _readManifest.getWeaponTypes)();
  const damageTypes = await (0, _readManifest.getDamageTypes)();
  const commands = [{
    name: 'recommend-weapon-roll',
    description: 'Suggest a weapon roll to be voted on by the clan',
    options: [{
      type: 4,
      name: 'weapon-type',
      description: 'Type of weapon roll is for',
      required: true,
      choices: weaponTypes.map(type => {
        return {
          name: type.name,
          value: type.enum
        };
      })
    }, {
      type: 4,
      name: 'damage-type',
      description: 'Damage type for weapon roll is for',
      required: true,
      choices: damageTypes.map(type => {
        return {
          name: type.name,
          value: type.enum
        };
      })
    }]
  }];
  return commands;
};

exports.getCommands = getCommands;