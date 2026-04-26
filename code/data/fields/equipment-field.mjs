/**
 * A schema of a Traveler's equipment slots, which defines the equipment order of appearance,
 * allows for iterating over the initialized object, and stores references to local items.
 */
export default class EquipmentField extends foundry.data.fields.SchemaField {
  constructor(fields, options, context) {
    fields = EquipmentField.EQUIPMENT_ORDER.reduce((acc, name) => {
      acc[name] = new ryuutama.data.fields.LocalDocumentField(foundry.documents.Item, { subtype: name });
      return acc;
    }, {});
    super(fields, options, context);
  }

  /* -------------------------------------------------- */

  /**
   * All equippable item types, and the order in which they appear on the traveler sheet.
   * @type {string[]}
   */
  static EQUIPMENT_ORDER = Object.freeze([
    "weapon",
    "shield",
    "armor",
    "hat",
    "cape",
    "shoes",
    "accessory",
    "staff",
  ]);

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeOverride(value, delta, model, change) {
    return value;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options) {
    const initialized = super.initialize(value, model, options);

    // Allow iterating over the object, yielding only items.
    initialized[Symbol.iterator] = function* () {
      for (const name of EquipmentField.EQUIPMENT_ORDER) {
        const item = this[name];
        if (item instanceof ryuutama.documents.RyuutamaItem) yield item;
      }
    };

    return initialized;
  }
}
