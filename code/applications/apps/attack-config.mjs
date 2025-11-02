import DocumentConfig from "../api/document-config.mjs";

export default class AttackConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/attack-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.ATTACK.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const isPhysical = this.document.system._defaultAttackType === "physical";
    context.accuracyPlaceholder = isPhysical
      ? "@stats.strength + @stats.dexterity"
      : "@stats.intelligence + @stats.spirit";
    context.accuracyValue = context.disabled
      ? this.document.system.attack.accuracy
      : this.document.system._source.attack.accuracy;

    context.damagePlaceholder = isPhysical ? "@stats.strength" : "@stats.spirit";
    context.damageValue = context.disabled
      ? this.document.system.attack.damage
      : this.document.system._source.attack.damage;

    return context;
  }
}
