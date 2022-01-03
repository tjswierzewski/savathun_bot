import fs from 'fs';
import {
  getPlugDefinition,
  getPlugSet,
  getWeaponNames,
  getWeaponSocketSets,
} from '../bungie-api/read-manifest';
import componentEmitter from './events/componentEmitter';

export const commandHandler = async (bot, commandData) => {
  const commandName = commandData.data.name;
  const componentName = commandData.data.custom_id;
  const params = commandData.data.options;
  const user = commandData.member;
  let interactionToken = commandData.token;
  const interactionResponseUrl = `/interactions/${commandData.id}/${interactionToken}/callback`;

  switch (commandName) {
    case 'recommend-weapon-roll':
      const weapons = await getWeaponNames(params[1].value, params[0].value);
      const weaponOptions = weapons.map((weapon) => {
        return { label: weapon.name, value: weapon.enum };
      });
      weaponOptions.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));

      try {
        bot.sendPost(interactionResponseUrl, {
          type: 4,
          data: {
            content: 'Here is a list of weapons based off your choices',
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 3,
                    custom_id: 'selected_weapon',
                    options: weaponOptions,
                    placeholder: 'Select a weapon',
                  },
                ],
              },
            ],
          },
        });
        componentEmitter.once('respond', () => {
          bot.sendDelete(
            `/webhooks/${process.env.APPLICATION_ID}/${interactionToken}/messages/@original`,
          );
        });
      } catch (error) {
        console.error(error.response.data);
      }
      break;

    default:
      break;
  }

  switch (componentName) {
    case 'selected_weapon':
      componentEmitter.emit('respond');
      const weaponHash = commandData.data.values[0];
      const weaponRoll = {
        weapon: weaponHash,
        perks: [],
      };

      const socketSets = await getWeaponSocketSets(weaponHash);
      const plugSet = await getPlugSet(socketSets[0]);
      const plugs = await plugSet.map(async (plug) => {
        const perk = await getPlugDefinition(plug);
        return { label: perk.name, value: perk.enum };
      });
      Promise.all(plugs).then((values) => {
        bot.sendPost(interactionResponseUrl, {
          type: 4,
          data: {
            content: `Perk Choices for 1st column`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 3,
                    custom_id: `perk_1`,
                    options: values,
                    placeholder: 'Select a Perk',
                  },
                ],
              },
            ],
          },
        });
      });
      componentEmitter.once('1st_Pick', async (perk, newInteractionToken, id) => {
        weaponRoll.perks.push(perk);
        bot.sendDelete(
          `/webhooks/${process.env.APPLICATION_ID}/${interactionToken}/messages/@original`,
        );
        interactionToken = newInteractionToken;
        const plugSet = await getPlugSet(socketSets[1]);
        const plugs = await plugSet.map(async (plug) => {
          const perk = await getPlugDefinition(plug);
          return { label: perk.name, value: perk.enum };
        });
        Promise.all(plugs).then((values) => {
          bot.sendPost(`interactions/${id}/${interactionToken}/callback`, {
            type: 4,
            data: {
              content: `Perk Choices for 2nd column`,
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 3,
                      custom_id: `perk_2`,
                      options: values,
                      placeholder: 'Select a Perk',
                    },
                  ],
                },
              ],
            },
          });
        });
      });
      componentEmitter.once('2nd_Pick', async (perk, newInteractionToken, id) => {
        weaponRoll.perks.push(perk);
        bot.sendDelete(
          `/webhooks/${process.env.APPLICATION_ID}/${interactionToken}/messages/@original`,
        );
        interactionToken = newInteractionToken;
        const plugSet = await getPlugSet(socketSets[2]);
        const plugs = await plugSet.map(async (plug) => {
          const perk = await getPlugDefinition(plug);
          return { label: perk.name, value: perk.enum };
        });
        Promise.all(plugs).then((values) => {
          bot.sendPost(`interactions/${id}/${interactionToken}/callback`, {
            type: 4,
            data: {
              content: `Perk Choices for 3rd column`,
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 3,
                      custom_id: `perk_3`,
                      options: values,
                      placeholder: 'Select a Perk',
                    },
                  ],
                },
              ],
            },
          });
        });
      });
      componentEmitter.once('3rd_Pick', async (perk, newInteractionToken, id) => {
        weaponRoll.perks.push(perk);
        bot.sendDelete(
          `/webhooks/${process.env.APPLICATION_ID}/${interactionToken}/messages/@original`,
        );
        interactionToken = newInteractionToken;
        const plugSet = await getPlugSet(socketSets[3]);
        const plugs = await plugSet.map(async (plug) => {
          const perk = await getPlugDefinition(plug);
          return { label: perk.name, value: perk.enum };
        });
        Promise.all(plugs).then((values) => {
          bot.sendPost(`interactions/${id}/${interactionToken}/callback`, {
            type: 4,
            data: {
              content: `Perk Choices for 4th column`,
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 3,
                      custom_id: `perk_4`,
                      options: values,
                      placeholder: 'Select a Perk',
                    },
                  ],
                },
              ],
            },
          });
        });
      });
      componentEmitter.once('4th_Pick', async (perk, newInteractionToken, id) => {
        weaponRoll.perks.push(perk);
        bot.sendDelete(
          `/webhooks/${process.env.APPLICATION_ID}/${interactionToken}/messages/@original`,
        );
        interactionToken = newInteractionToken;
        const stream = fs.createWriteStream('weapon-roll-list.txt', { flags: 'a' });
        stream.write(`\n\ndimwishlist:item=${weaponRoll.weapon}&perks=${weaponRoll.perks}`);
        stream.close;
        bot.sendPost(`interactions/${id}/${interactionToken}/callback`, {
          type: 4,
          data: {
            content: `dimwishlist:item=${weaponRoll.weapon}&perks=${weaponRoll.perks}`,
          },
        });
      });
      break;

    case 'perk_1':
      componentEmitter.emit('1st_Pick', commandData.data.values[0], interactionToken, commandData.id);
      break;

    case 'perk_2':
      componentEmitter.emit('2nd_Pick', commandData.data.values[0], interactionToken, commandData.id);
      break;

    case 'perk_3':
      componentEmitter.emit('3rd_Pick', commandData.data.values[0], interactionToken, commandData.id);
      break;

    case 'perk_4':
      componentEmitter.emit('4th_Pick', commandData.data.values[0], interactionToken, commandData.id);
      break;

    default:
      break;
  }
};
