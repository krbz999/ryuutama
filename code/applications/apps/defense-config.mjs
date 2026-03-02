import DocumentConfig from "../api/document-config.mjs";

export default class DefenseConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/defense-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.DEFENSE.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.armorLabel = _loc(
      this.document.type === "traveler"
        ? "RYUUTAMA.ACTOR.TRAVELER.baseDefensePoints"
        : "RYUUTAMA.ACTOR.MONSTER.baseArmor",
    );
    return context;
  }
}
