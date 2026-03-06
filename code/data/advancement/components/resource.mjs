import Node from "./node.mjs";

export default class ResourceNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.resourceIncrease");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    const options = [];
    for (let i = 0; i <= 3; i++) options.push({ hp: i });
    return options;
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("resource-increase");
    const mentals = [];
    for (const [k, v] of this.choices.entries()) {
      const hp = v.hp;
      const mp = 3 - hp;
      const selected = this.selected;

      const a = document.createElement("A");
      a.dataset.choice = k;
      a.dataset.tooltipText = _loc("RYUUTAMA.ADVANCEMENT.resourceIncreaseLabel", { hp, mp });

      if (hp) {
        section.insertAdjacentElement("beforeend", a);
        a.classList.add("hp");
        a.innerHTML = `<span>${hp}</span>`;
        a.classList.toggle("active", !!selected && (hp <= selected.hp));
      }

      if (mp) {
        const m = a.cloneNode();
        m.classList.add("mp");
        m.innerHTML = `<span>${mp}</span>`;
        m.classList.toggle("active", !!selected && (mp <= 3 - selected.hp));
        mentals.push(m);
      }
    }

    for (const m of mentals) section.insertAdjacentElement("beforeend", m);

    return section;
  }

  /* -------------------------------------------------- */

  /** @override */
  _addEventListeners(application, element) {
    element.querySelectorAll("a[data-choice]").forEach(a => {
      a.addEventListener("click", event => {
        const choice = event.currentTarget.dataset.choice;
        if (choice === this._selected) return;
        this.select(choice).then(() => application.render());
      });
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  async _toData() {
    const hp = this.selected.hp;
    const mp = 3 - hp;
    const mode = "add";
    const hpPath = "system.resources.stamina.advancement";
    const mpPath = "system.resources.mental.advancement";

    return {
      type: "ActiveEffect",
      data: {
        type: "advancement",
        name: _loc("RYUUTAMA.ADVANCEMENT.resourceIncrease"),
        system: {
          level: null,
          changes: [
            hp ? { mode, value: hp, key: hpPath } : null,
            mp ? { mode, value: mp, key: mpPath } : null,
          ].filter(_ => _),
        },
      },
    };
  }
}
