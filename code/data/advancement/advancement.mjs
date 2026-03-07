/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { DocumentTypeField, NumberField, StringField } = foundry.data.fields;

export default class Advancement extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      level: new NumberField({ nullable: false, integer: true, min: 1, max: 10, initial: 1 }),
      type: new StringField({
        blank: false,
        required: true,
        initial: () => this.TYPE,
        validate: value => value === this.TYPE,
        validationError: `must be equal to ${this.TYPE}`,
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.ADVANCEMENT",
  ];

  /* -------------------------------------------------- */

  /**
   * The advancement subtype.
   * @type {string}
   */
  static TYPE;

  /* -------------------------------------------------- */

  /**
   * The advancement subtypes.
   * @type {Record<string, typeof Advancement>}
   */
  static get TYPES() {
    return Advancement.#TYPES ??= {
      [ryuutama.data.advancement.ClassAdvancement.TYPE]: ryuutama.data.advancement.ClassAdvancement,
      [ryuutama.data.advancement.HabitatAdvancement.TYPE]: ryuutama.data.advancement.HabitatAdvancement,
      [ryuutama.data.advancement.ResourceAdvancement.TYPE]: ryuutama.data.advancement.ResourceAdvancement,
      [ryuutama.data.advancement.StatIncreaseAdvancement.TYPE]: ryuutama.data.advancement.StatIncreaseAdvancement,
      [ryuutama.data.advancement.StatsAdvancement.TYPE]: ryuutama.data.advancement.StatsAdvancement,
      [ryuutama.data.advancement.StatusImmunityAdvancement.TYPE]: ryuutama.data.advancement.StatusImmunityAdvancement,
      [ryuutama.data.advancement.TypeAdvancement.TYPE]: ryuutama.data.advancement.TypeAdvancement,
      [ryuutama.data.advancement.WeaponAdvancement.TYPE]: ryuutama.data.advancement.WeaponAdvancement,
    };
  }
  static #TYPES;

  /* -------------------------------------------------- */

  /**
   * A handlebars template used for rendering this advancement when leveling up.
   * @type {string}
   */
  static CONFIGURE_TEMPLATE = "";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get document() {
    // If constructed as part of advancement, the document is the direct parent.
    if (this.isEphemeral) return this.parent;
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Unique id of this advancement.
   * @type {string}
   */
  id;

  /* -------------------------------------------------- */

  /**
   * Is this advancement fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return true;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configure(options = {}) {
    super._configure(options);
    Object.defineProperties(this, {
      isEphemeral: {
        value: options.isEphemeral ?? false,
        writable: false,
        enumerable: false,
      },
      chain: {
        value: options.chain ?? null,
        writable: false,
        enumerable: false,
      },
    });
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
  }

  /* -------------------------------------------------- */

  /**
   * Determine the result of this advancement.
   * @param {RyuutamaActor} actor   The actor advancing.
   * @returns {Promise<{ type: "actor"|"advancement"|"items", result: object|object[]|Advancement }[]>}
   */
  async _getAdvancementResults(actor) {
    return [{ type: "advancement", result: this }];
  }

  /* -------------------------------------------------- */

  /**
   * Return advancement types that should be available choices
   * depending on this advancement's current configuration.
   * @returns {Promise<Set<string>>}
   */
  async _getChildTypes() {
    return new Set();
  }
}
