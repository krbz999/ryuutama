import DocumentConfig from "../api/document-config.mjs";

export default class TravelerTypeConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/traveler-type-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.TRAVELER.TYPES.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.types = [];
    const selectOptions = {
      0: game.i18n.localize("RYUUTAMA.TRAVELER.TYPES.option0"),
      1: game.i18n.localize("RYUUTAMA.TRAVELER.TYPES.option1"),
      2: game.i18n.localize("RYUUTAMA.TRAVELER.TYPES.option2"),
    };

    for (const type in ryuutama.config.travelerTypes) {
      const label = ryuutama.config.travelerTypes[type].label;
      const value = this.document.system._source.details.type[type] ?? 0;
      context.types.push({ label, type, value, options: { ...selectOptions } });
    }

    return context;
  }
}
