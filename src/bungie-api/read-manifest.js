import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export const openDb = () => {
  return open({
    filename: 'world-content-manifest.db',
    driver: sqlite3.Database,
  });
};

export const getWeaponNames = async (defaultDamageType, itemSubType) => {
  const weapons = [];
  const db = await openDb();
  await db.each(
    `
    SELECT DISTINCT json_extract(DestinyInventoryItemDefinition.json, '$.displayProperties.name'), json_extract(DestinyInventoryItemDefinition.json, '$.hash')
    FROM DestinyInventoryItemDefinition, json_tree(DestinyInventoryItemDefinition.json, '$')
    WHERE json_extract(DestinyInventoryItemDefinition.json, '$.itemType') = 3
    AND json_extract(DestinyInventoryItemDefinition.json, '$.defaultDamageType') = $defaultDamageType
    AND json_extract(DestinyInventoryItemDefinition.json, '$.itemSubType') = $itemSubType
    AND json_extract(DestinyInventoryItemDefinition.json, '$.summaryItemHash') = 3520001075
    AND json_tree.key = 'powerCapHash' AND json_tree.value = 2759499571`,
    { $defaultDamageType: defaultDamageType, $itemSubType: itemSubType },
    (err, row) => {
      if (err) throw err;
      const params = Object.values(row);
      const weapon = { name: params[0], enum: params[1] };
      weapons.push(weapon);
    },
  );
  return weapons;
};

export const getDamageTypes = async (callback) => {
  const damageTypes = [];
  const db = await openDb();
  await db.each(
    `
    SELECT json_extract(DestinyDamageTypeDefinition.json, '$.displayProperties.name'), json_extract(DestinyDamageTypeDefinition.json, '$.enumValue')
    FROM DestinyDamageTypeDefinition
    WHERE json_extract(DestinyDamageTypeDefinition.json, '$.displayProperties.name') != 'Raid'
    `,
    (err, row) => {
      if (err) throw err;
      const params = Object.values(row);
      const type = { name: params[0], enum: params[1] };
      damageTypes.push(type);
    },
  );
  return damageTypes;
};

export const getWeaponTypes = async (callback) => {
  const weaponTypes = [];
  const db = await openDb();
  await db.each(
    `
    SELECT json_extract(DestinyItemCategoryDefinition.json, '$.displayProperties.name'), json_extract(DestinyItemCategoryDefinition.json, '$.grantDestinySubType')
    FROM DestinyItemCategoryDefinition
    WHERE json_extract(DestinyItemCategoryDefinition.json, '$.grantDestinyItemType') = 0
    AND json_extract(DestinyItemCategoryDefinition.json, '$.grantDestinySubType') != 0
    AND json_extract(DestinyItemCategoryDefinition.json, '$.parentCategoryHashes') = '[]'
    AND json_extract(DestinyItemCategoryDefinition.json, '$.index') < 100
    AND json_extract(DestinyItemCategoryDefinition.json, '$.index') != 47`,
    (err, row) => {
      if (err) throw err;
      const params = Object.values(row);
      const type = { name: params[0], enum: params[1] };
      weaponTypes.push(type);
    },
  );
  return weaponTypes;
};

export const getWeaponSocketSets = async (weaponHash) => {
  const weaponID = weaponHash >> 32;
  const weaponSocketsSets = [];
  const db = await openDb();
  await db.each(
    `SELECT json_extract(DestinyInventoryItemDefinition.json, '$.sockets.socketEntries')
  FROM DestinyInventoryItemDefinition
  WHERE DestinyInventoryItemDefinition.id = $weaponID`,
    { $weaponID: weaponID },
    (err, row) => {
      if (err) throw err;
      const [params] = Object.values(row);
      const sockets = JSON.parse(params).slice(1, 5);
      sockets.forEach((socket) => {
        weaponSocketsSets.push(socket.randomizedPlugSetHash);
      });
    },
  );
  return weaponSocketsSets;
};

export const getPlugSet = async (plugSetHash) => {
  const plugSetID = plugSetHash >> 32;
  const plugSet = [];
  const db = await openDb();
  await db.each(
    `SELECT json_extract(DestinyPlugSetDefinition.json, '$.reusablePlugItems')
  FROM DestinyPlugSetDefinition
  WHERE DestinyPlugSetDefinition.id = $plugSetID`,
    { $plugSetID: plugSetID },
    (err, row) => {
      if (err) throw err;
      const [params] = Object.values(row);
      const plugs = JSON.parse(params);
      plugs.forEach((plug) => {
        plugSet.push(plug.plugItemHash);
      });
    },
  );
  return plugSet;
};

export const getPlugDefinition = async (plugHash) => {
  const plugID = plugHash >> 32;
  const plug = [];
  const db = await openDb();
  await db.each(
    `SELECT json_extract(DestinyInventoryItemDefinition.json, '$.displayProperties.name'), json_extract(DestinyInventoryItemDefinition.json, '$.hash')
      FROM DestinyInventoryItemDefinition
      WHERE DestinyInventoryItemDefinition.id = $plugID`,
    { $plugID: plugID },
    (err, row) => {
      if (err) throw err;
      const params = Object.values(row);
      plug.push({ name: params[0], enum: params[1] });
    },
  );
  return plug[0];
};
