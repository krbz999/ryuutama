import EquippableData from "./equippable.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A shared subclass used for travel gear; accessories, capes, hats, shoes, staffs.
 */
export default class GearData extends EquippableData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      sort: 204,
      defaultArtwork: "systems/ryuutama/assets/official/icons/items/equipment.svg",
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      gear: new SchemaField({
        custom: new StringField({ required: true }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.GEAR",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/gear.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
    this.gear.check = 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.modifiers.has("highQuality")) this.gear.check++;
    if (this.modifiers.has("plusOne")) this.gear.check++;
  }
}
