import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

/**
 * Base actor sheet.
 * @extends RyuutamaDocumentSheet
 */
export default class RyuutamaMonsterSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      rollCheck: RyuutamaMonsterSheet.#rollCheck,
    },
  };

  /* -------------------------------------------------- */

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

    // Options for abilities.
    const abilityOptions = [2, 4, 6, 8, 10, 12].map(n => ({ value: n, label: `d${n}` }));
    context.abilities = Object.keys(ryuutama.config.abilityScores).map(abi => {
      return {
        field: this.document.system.schema.getField(`abilities.${abi}.value`),
        disabled: context.disabled,
        options: abilityOptions,
        value: context.disabled
          ? this.document.system.abilities[abi].value
          : this.document.system._source.abilities[abi].value,
      };
    });

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      description: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.description.value, enrichment),
    };

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaMonsterSheet
   */
  static #rollCheck(event, target) {
    const type = target.dataset.check;
    this.document.system.rollCheck({ type });
  }
}
