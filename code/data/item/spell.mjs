import BaseData from "./templates/base.mjs";

/**
 * @import RyuutamaChatMessage from "../../documents/chat-message.mjs";
 */

const { NumberField, SchemaField, StringField, TypedSchemaField } = foundry.data.fields;

export default class SpellData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      action: new TypedSchemaField(ryuutama.data.action.Action.TYPES, { nullable: true, initial: null, required: true }),
      category: new SchemaField({
        value: new StringField({
          required: true, initial: "incantation",
          choices: () => ryuutama.config.spellCategories,
        }),
      }),
      spell: new SchemaField({
        activation: new SchemaField({
          cast: new StringField({ required: true, initial: "normal", choices: () => ryuutama.config.spellActivationTypes }),
          mental: new NumberField({ initial: null, nullable: true, integer: true, min: 0 }),
        }),
        duration: new SchemaField({
          // TODO: allow for dice (eg 'd4 rounds')
          value: new NumberField({ initial: 1, nullable: false, integer: true, min: 1 }),
          type: new StringField({ required: true, initial: "instant", choices: () => ryuutama.config.spellDurationTypes }),
          custom: new StringField({ required: true }),
        }),
        level: new StringField({ required: true, initial: "low", choices: () => ryuutama.config.spellLevels }),
        range: new SchemaField({
          value: new StringField({ required: true, initial: "touch", choices: () => ryuutama.config.spellRangeTypes }),
        }),
        target: new SchemaField({
          custom: new StringField({ required: true }),
        }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.SPELL",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.spell.activation.mental) {
      this.spell.costLabel = game.i18n.format("RYUUTAMA.ITEM.SPELL.costLabel", { mp: this.spell.activation.mental });
    }

    this.spell.activation.label = ryuutama.config.spellActivationTypes[this.spell.activation.cast].label;

    this.spell.duration.label = this.spell.duration.type === "special"
      ? this.spell.duration.custom
      : ryuutama.config.spellDurationTypes[this.spell.duration.type].units
        ? game.i18n.format("RYUUTAMA.ITEM.SPELL.durationLabel", {
          type: ryuutama.config.spellDurationTypes[this.spell.duration.type].label,
          units: this.spell.duration.value,
        })
        : ryuutama.config.spellDurationTypes[this.spell.duration.type].label;

    this.spell.range.label = ryuutama.config.spellRangeTypes[this.spell.range.value].label;

    this.spell.target.label = this.spell.target.custom;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getRollOptions(type) {
    const options = super.getRollOptions(type);
    switch (type) {
      case "damage":
        options.add("magical");
        break;
    }
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * Use this spell.
   * @returns {Promise<RyuutamaChatMessage|null>}
   */
  async use() {
    const action = this.action;
    if (!action) {
      ui.notifications.error("RYUUTAMA.ITEM.SPELL.warnNoAction", { localize: true });
      return null;
    }

    const part = await action.use();
    if (!part) return null;

    const item = this.parent;
    const messageData = await this.parent.actor.system.rollCheck(
      { type: "magic", magic: { item } },
      {},
      { create: false },
    );
    if (!messageData) return null;

    messageData.system.parts.push(part);
    return getDocumentClass("ChatMessage").create(messageData);
  }
}
