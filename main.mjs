import * as applications from "./code/applications/_module.mjs";
import * as canvas from "./code/canvas/_module.mjs";
import * as config from "./code/config.mjs";
import * as data from "./code/data/_module.mjs";
import * as dice from "./code/dice/_module.mjs";
import * as documents from "./code/documents/_module.mjs";
import * as helpers from "./code/helpers/_module.mjs";
import * as utils from "./code/utils/_module.mjs";

import registerSettings from "./code/settings.mjs";

globalThis.ryuutama = {
  applications,
  canvas,
  config,
  data,
  dice,
  documents,
  helpers,
  utils,
  id: "ryuutama",
};

/* -------------------------------------------------- */

Hooks.once("init", () => {
  registerSettings();

  // Define custom elements.
  window.customElements.define(applications.elements.InventoryElement.tagName, applications.elements.InventoryElement);

  CONFIG.ActiveEffect.documentClass = documents.RyuutamaActiveEffect;
  CONFIG.ActiveEffect.dataModels.status = data.effect.StatusData;

  CONFIG.Actor.collection = documents.collections.RyuutamaActors;
  CONFIG.Actor.documentClass = documents.RyuutamaActor;
  CONFIG.Actor.dataModels.monster = data.actor.MonsterData;
  CONFIG.Actor.dataModels.party = data.actor.PartyData;
  CONFIG.Actor.dataModels.ryuujin = data.actor.RyuujinData;
  CONFIG.Actor.dataModels.traveler = data.actor.TravelerData;

  CONFIG.ChatMessage.documentClass = documents.RyuutamaChatMessage;
  CONFIG.Combat.documentClass = documents.RyuutamaCombat;
  CONFIG.Combatant.documentClass = documents.RyuutamaCombatant;
  CONFIG.CombatantGroup.documentClass = documents.RyuutamaCombatantGroup;

  CONFIG.Item.documentClass = documents.RyuutamaItem;
  CONFIG.Item.dataModels.accessory = data.item.AccessoryData;
  CONFIG.Item.dataModels.armor = data.item.ArmorData;
  CONFIG.Item.dataModels.cape = data.item.CapeData;
  CONFIG.Item.dataModels.hat = data.item.HatData;
  CONFIG.Item.dataModels.shield = data.item.ShieldData;
  CONFIG.Item.dataModels.shoes = data.item.ShoesData;
  CONFIG.Item.dataModels.skill = data.item.SkillData;
  CONFIG.Item.dataModels.staff = data.item.StaffData;
  CONFIG.Item.dataModels.weapon = data.item.WeaponData;

  CONFIG.Scene.documentClass = documents.RyuutamaScene;
  CONFIG.Token.documentClass = documents.RyuutamaTokenDocument;

  CONFIG.time.roundTime = 10;

  CONFIG.ui.actors = applications.sidebar.tabs.RyuutamaActorDirectory;
  CONFIG.ui.combat = applications.sidebar.tabs.RyuutamaCombatTracker;

  // Assign rolls.
  CONFIG.Dice.rolls.unshift(dice.CheckRoll);
  Object.assign(CONFIG.Dice, {
    CheckRoll: dice.CheckRoll,
  });

  // Register sheets.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item, ryuutama.id, applications.sheets.RyuutamaItemSheet,
    { label: "RYUUTAMA.SHEETS.ItemSheet", makeDefault: true },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.RyuutamaActorSheet,
    { label: "RYUUTAMA.SHEETS.ActorSheet", makeDefault: true, types: ["traveler"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.RyuutamaMonsterSheet,
    { label: "RYUUTAMA.SHEETS.MonsterSheet", makeDefault: true, types: ["monster"] },
  );

  // Register status effects.
  // TODO: This becomes a Record in v14.
  CONFIG.statusEffects = Object.entries(config.statusEffects).map(([id, { _id, img, name }]) => {
    return { id, _id, img, name };
  });
});

/* -------------------------------------------------- */

Hooks.once("i18nInit", () => {
  for (const [record, options] of helpers.Prelocalization.toLocalize) {
    utils.prelocalize(record, options);
  }
  helpers.Prelocalization.toLocalize = [];
});

/* -------------------------------------------------- */

Hooks.once("setup", () => {
  CONFIG.Actor.defaultType = game.user.isGM ? "ryuujin" : "traveler";

  Handlebars.registerHelper({
    "inventory-element": applications.elements.InventoryElement.handlebarsHelper,
  });
});

/* -------------------------------------------------- */

Hooks.once("ready", () => {});
