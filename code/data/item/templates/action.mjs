import BaseData from "./base.mjs";

/**
 * @import RyuutamaChatMessage from "../../../documents/chat-message.mjs";
 */

const { SchemaField, StringField, TypedSchemaField } = foundry.data.fields;

export default class ActionData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      action: new TypedSchemaField(ryuutama.data.action.Action.TYPES, { nullable: true, initial: null, required: true }),
      roll: new SchemaField({
        flavor: new StringField({ required: true }),
        formula: new ryuutama.data.fields.FormulaField(),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.ACTION",
  ];

  /* -------------------------------------------------- */

  /**
   * Use this actionable item.
   * @returns {Promise<RyuutamaChatMessage|null>}
   */
  async use() {
    const action = this.action;
    let part;
    if (action) {
      part = await action.use();
      if (!part) return null;
    }

    const rollPart = await this.#generateGenericRollPart();
    if (!rollPart) return null;

    const item = this.parent;
    let messageData = {
      type: "standard",
      system: { parts: [] },
    };

    // Special handling for spells.
    if (item.type === "spell") {
      messageData = await item.actor.system.rollCheck(
        { type: "magic", magic: { item } },
        {},
        { create: false },
      );
      if (!messageData) return null;
    }

    if (rollPart.rolls.length) messageData.system.parts.push(rollPart);
    if (part) messageData.system.parts.push(part);
    return getDocumentClass("ChatMessage").create(messageData);
  }

  /* -------------------------------------------------- */

  /**
   * Generate the message part for the generic roll.
   * @returns {Promise<object>}
   */
  async #generateGenericRollPart() {
    const part = {
      type: "roll", rolls: [],
      flavor: this.roll.flavor,
    };
    if (this.roll.formula) {
      const roll = await new ryuutama.dice.BaseRoll(this.roll.formula, this.parent.getRollData()).evaluate();
      part.rolls.push(roll);
    }
    return part;
  }
}
