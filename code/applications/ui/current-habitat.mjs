const { Application } = foundry.applications.api;

export default class CurrentHabitat extends Application {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "current-habitat",
    classes: ["faded-ui", "ui-control"],
    tag: "aside",
    window: {
      frame: false,
      positioned: false,
    },
    actions: {
      configureHabitat: CurrentHabitat.#configureHabitat,
      configureWeather: CurrentHabitat.#configureWeather,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const value = game.settings.get(ryuutama.id, "CURRENT_HABITAT");

    // Current values.
    const current = {
      terrain: value.terrain.first() in ryuutama.config.terrainTypes ? value.terrain.first() : "grassland",
      weather: value.weather.first() in ryuutama.config.weatherTypes ? value.weather.first() : "clearSkies",
    };

    // Current topography configs.
    const terrainConfig = ryuutama.config.terrainTypes[current.terrain];
    const weatherConfig = ryuutama.config.weatherTypes[current.weather];

    return {
      current, terrainConfig, weatherConfig,
      targetNumber: terrainConfig.difficulty + weatherConfig.modifier,
      terrainOptions: Object.entries(ryuutama.config.terrainTypes)
        .map(([k, v]) => ({ value: k, label: v.label, img: v.icon })),
      weatherOptions: Object.entries(ryuutama.config.weatherTypes)
        .map(([k, v]) => ({ value: k, label: v.label, img: v.icon })),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  _insertElement(element) {
    document.querySelector("#ui-top #loading").insertAdjacentElement("beforebegin", element);
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
    return foundry.utils.parseHTML(htmlString);
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

  /* -------------------------------------------------- */

  static #configureWeather(event, target) {
    const weatherId = target.dataset.weatherId;
    const current = { ...game.settings.get(ryuutama.id, "CURRENT_HABITAT") };

    current.terrain = [current.terrain.first()];
    current.weather = [weatherId];
    game.settings.set(ryuutama.id, "CURRENT_HABITAT", current);
  }
}
