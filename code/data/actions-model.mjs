/**
 * @import RyuutamaItem from "../documents/item.mjs";
 */

const { SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * An embedded model for items that perform actions.
 */
export default class ActionsModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      damage: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
      healing: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.ITEM.ACTIONS",
  ];

  /* -------------------------------------------------- */

  /**
   * The item on which this is embedded.
   * @type {RyuutamaItem}
   */
  get item() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Format all data to message parts.
   * @returns {Record<string, object>}
   */
  toMessagePartData() {
    const parts = [];

    // Effects
    const effects = this.toEffectsPartData();
    if (effects) parts.push(effects);

    // Damage
    const damage = this.toDamagePartData();
    if (damage) parts.push(damage);

    // Healing
    const healing = this.toHealingPartData();
    if (healing) parts.push(healing);

    return Object.fromEntries(parts.map(part => [foundry.utils.randomID(), part]));
  }

  /* -------------------------------------------------- */

  /**
   * Format effects to part data.
   * @returns {object|null}
   */
  toEffectsPartData() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Format damage to part data.
   * @returns {object|null}
   */
  toDamagePartData() {
    if (!this.damage.formula) return null;
    const partData = { type: "damage", rolls: [] };
    const properties = this.item.system.getRollOptions("damage").union(this.damage.properties);
    const options = Object.fromEntries(Array.from(properties).map(p => [p, true]));
    const roll = new ryuutama.dice.DamageRoll(this.damage.formula, this.item.getRollData(), options);
    partData.rolls.push(roll);
    return partData;
  }

  /* -------------------------------------------------- */

  /**
   * Format healing to part data.
   * @returns {object|null}
   */
  toHealingPartData() {
    if (!this.healing.formula) return null;
    const partData = { type: "healing", rolls: [] };
    const options = {};
    const roll = new ryuutama.dice.HealingRoll(this.healing.formula, this.item.getRollData(), options);
    partData.rolls.push(roll);
    return partData;
  }
}
