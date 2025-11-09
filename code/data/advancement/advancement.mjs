import PseudoDocument from "../pseudo-document.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { NumberField } = foundry.data.fields;

export default class Advancement extends PseudoDocument {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      level: new NumberField({ nullable: false, integer: true, min: 1, max: 10, initial: 1 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static get documentConfig() {
    return {
      [ryuutama.data.advancement.HabitatAdvancement.TYPE]: ryuutama.data.advancement.HabitatAdvancement,
      [ryuutama.data.advancement.ResourceAdvancement.TYPE]: ryuutama.data.advancement.ResourceAdvancement,
      [ryuutama.data.advancement.StatIncreaseAdvancement.TYPE]: ryuutama.data.advancement.StatIncreaseAdvancement,
      [ryuutama.data.advancement.StatsAdvancement.TYPE]: ryuutama.data.advancement.StatsAdvancement,
      [ryuutama.data.advancement.StatusImmunityAdvancement.TYPE]: ryuutama.data.advancement.StatusImmunityAdvancement,
      [ryuutama.data.advancement.TypeAdvancement.TYPE]: ryuutama.data.advancement.TypeAdvancement,
      [ryuutama.data.advancement.WeaponAdvancement.TYPE]: ryuutama.data.advancement.WeaponAdvancement,
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static documentName = "Advancement";

  /* -------------------------------------------------- */

  /** @override */
  static embedded = "advancements";

  /* -------------------------------------------------- */

  /**
   * A handlebars template used for rendering this advancement when leveling up.
   * @type {string}
   */
  static CONFIGURE_TEMPLATE = "";

  /* -------------------------------------------------- */

  /**
   * Is this advancement fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare data when this advancement is presented when leveling up.
   * @param {object} context    Current context. **will be mutated**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  async _prepareAdvancementContext(context, options) {
    context.fields = this.schema.fields;
    context.advancement = this;
    context.title = game.i18n.format("RYUUTAMA.PSEUDO.ADVANCEMENT.configureTitle", {
      name: game.i18n.localize(`TYPES.Advancement.${this.constructor.TYPE}`),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Determine the result of this advancement.
   * @param {RyuutamaActor} actor   The actor advancing.
   * @returns {{ type: "actor"|"advancement", result: object|Advancement }}
   */
  _getAdvancementResult(actor) {
    return { type: "advancement", result: this };
  }

  /* -------------------------------------------------- */

  /**
   * Return advancement types that should be available choices
   * depending on this advancement's current configuration.
   * @returns {Promise<string[]>}
   */
  async _getChildTypes() {
    return [];
  }
}
