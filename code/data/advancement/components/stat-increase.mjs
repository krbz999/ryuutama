import Node from "./node.mjs";

export default class StatIncreaseNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.statIncrease");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    return Object.entries(ryuutama.config.abilityScores).map(([k, v]) => {
      return { value: k, label: v.label, icon: v.icon };
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("stat-increase");
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
        name: _loc("RYUUTAMA.ADVANCEMENT.statIncrease"),
        system: {
          level: null,
          changes: [{
            key: `system.abilities.${this.selected.value}.value`,
            mode: "add",
            value: "1",
          }],
        },
      },
    };
  }
}
