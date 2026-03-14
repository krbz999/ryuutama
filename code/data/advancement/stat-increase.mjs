import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure increases to abilities.
 */
export default class StatIncreaseAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({
          blank: true,
          required: true,
          choices: ryuutama.CONST.ABILITIES._toConfig,
        }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "statIncrease";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/stat-increase.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ADVANCEMENT.STAT_INCREASE",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isConfigured() {
    return !!this.choice.chosen;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);

    const getScore = ability => {
      let base = context.actor.system._source.abilities[ability].value;
      const steps = context.actor.system.abilities[ability].advancement;
      const field = context.actor.system.schema.getField(`abilities.${ability}.value`);
      for (let i = 0; i < steps; i++) base = field._applyChangeAdd(base, 1);
      return base;
    };

    context.abilityOptions = Object.entries(ryuutama.CONST.ABILITIES._toConfig)
      .filter(([k]) => getScore(k) < 12)
      .map(([k, { label }]) => ({ value: k, label }));
  }
}
