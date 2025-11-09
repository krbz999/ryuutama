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
        chosen: new StringField({ blank: true, required: true, choices: () => ryuutama.config.abilityScores }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "statIncrease";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/stat-increase.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.INCREASE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  get isFullyConfigured() {
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

    context.abilityOptions = Object.entries(ryuutama.config.abilityScores)
      .filter(([k, v]) => getScore(k) < 12)
      .map(([k, v]) => ({ value: k, label: v.label }));
  }

  /* -------------------------------------------------- */

  /** @override */
  _getAdvancementResult() {
    const ability = this.choice.chosen;
    // `parent` is the actor itself when the advancement is ephemeral, otherwise `document`.
    const update = { [`system.abilities.${ability}.value`]: this.parent.system._source.abilities[ability].value + 2 };
    return { result: update, type: "actor" };
  }
}
