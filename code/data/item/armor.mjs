import PhysicalData from "./templates/physical.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

export default class ArmorData extends PhysicalData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      itemGroup: "weaponsArmor",
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.weaponsArmor",
      createSort: 101,
      defaultArtwork: "systems/ryuutama/assets/icons/items/armor.svg",
      sort: 103,
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      armor: new SchemaField({
        defense: new NumberField({ nullable: true, integer: true, initial: null }),
        penalty: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ARMOR",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/armor.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    let bonus = 0;
    if (this.modifiers.has("highQuality")) bonus++;
    if (this.modifiers.has("plusOne")) bonus++;
    this.armor.defense = this._source.armor.defense + bonus;
    if (this.modifiers.has("mythril") && (this.armor.penalty > 0)) this.armor.penalty = this._source.armor.penalty - 1;
  }
}
