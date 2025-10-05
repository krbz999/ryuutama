import DocumentConfig from "../api/document-config.mjs";

export default class MonsterHabitatConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/monster-habitat-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("RYUUTAMA.MONSTER.HABITAT.title")}: ${this.document.name}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const terrains = new Set(this.document.system._source.environment.habitat);
    const hasAll = terrains.has("ALL");

    const terrainOptions = [];
    for (const [value, { label }] of Object.entries(ryuutama.config.monsterTerrains)) {
      terrainOptions.push({ value, label, checked: terrains.has(value), disabled: hasAll });
    }

    return Object.assign(context, { terrainOptions, hasAll });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const processed = super._processFormData(event, form, formData);

    const habitat = processed.habitat.filter(_ => _);
    foundry.utils.setProperty(processed, "system.environment.habitat", habitat);
    delete processed.habitat;

    return processed;
  }
}
