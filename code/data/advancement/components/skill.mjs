import Node from "./node.mjs";

/**
 * @import RyuutamaItem from "../../../documents/item.mjs";
 */

/**
 * A skill node creates a skill item, might offer a choice of effects, or another skill.
 */
export default class SkillNode extends Node {
  constructor(config) {
    super(config);

    if (!(config.item instanceof ryuutama.documents.RyuutamaItem)) {
      throw new Error("Cannot construct a SkillNode without an item.");
    }

    Object.assign(this, { item: config.item });
  }

  /* -------------------------------------------------- */

  /**
   * The skill item.
   * @type {RyuutamaItem}
   */
  item;

  /* -------------------------------------------------- */

  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.classSkill");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    // TODO: Allow for choice of effects or other skills.
    return [];
  }

  /* -------------------------------------------------- */

  /** @override */
  async _createChildNodes() {
    // TODO: If this adds an extra skill, create a new skill node.
    return null;
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    const span = document.createElement("SPAN");
    span.innerText = this.item.name;
    span.dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid: this.item.uuid });
    section.insertAdjacentElement("beforeend", span);
    return section;
  }

  /* -------------------------------------------------- */

  /** @override */
  _addEventListeners(application, element) {
    // TODO: Toggle chosen effect or additional skill.
  }

  /* -------------------------------------------------- */

  /** @override */
  async _toData() {
    // TODO: If this is a skill added by a skill, traverse upwards for the class item.
    // We currently assume the class item is always found one level up.
    const classItem = await this.parent.getItem();

    const data = foundry.utils.mergeObject(
      game.items.fromCompendium(this.item, { clearFolder: true }),
      { [`flags.${ryuutama.id}.originClass`]: classItem.identifier },
    );

    return { type: "Item", data };
  }
}
