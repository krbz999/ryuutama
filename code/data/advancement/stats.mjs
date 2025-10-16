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

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.StatsAdvancementDialog.create({ advancementClass: this, actor });
  }
}
