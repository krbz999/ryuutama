import RyuutamaActorSheet from "./actor-sheet.mjs";

/**
 * Ryuutama Monster Sheet.
 * @extends RyuutamaActorSheet
 */
export default class RyuutamaMonsterSheet extends RyuutamaActorSheet {
  /** @override */
  static PARTS = {
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/monster-sheet/details.hbs",
      classes: ["tab", "standard-form", "scrollable"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes" },
        { id: "details" },
      ],
      initial: "attributes",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tabs = this._prepareTabs("primary");

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      description: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.description.value, enrichment),
      special: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.description.special.value, enrichment),
    };

    context.attackImage = ryuutama.config.unarmedConfiguration.icon;

    context.seasonOptions = Object.entries(ryuutama.config.seasons).map(([k, v]) => {
      return { value: k, label: v.label };
    });

    return context;
  }
}
