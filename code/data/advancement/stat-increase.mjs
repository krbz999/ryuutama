import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class StatIncreaseAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: false, required: true, choices: () => ryuutama.config.abilityScores }),
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

  /** @inheritdoc */
  static async _prepareAdvancementContext(context, options) {
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
  static _determineResult(actor, formData) {
    formData = foundry.utils.expandObject(formData.object);
    const ability = formData.choice.chosen;
    const update = { [`system.abilities.${ability}.value`]: actor.system._source.abilities[ability].value + 2 };
    return { result: update, type: "actor" };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.abilities[this.choice.chosen].increases++;
  }
}
