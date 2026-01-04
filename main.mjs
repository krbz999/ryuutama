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
  // Register settings.
  registerSettings();

  // Register queries.
  helpers.registerQueries();

  // Register enrichers.
  CONFIG.TextEditor.enrichers = Object.values(helpers.enrichers)
    .map(({ id, pattern, enricher, onRender }) => ({ id, pattern, enricher, onRender }));

  // Define custom elements.
  const defineElements = window => {
    window.customElements.define(applications.elements.DamageTray.tagName, applications.elements.DamageTray);
    window.customElements.define(applications.elements.EffectTray.tagName, applications.elements.EffectTray);
    window.customElements.define(applications.elements.HealingTray.tagName, applications.elements.HealingTray);
    window.customElements.define(applications.elements.IconElement.tagName, applications.elements.IconElement);
    window.customElements.define(applications.elements.ProgressBar.tagName, applications.elements.ProgressBar);
    window.customElements.define(applications.elements.ResourceBar.tagName, applications.elements.ResourceBar);
  };
  defineElements(window);
  Hooks.on("openDetachedWindow", (id, window) => defineElements(window));

  CONFIG.ActiveEffect.documentClass = documents.RyuutamaActiveEffect;
  CONFIG.ActiveEffect.dataModels.standard = data.effect.StandardData;
  CONFIG.ActiveEffect.dataModels.status = data.effect.StatusData;

  CONFIG.Actor.collection = documents.collections.RyuutamaActors;
  CONFIG.Actor.documentClass = documents.RyuutamaActor;
  CONFIG.Actor.dataModels.monster = data.actor.MonsterData;
  // CONFIG.Actor.dataModels.party = data.actor.PartyData;
  // CONFIG.Actor.dataModels.ryuujin = data.actor.RyuujinData;
  CONFIG.Actor.dataModels.traveler = data.actor.TravelerData;

  CONFIG.ChatMessage.documentClass = documents.RyuutamaChatMessage;
  CONFIG.ChatMessage.dataModels.damage = data.message.DamageData;
  CONFIG.ChatMessage.dataModels.standard = data.message.StandardData;

  CONFIG.Combat.documentClass = documents.RyuutamaCombat;
  CONFIG.Combat.dataModels.standard = data.combat.StandardData;

  CONFIG.Combatant.documentClass = documents.RyuutamaCombatant;
  CONFIG.Combatant.dataModels.standard = data.combatant.StandardData;

  CONFIG.CombatantGroup.documentClass = documents.RyuutamaCombatantGroup;

  CONFIG.Item.documentClass = documents.RyuutamaItem;
  CONFIG.Item.dataModels.accessory = data.item.AccessoryData;
  CONFIG.Item.dataModels.animal = data.item.AnimalData;
  CONFIG.Item.dataModels.armor = data.item.ArmorData;
  CONFIG.Item.dataModels.cape = data.item.CapeData;
  CONFIG.Item.dataModels.class = data.item.ClassData;
  CONFIG.Item.dataModels.container = data.item.ContainerData;
  CONFIG.Item.dataModels.hat = data.item.HatData;
  CONFIG.Item.dataModels.herb = data.item.HerbData;
  CONFIG.Item.dataModels.shield = data.item.ShieldData;
  CONFIG.Item.dataModels.shoes = data.item.ShoesData;
  CONFIG.Item.dataModels.skill = data.item.SkillData;
  CONFIG.Item.dataModels.spell = data.item.SpellData;
  CONFIG.Item.dataModels.staff = data.item.StaffData;
  CONFIG.Item.dataModels.weapon = data.item.WeaponData;

  CONFIG.JournalEntryPage.documentClass = documents.RyuutamaJournalEntryPage;
  CONFIG.JournalEntryPage.dataModels.reference = data.journalEntryPage.ReferenceData;

  CONFIG.Scene.documentClass = documents.RyuutamaScene;

  CONFIG.Token.documentClass = documents.RyuutamaTokenDocument;
  CONFIG.Token.objectClass = canvas.placeables.RyuutamaToken;

  CONFIG.time.roundTime = 10;

  CONFIG.ui.actors = applications.sidebar.tabs.RyuutamaActorDirectory;
  CONFIG.ui.combat = applications.sidebar.tabs.RyuutamaCombatTracker;
  CONFIG.ui.habitat = applications.ui.CurrentHabitat;
  CONFIG.ui.pause = applications.ui.RyuutamaGamePause;

  CONFIG.ux.TooltipManager = helpers.interaction.RyuutamaTooltipManager;

  // Assign rolls.
  CONFIG.Dice.rolls.unshift(dice.HealingRoll);
  CONFIG.Dice.rolls.unshift(dice.DamageRoll);
  CONFIG.Dice.rolls.unshift(dice.CheckRoll);
  CONFIG.Dice.rolls.unshift(dice.BaseRoll);
  Object.assign(CONFIG.Dice, {
    BaseRoll: dice.BaseRoll,
    CheckRoll: dice.CheckRoll,
    DamageRoll: dice.DamageRoll,
    HealingRoll: dice.HealingRoll,
  });

  // Register sheets.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item, ryuutama.id, applications.sheets.RyuutamaItemSheet,
    { label: "RYUUTAMA.SHEETS.ItemSheet", makeDefault: true },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.actors.RyuutamaTravelerSheet,
    { label: "RYUUTAMA.SHEETS.ActorSheet", makeDefault: true, types: ["traveler"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.actors.RyuutamaMonsterSheet,
    { label: "RYUUTAMA.SHEETS.MonsterSheet", makeDefault: true, types: ["monster"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.JournalEntryPage, ryuutama.id, applications.sheets.pages.ReferencePageSheet,
    { label: "RYUUTAMA.SHEETS.ReferencePageSheet", makeDefault: true, types: ["reference"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Combatant, ryuutama.id, applications.sheets.combatants.RyuutamaCombatantSheet,
    { label: "RYUUTAMA.SHEETS.CombatantSheet", makeDefault: true },
  );

  // Register status effects.
  // TODO: This becomes a Record in v14.
  CONFIG.statusEffects = Object.entries(config.statusEffects).map(([id, { _id, img, name, hud }]) => {
    return { id, _id, img, name, hud };
  });
  Object.entries(config.specialStatusEffects).forEach(([id, effectData]) => {
    CONFIG.statusEffects.push({ ...effectData, id });
  });
  CONFIG.specialStatusEffects.DEFEATED = "defeated";
});

/* -------------------------------------------------- */

Hooks.once("i18nInit", () => {
  for (const [record, options] of helpers.Prelocalization.toLocalize) {
    utils.prelocalize(record, options);
  }
  helpers.Prelocalization.toLocalize = [];

  for (const DM of Object.values(data.advancement.Advancement.documentConfig)) {
    foundry.helpers.Localization.localizeDataModel(DM);
  }

  helpers.Prelocalization.configureSources();
});

/* -------------------------------------------------- */

Hooks.once("setup", () => {
  CONFIG.Actor.defaultType = game.user.isGM ? "monster" : "traveler";

  Handlebars.registerHelper({
    "ryuutama-tooltip": helpers.interaction.RyuutamaTooltipManager.handlebarsHelper,
  });
});

/* -------------------------------------------------- */

Hooks.once("ready", () => {
  game.tooltip.observe();

  foundry.applications.handlebars.loadTemplates({
    // ACTOR PARTIALS
    "actor-abilities": "systems/ryuutama/templates/sheets/shared/abilities.hbs",
    "actor-defense": "systems/ryuutama/templates/sheets/shared/defense.hbs",
    "actor-resources": "systems/ryuutama/templates/sheets/shared/resources.hbs",
    "actor-statuses": "systems/ryuutama/templates/sheets/shared/statuses.hbs",

    // SHARED PARTIALS
    "document-list": "systems/ryuutama/templates/sheets/shared/document-list.hbs",
  });
});

/* -------------------------------------------------- */

Hooks.once("renderPlayers", () => {
  ui.habitat.render({ force: true });
});

/* -------------------------------------------------- */

Hooks.on("chatMessage", (chatLog, message, chatData) => {
  for (const { chatPattern, chatMessage } of Object.values(helpers.enrichers)) {
    if (!chatPattern?.test(message)) continue;
    chatMessage(message, chatData);
    return false;
  }
});
