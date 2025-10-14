import DocumentConfig from "../api/document-config.mjs";

export default class MasteredWeaponsConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/mastered-weapons-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.WEAPONS.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.mastered = [];
    const levelOptions = {
      0: game.i18n.localize("RYUUTAMA.TRAVELER.WEAPONS.masteryLevel0"),
      1: game.i18n.localize("RYUUTAMA.TRAVELER.WEAPONS.masteryLevel1"),
      2: game.i18n.localize("RYUUTAMA.TRAVELER.WEAPONS.masteryLevel2"),
    };

    for (const weaponType in ryuutama.config.weaponCategories) {
      const mastered = weaponType in this.document.system._source.mastered.weapons;
      const label = ryuutama.config.weaponCategories[weaponType].label;
      const level = this.document.system._source.mastered.weapons[weaponType] ?? 1;
      context.mastered.push({
        mastered, label, level,
        key: weaponType,
        options: { ...levelOptions },
      });
    }

    return context;
  }
}
