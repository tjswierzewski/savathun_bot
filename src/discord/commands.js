import { getDamageTypes, getWeaponTypes } from '../bungie-api/read-manifest';

export const getCommands = async () => {
  const weaponTypes = await getWeaponTypes();
  const damageTypes = await getDamageTypes();

  const commands = [
    {
      name: 'recommend-weapon-roll',
      description: 'Suggest a weapon roll to be voted on by the clan',
      options: [
        {
          type: 4,
          name: 'weapon-type',
          description: 'Type of weapon roll is for',
          required: true,
          choices: weaponTypes.map((type) => {
            return { name: type.name, value: type.enum };
          }),
        },
        {
          type: 4,
          name: 'damage-type',
          description: 'Damage type for weapon roll is for',
          required: true,
          choices: damageTypes.map((type) => {
            return { name: type.name, value: type.enum };
          }),
        },
      ],
    },
  ];
  return commands;
};
