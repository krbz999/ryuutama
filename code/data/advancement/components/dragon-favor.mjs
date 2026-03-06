import Node from "./node.mjs";

/**
 * Favor of the Seasonal Dragon
 */
export default class DragonFavorNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.dragonFavor");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    return Object.entries(ryuutama.config.seasons)
      .map(([k, v]) => {
        return { value: k, label: v.label, icon: v.icon };
      });
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("dragon-favor");
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
    const type = "ActiveEffect";
    const data = {
      type: "advancement",
      name: _loc("RYUUTAMA.ADVANCEMENT.dragonFavor"),
      system: {
        changes: [{
          key: "system.mastered.dragonFavor",
          mode: "override",
          value: this.selected.value,
        }],
      },
    };
    return { type, data };
  }
}
