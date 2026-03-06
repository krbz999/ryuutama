import Node from "./node.mjs";

/**
 * @import RyuutamaItem from "../../../documents/item.mjs";
 */

/**
 * A class node is responsible for setting up choices (classes from which to pick one),
 * keeping track of the single "choice" that has been selected from the pool.
 */
export default class ClassNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.class");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _gatherChoices() {
    const nodes = [];
    for (const pack of game.packs) {
      if (pack.metadata.type !== "Item") continue;
      for (const index of pack.index) {
        if (index.type !== "class") continue;
        nodes.push({ index });
      }
    }
    return nodes;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _createChildNodes() {
    const cls = await this.getItem();
    if (!cls) throw new Error("No class selected.");

    const nodes = [];
    for (const uuid of cls.system.skills) {
      const skill = await fromUuid(uuid);
      if (!skill) continue;
      const node = new ryuutama.data.advancement.components.SkillNode({ item: skill, parent: this });
      nodes.push(node);
    }
    return nodes;
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("class-list");

    const value = this._selected;
    Array.from(this.choices.entries()).forEach(([k, v]) => {
      const a = document.createElement("A");
      a.classList.toggle("active", k === value);
      a.dataset.choice = k;
      a.dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid: v.index.uuid });
      a.innerHTML = `<img src="${v.index.img}" alt="${v.index.name}">`;
      section.insertAdjacentElement("beforeend", a);
    });

    return section;
  }

  /* -------------------------------------------------- */

  /** @override */
  _addEventListeners(application, element) {
    element.querySelectorAll("a[data-choice]").forEach(a => {
      a.addEventListener("click", event => {
        const id = event.currentTarget.dataset.choice;
        this.select(id === this._selected ? null : id).then(() => application.render());
      });
    });
  }

  /* -------------------------------------------------- */

  /**
   * Return the currently selected class item.
   * @type {Promise<RyuutamaItem|null>}
   */
  async getItem() {
    return fromUuid(this.selected?.index.uuid);
  }

  /* -------------------------------------------------- */

  /** @override */
  async _toData() {
    const item = await this.getItem();
    const data = game.items.fromCompendium(item, { clearFolder: true });
    return { type: "Item", data };
  }
}
