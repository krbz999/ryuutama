import * as applications from "./code/applications/_module.mjs";
import * as canvas from "./code/canvas/_module.mjs";
import * as config from "./code/config.mjs";
import * as constants from "./code/constants.mjs";
import * as data from "./code/data/_module.mjs";
import * as dice from "./code/dice/_module.mjs";
import * as documents from "./code/documents/_module.mjs";
import * as helpers from "./code/helpers/_module.mjs";
import * as utils from "./code/utils/_module.mjs";

import registerSettings from "./code/settings.mjs";

/**
 * @import SpellRegistry from "./code/helpers/registries/spells.mjs";
 */

globalThis.ryuutama = {
  applications,
  canvas,
  config,
  data,
  dice,
  documents,
  helpers,
  utils,
  CONST: constants,
  id: "ryuutama",
  registries: {
    /** @type {SpellRegistry} */
    spells: null,
  },
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

  // Register fonts.
  helpers.fonts.registerFonts();

  // Define custom elements.
  const defineElements = window => {
    window.customElements.define(applications.elements.DamageTray.tagName, applications.elements.DamageTray);
    window.customElements.define(applications.elements.EffectTray.tagName, applications.elements.EffectTray);
    window.customElements.define(applications.elements.HealingTray.tagName, applications.elements.HealingTray);
    window.customElements.define(applications.elements.IconElement.tagName, applications.elements.IconElement);
    window.customElements.define(applications.elements.ProgressBar.tagName, applications.elements.ProgressBar);
  };
  defineElements(window);
  Hooks.on("openDetachedWindow", (id, window) => defineElements(window));

  CONFIG.ActiveEffect.documentClass = documents.RyuutamaActiveEffect;
  CONFIG.ActiveEffect.dataModels.standard = data.effect.StandardData;
  CONFIG.ActiveEffect.dataModels.status = data.effect.StatusData;
  CONFIG.ActiveEffect.expiryAction = "delete";

  CONFIG.Actor.collection = documents.collections.RyuutamaActors;
  CONFIG.Actor.documentClass = documents.RyuutamaActor;
  CONFIG.Actor.dataModels.monster = data.actor.MonsterData;
  CONFIG.Actor.dataModels.party = data.actor.PartyData;
  // CONFIG.Actor.dataModels.ryuujin = data.actor.RyuujinData;
  CONFIG.Actor.dataModels.traveler = data.actor.TravelerData;
  CONFIG.Actor.defaultType = "traveler";

  CONFIG.ChatMessage.documentClass = documents.RyuutamaChatMessage;
  CONFIG.ChatMessage.dataModels.standard = data.message.StandardData;

  CONFIG.Combat.documentClass = documents.RyuutamaCombat;
  CONFIG.Combat.dataModels.standard = data.combat.StandardData;
  CONFIG.Combat.fallbackTurnMarker = documents.RyuutamaCombat.TURN_MARKER;
  CONFIG.Combat.initiative.decimals = 0;

  CONFIG.Combatant.documentClass = documents.RyuutamaCombatant;
  CONFIG.Combatant.dataModels.standard = data.combatant.StandardData;

  CONFIG.CombatantGroup.documentClass = documents.RyuutamaCombatantGroup;

  CONFIG.Item.collection = documents.collections.RyuutamaItems;
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
  CONFIG.Item.defaultType = "weapon";

  CONFIG.JournalEntry.documentClass = documents.RyuutamaJournalEntry;

  CONFIG.JournalEntryPage.documentClass = documents.RyuutamaJournalEntryPage;
  CONFIG.JournalEntryPage.dataModels.reference = data.journalEntryPage.ReferenceData;

  CONFIG.Region.documentClass = documents.RyuutamaRegionDocument;

  CONFIG.Scene.documentClass = documents.RyuutamaScene;

  CONFIG.Token.documentClass = documents.RyuutamaTokenDocument;
  CONFIG.Token.objectClass = canvas.placeables.RyuutamaToken;

  CONFIG.time.roundTime = 10;

  CONFIG.ui.actors = applications.sidebar.tabs.RyuutamaActorDirectory;
  CONFIG.ui.combat = applications.sidebar.tabs.RyuutamaCombatTracker;
  CONFIG.ui.compendium = applications.sidebar.tabs.RyuutamaCompendiumDirectory;
  CONFIG.ui.habitat = applications.ui.CurrentHabitat;
  CONFIG.ui.items = applications.sidebar.tabs.RyuutamaItemDirectory;
  CONFIG.ui.pause = applications.ui.RyuutamaGamePause;

  CONFIG.ux.TooltipManager = helpers.interaction.RyuutamaTooltipManager;

  // Assign chat commands.
  for (const enricher of Object.values(helpers.enrichers)) {
    const { id, chatPattern: rgx, chatMessage: fn } = enricher;
    if (id && (rgx instanceof RegExp) && (typeof fn === "function"))
      CONFIG.ui.chat.CHAT_COMMANDS[id] = { rgx, fn };
  }

  // Additional indexed fields.
  CONFIG.Actor.compendiumIndexFields.push(...applications.apps.RyuutamaCompendiumBrowser.COMPENDIUM_INDEX_PATHS.Actor);
  CONFIG.Item.compendiumIndexFields.push(...applications.apps.RyuutamaCompendiumBrowser.COMPENDIUM_INDEX_PATHS.Item);

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
  Object.assign(CONFIG.Dice.termTypes, {
    CheckDie: dice.CheckDie,
  });

  // Register sheets.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item, ryuutama.id, applications.sheets.items.RyuutamaItemSheet,
    { label: "RYUUTAMA.SHEETS.ITEM.ItemSheet", makeDefault: true },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.actors.RyuutamaTravelerSheet,
    { label: "RYUUTAMA.SHEETS.ACTOR.TravelerSheet", makeDefault: true, types: ["traveler"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.actors.RyuutamaPartySheet,
    { label: "RYUUTAMA.SHEETS.ACTOR.PartySheet", makeDefault: true, types: ["party"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor, ryuutama.id, applications.sheets.actors.RyuutamaMonsterSheet,
    { label: "RYUUTAMA.SHEETS.ACTOR.MonsterSheet", makeDefault: true, types: ["monster"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.JournalEntryPage, ryuutama.id, applications.sheets.pages.ReferencePageSheet,
    { label: "RYUUTAMA.SHEETS.PAGE.ReferencePageSheet", makeDefault: true, types: ["reference"] },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Combatant, ryuutama.id, applications.sheets.combatants.RyuutamaCombatantSheet,
    { label: "RYUUTAMA.SHEETS.COMBATANT.CombatantSheet", makeDefault: true },
  );

  // Register status effects.
  CONFIG.statusEffects = {};
  Object.values(constants.STATUS_EFFECTS).forEach(id => {
    const { _id, img, name, hud } = config.statusEffects[id];
    CONFIG.statusEffects[id] = { id, _id, img, name, hud };
  });
  Object.entries(config.specialStatusEffects).forEach(([id, effectData]) => {
    CONFIG.statusEffects[id] = { id, ...effectData };
  });
  CONFIG.specialStatusEffects.DEFEATED = "defeated";
});

/* -------------------------------------------------- */

Hooks.once("i18nInit", () => {
  // Prelocalize the configs.
  for (const [record, options] of helpers.Prelocalization.toLocalize) {
    utils.prelocalize(record, options);
  }
  helpers.Prelocalization.toLocalize = [];

  // Prelocalize datamodels.
  Object.values(data.advancement.Advancement.TYPES).forEach(model => {
    foundry.helpers.Localization.localizeDataModel(model);
  });

  // Configure and localize sources.
  helpers.Prelocalization.configureSources();
});

/* -------------------------------------------------- */

Hooks.once("setup", () => {
  Handlebars.registerHelper({
    "ryuutama-tooltip": helpers.interaction.RyuutamaTooltipManager.handlebarsHelper,
  });

  game.packs.forEach(pack => {
    if (pack.metadata.type !== "Item") return;
    pack.applicationClass = applications.sidebar.apps.RyuutamaItemCompendium;
  });
});

/* -------------------------------------------------- */

Hooks.once("ready", () => {
  game.tooltip.observe();

  foundry.applications.handlebars.loadTemplates({
    // ACTOR PARTIALS
    "actor-resources": "systems/ryuutama/templates/sheets/actors/resources.hbs",

    // SHARED PARTIALS
    "document-list": "systems/ryuutama/templates/sheets/shared/document-list.hbs",
  });

  // Render UI elements.
  ui.habitat.render({ force: true });

  // Load additional index fields.
  const { Actor, Item } = Object.groupBy(game.packs, pack => pack.metadata.type);
  const promises = Actor.concat(Item).map(pack => pack.getIndex());

  // Deprecated since 2.1.0 until 2.3.0.
  Object.assign(ryuutama.registries, {
    spells: new helpers.registries.SpellRegistry(),
  });
  Object.freeze(ryuutama.registries);
  Promise.all(promises).then(() => ryuutama.registries.spells.initialize());
});
