import EquippableData from "./templates/equippable.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

export default class ArmorData extends EquippableData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.weaponsArmor",
      createSort: 101,
      defaultArtwork: "systems/ryuutama/assets/icons/items/armor.svg",
      itemGroup: "weaponsArmor",
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
    "RYUUTAMA.ITEM.ARMOR",
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

  /** @inheritdoc */
  async _prepareTooltipContext(context, options = {}) {
    await super._prepareTooltipContext(context, options);

    context.tagSections.push({
      tags: [
        this.armor.defense ? { label: _loc("RYUUTAMA.TOOLTIP.defense", { formula: this.armor.defense }) } : null,
        this.armor.penalty ? { label: _loc("RYUUTAMA.TOOLTIP.penalty", { formula: this.armor.penalty }) } : null,
      ].filter(_ => _),
    });
  }
}
