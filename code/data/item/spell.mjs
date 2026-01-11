import ActionsModel from "../actions-model.mjs";
import BaseData from "./templates/base.mjs";

const { EmbeddedDataField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * @typedef SpellData
 * @property {ActionsModel} actions
 * @property {object} category
 * @property {string} category.value
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 * @property {object} spell
 * @property {object} spell.activation
 * @property {string} spell.activation.cast
 * @property {number|null} spell.activation.mental
 * @property {object} spell.duration
 * @property {number} spell.duration.value
 * @property {string} spell.duration.type
 * @property {string} spell.duration.custom
 * @property {string} spell.level
 * @property {object} spell.range
 * @property {string} spell.range.value
 * @property {object} spell.target
 * @property {string} spell.target.custom
 */

export default class SpellData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      actions: new EmbeddedDataField(ActionsModel),
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

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/spell.hbs";

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

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {
    context.spell = { duration: {} };

    context.spell.duration.type = context.disabled
      ? this.spell.duration.type
      : this._source.spell.duration.type;
    context.spell.duration.units = !!ryuutama.config.spellDurationTypes[context.spell.duration.type]?.units;
    context.spell.duration.special = context.spell.duration.type === "special";

    const seasonal = game.i18n.localize("RYUUTAMA.ITEM.SPELL.CATEGORIES.seasonal");
    context.spell.magicOptions = Object.entries(ryuutama.config.spellCategories).map(([k, v]) => {
      return { value: k, label: v.label, group: k === "incantation" ? undefined : seasonal };
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  isEffectSuppressed(effect) {
    return super.isEffectSuppressed(effect);
  }
}
