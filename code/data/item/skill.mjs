import BaseData from "./templates/base.mjs";
import IdentifierField from "../fields/identifier-field.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

export default class SkillData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      identifier: new IdentifierField(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.SKILL",
  ];

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
}
