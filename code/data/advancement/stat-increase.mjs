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
  get isConfigured() {

    const actor = this.parent.parent ?? this.parent;
    const getScore = ability => {
      const base = actor.system._source.abilities[ability].value;
      const increases = actor.system.advancements.documentsByType[this.type]
        .filter(a => a.choice.chosen === ability).length;

      return base + 2 * increases;
    };

    return !!this.choice.chosen && (getScore(this.choice.chosen) < 12);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);

    const getScore = ability => {
      const base = context.actor.system._source.abilities[ability].value;
      const increases = context.actor.system.advancements.documentsByType[this.type]
        .filter(a => a.choice.chosen === ability).length;

      return base + 2 * increases;
    };

    context.abilityOptions = Object.entries(ryuutama.config.abilityScores)
      // .filter(([k, v]) => getScore(k) < 12)
      .map(([k, v]) => ({ value: k, label: v.label }));
  }

  /* -------------------------------------------------- */

  /** @override */
  _getAdvancementResult(actor) {
    // const ability = this.choice.chosen;
    // const update = { [`system.abilities.${ability}.value`]: actor.system._source.abilities[ability].value + 2 };
    // return { result: update, type: "actor" };
    return super._getAdvancementResult(actor);
  }
}
