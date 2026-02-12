import BaseData from "./templates/base.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

/**
 * @typedef SkillData
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class SkillData extends BaseData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    { inventory: false },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.SKILL",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/skill.hbs";

  /* -------------------------------------------------- */

  /**
   * The origin class of this skill.
   * @type {RyuutamaItem}
   */
  get originClass() {
    const item = this.parent;
    if (!item.isEmbedded) return null;
    if (item.actor.type !== "traveler") return null;

    const id = item.getFlag(ryuutama.id, "originClass");
    const cls = item.actor.system.classes[id] ?? null;
    return cls;
  }

  /* -------------------------------------------------- */

  /**
   * The tier of this skill. Equal to the amount of times it has been
   * granted by the same class. Minimum of 1.
   * @type {number}
   */
  get tier() {
    const cls = this.originClass;
    return cls ? cls.system.tier : 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (!this.identifier) {
      this.parent.updateSource({ "system.identifier": ryuutama.utils.createDefaultIdentifier(this.parent.name) });
    }
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {
    context.identifierPlaceholder = ryuutama.utils.createDefaultIdentifier(this.parent._source.name);
  }
}
