import Advancement from "./advancement.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure starting abilities.
 */
export default class StatsAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        type: new StringField({ blank: false, required: true, choices: () => StatsAdvancement.STARTING_SCORES }),
        chosen: new SchemaField({
          strength: new NumberField({ min: 4, max: 8, step: 2, initial: 6, nullable: false }),
          dexterity: new NumberField({ min: 4, max: 8, step: 2, initial: 6, nullable: false }),
          intelligence: new NumberField({ min: 4, max: 8, step: 2, initial: 6, nullable: false }),
          spirit: new NumberField({ min: 4, max: 8, step: 2, initial: 6, nullable: false }),
        }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "stats";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/stats.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.STATS",
  ];

  /* -------------------------------------------------- */

  /**
   * The sets to choose from.
   * @type {Record<string, { stats: number[], label: string }>}
   */
  static STARTING_SCORES = Object.freeze({
    average: {
      label: "RYUUTAMA.PSEUDO.ADVANCEMENT.STATS.average",
      stats: [6, 6, 6, 6],
    },
    standard: {
      label: "RYUUTAMA.PSEUDO.ADVANCEMENT.STATS.standard",
      stats: [4, 6, 6, 8],
    },
    specialized: {
      label: "RYUUTAMA.PSEUDO.ADVANCEMENT.STATS.specialized",
      stats: [4, 4, 8, 8],
    },
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.typeOptions = Object.entries(StatsAdvancement.STARTING_SCORES).map(([k, v]) => {
      return { value: k, label: game.i18n.localize(v.label) };
    });
    context.valid = false;
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineValidity(formData) {
    formData = foundry.utils.expandObject(formData.object);
    const type = formData.choice.type;
    const set = [...StatsAdvancement.STARTING_SCORES[type].stats];
    for (const k in ryuutama.config.abilityScores) {
      const value = formData.choice.chosen[k];
      set.findSplice(v => v === value);
    }
    return set.length === 0;
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineResult(actor, formData) {
    formData = foundry.utils.expandObject(formData.object);
    const update = {};
    for (const k in ryuutama.config.abilityScores) {
      update[`system.abilities.${k}.value`] = formData.choice.chosen[k];
    }

    update["system.resources.stamina.max"] = 2 * update["system.abilities.strength.value"];
    update["system.resources.mental.max"] = 2 * update["system.abilities.spirit.value"];
    return { result: update, type: "actor" };
  }
}
