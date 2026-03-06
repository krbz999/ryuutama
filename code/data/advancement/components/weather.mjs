import Node from "./node.mjs";

export default class WeatherNode extends Node {
  /** @inheritdoc */
  get isConfigured() {
    if (!super.isConfigured) return false;
    return !this.actor.system.mastered.weather.has(this.selected.value);
  }

  /* -------------------------------------------------- */

  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.weatherSpecialty");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    return Object.entries(ryuutama.config.weatherTypes).map(([k, v]) => {
      return { value: k, label: v.label, icon: v.icon };
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("habitat-weather");
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
        name: _loc("RYUUTAMA.ADVANCEMENT.weatherSpecialty"),
        system: {
          level: null,
          changes: [{
            key: "system.mastered.weather",
            mode: "add",
            value: this.selected.value,
          }],
        },
      },
    };
  }
}
