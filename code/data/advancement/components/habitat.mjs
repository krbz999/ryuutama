import Node from "./node.mjs";

export default class HabitatNode extends Node {
  /** @override */
  get label() {
    return _loc("RYUUTAMA.ADVANCEMENT.habitat");
  }

  /* -------------------------------------------------- */

  /** @override */
  async _gatherChoices() {
    return [
      {
        type: "terrain",
        label: _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionTerrain"),
      },
      {
        type: "weather",
        label: _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionWeather"),
      },
    ];
  }

  /* -------------------------------------------------- */

  /** @override */
  _toHTML() {
    const section = document.createElement("SECTION");
    section.classList.add("habitat");
    const options = Array.from(this.choices.entries()).map(([k, v]) => ({ value: k, label: v.label }));
    options.unshift({ value: "" });
    const value = this._selected;
    let field = foundry.applications.fields.createSelectInput({ options, value });
    field = foundry.applications.fields.createFormGroup({
      input: field, label: _loc("RYUUTAMA.ADVANCEMENT.chooseHabitatType"),
    });
    section.insertAdjacentElement("beforeend", field);
    return section;
  }

  /* -------------------------------------------------- */

  /** @override */
  _addEventListeners(application, element) {
    element.querySelector("select").addEventListener("change", event => {
      this.select(event.currentTarget.value || null).then(() => application.render());
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  async _createChildNodes() {
    switch (this.selected?.type) {
      case "terrain": return [new ryuutama.data.advancement.components.TerrainNode({ parent: this })];
      case "weather": return [new ryuutama.data.advancement.components.WeatherNode({ parent: this })];
      default: return null;
    }
  }
}
