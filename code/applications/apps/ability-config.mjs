import DocumentConfig from "../api/document-config.mjs";

export default class AbilityConfig extends DocumentConfig {
  /** @override */
  static DEFAULT_OPTIONS = {
    ability: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/ability-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * The ability being configured.
   * @type {string}
   */
  get ability() {
    return this.options.ability;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.ABILITIES.CONFIG.title", {
      ability: ryuutama.config.abilityScores[this.ability].label,
      name: this.document.name,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const abilityOptions = [2, 4, 6, 8, 10, 12, 20];
    if (this.document.type === "traveler") {
      abilityOptions.pop();
      abilityOptions.shift();
    }

    context.ability = {
      source: context.source.system.abilities[this.ability],
      fields: this.document.system.schema.getField(`abilities.${this.ability}`).fields,
      ability: this.ability,
      options: abilityOptions.map(n => ({ value: n, label: `d${n}` })),
    };

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = `${options.uniqueId}-${options.ability}`;
    return options;
  }
}
