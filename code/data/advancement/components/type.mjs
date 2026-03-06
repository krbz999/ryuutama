import Node from "./node.mjs";

export default class TypeNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.travelerType");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _gatherChoices() {
    return Object.entries(ryuutama.config.travelerTypes)
      .map(([k, v]) => {
        return { value: k, label: v.label, icon: v.icon };
      });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _createChildNodes() {
    const type = this.selected?.value;
    let node;
    switch (type) {
      case "attack":
        node = new ryuutama.data.advancement.components.WeaponNode({ parent: this });
        break;
      case "magic":
        node = new ryuutama.data.advancement.components.SpellCategoryNode({ parent: this });
        break;
      case "technical":
        break;
    }
    return node ? [node] : null;
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("traveler-type");
    const value = this._selected;

    Array.from(this.choices.entries()).forEach(([k, v]) => {
      const a = document.createElement("A");
      a.classList.toggle("active", k === value);
      a.dataset.choice = k;
      a.dataset.tooltipText = v.label;
      a.innerHTML = `<ryuutama-icon src="${v.icon}"></ryuutama-icon>`;
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

  /** @override */
  async _toData() {
    return {
      type: "ActiveEffect",
      data: {
        type: "advancement",
        name: _loc("RYUUTAMA.ADVANCEMENT.travelerType"),
        system: {
          level: null,
          changes: [{
            key: `system.details.type.${this.selected.value}`,
            mode: "add",
            value: "1",
          }],
        },
      },
    };
  }
}
