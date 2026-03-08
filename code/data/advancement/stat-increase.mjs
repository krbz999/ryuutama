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
    "RYUUTAMA.PSEUDO.ADVANCEMENT.INCREASE",
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
      const base = context.actor.system._source.abilities[ability].value;
      return base;
    };

    context.abilityOptions = Object.entries(ryuutama.CONST.ABILITIES._toConfig)
      .filter(([k]) => getScore(k) < 12)
      .map(([k, { label }]) => ({ value: k, label }));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _getAdvancementResults(actor) {
    const ability = this.choice.chosen;
    const update = { [`system.abilities.${ability}.value`]: actor.system._source.abilities[ability].value + 2 };
    return [{ result: update, type: "actor" }];
  }
}
