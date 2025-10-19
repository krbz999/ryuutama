import BaseData from "./templates/base.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class HerbData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      level: new NumberField({ initial: 1, nullable: false, integer: true, min: 1, max: 5 }),
      price: new SchemaField({
        value: new NumberField({ nullable: true, initial: null, min: 0, integer: true }),
      }),
      category: new SchemaField({
        value: new StringField({ required: true, initial: "physical", choices: () => ryuutama.config.herbTypes }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get HTMLFields() {
    return {
      ...super.HTMLFields,
      effect: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.HERB",
  ];

  /* -------------------------------------------------- */

  /**
   * The amount this adds to the capacity.
   * @type {number}
   */
  get weight() {
    return 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.price.value === null) {
      switch (this.level) {
        case 1: this.price.total = 100; break;
        case 2: this.price.total = 300; break;
        case 3: this.price.total = 800; break;
      }
    }
  }
}
