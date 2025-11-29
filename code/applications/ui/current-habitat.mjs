const { Application } = foundry.applications.api;

export default class CurrentHabitat extends Application {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "current-habitat",
    classes: ["faded-ui"],
    tag: "aside",
    window: {
      frame: false,
      positioned: false,
    },
    actions: {
      configureHabitat: CurrentHabitat.#configureHabitat,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const value = game.settings.get(ryuutama.id, "CURRENT_HABITAT");

    const targetNumber =
      Math.max(0, ...[...value.terrain].map(v => ryuutama.config.terrainTypes[v]?.difficulty).filter(_ => _))
      + Math.max(0, ...[...value.weather].map(v => ryuutama.config.weatherTypes[v]?.modifier).filter(_ => _));

    const formatter = game.i18n.getListFormatter();

    const terrain = [...value.terrain].map(v => ryuutama.config.terrainTypes[v]?.label).filter(_ => _);
    const weather = [...value.weather].map(v => ryuutama.config.weatherTypes[v]?.label).filter(_ => _);

    return {
      targetNumber,
      terrain: terrain.length ? formatter.format(terrain) : null,
      weather: weather.length ? formatter.format(weather) : null,
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  _insertElement(element) {
    document.querySelector("#players").insertAdjacentElement("beforebegin", element);
  }

  /* -------------------------------------------------- */

  /** @override */
  _canRender(options) {
    return game.user.isGM;
  }

  /* -------------------------------------------------- */

  /** @override */
  async _renderHTML(context, options) {
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/current-habitat/button.hbs", context,
    );
    const button = foundry.utils.parseHTML(htmlString);
    return [button];
  }

  /* -------------------------------------------------- */

  /** @override */
  _replaceHTML(result, content, options) {
    content.replaceChildren(...result);
  }

  /* -------------------------------------------------- */

  /**
   * @this CurrentHabitat
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #configureHabitat(event, target) {
    CurrentHabitat.configureHabitat();
  }

  /* -------------------------------------------------- */

  /**
   * Configure the current habitat.
   * @returns {Promise<void>}
   */
  static async configureHabitat() {
    if (!game.user.isGM) return;
    const current = game.settings.get(ryuutama.id, "CURRENT_HABITAT");
    const fields = game.settings.settings.get(`${ryuutama.id}.CURRENT_HABITAT`).type.fields;

    const terrainOptions = Object.entries(ryuutama.config.terrainTypes).map(([k, v]) => {
      return { value: k, label: `${v.label} (${v.difficulty})` };
    });
    const weatherOptions = Object.entries(ryuutama.config.weatherTypes).map(([k, v]) => {
      return { value: k, label: `${v.label} (${v.modifier})` };
    });

    let habitat = await foundry.applications.api.Dialog.input({
      content: [
        fields.terrain.toFormGroup(
          { localize: true, classes: ["stacked"] },
          { value: current.terrain, type: "checkboxes", options: terrainOptions },
        ),
        fields.weather.toFormGroup(
          { localize: true, classes: ["stacked"] },
          { value: current.weather, type: "checkboxes", options: weatherOptions },
        ),
      ].map(field => field.outerHTML).join(""),
      window: {
        title: "RYUUTAMA.SETTINGS.CURRENT_HABITAT.title",
      },
    });
    if (!habitat) return;

    habitat = foundry.utils.expandObject(habitat)[ryuutama.id].CURRENT_HABITAT;

    game.settings.set(ryuutama.id, "CURRENT_HABITAT", habitat);
  }
}
