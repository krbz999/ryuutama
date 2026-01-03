/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 */

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
      openMenu: CurrentHabitat.#openMenu,
      configureTerrain: CurrentHabitat.#configureTerrain,
      configureWeather: CurrentHabitat.#configureWeather,
    },
  };

  /* -------------------------------------------------- */

  /**
   * THe name of the current habitat setting.
   * @type {string}
   */
  static get SETTING() {
    return "CURRENT_HABITAT";
  }

  /* -------------------------------------------------- */

  /**
   * Is the terrain menu currently expanded?
   * @type {boolean}
   */
  #terrain = false;
  get #terrainOpen() {
    return this.#terrain;
  }
  set #terrainOpen(open) {
    this.#terrain = !!open;
    this.element.querySelector("menu.terrain").classList.toggle("open", this.#terrain);
  }

  /* -------------------------------------------------- */

  /**
   * Is the weather menu currently expanded?
   * @type {boolean}
   */
  #weather = false;
  get #weatherOpen() {
    return this.#weather;
  }
  set #weatherOpen(open) {
    this.#weather = !!open;
    this.element.querySelector("menu.weather").classList.toggle("open", this.#weather);
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const value = game.settings.get(ryuutama.id, CurrentHabitat.SETTING);

    // Current topography configs.
    const terrainConfig = ryuutama.config.terrainTypes[value.terrain];
    const weatherConfig = ryuutama.config.weatherTypes[value.weather];

    return {
      targetNumber: terrainConfig.difficulty + weatherConfig.modifier,
      isGM: game.user.isGM,

      terrain: value.terrain,
      terrainConfig,
      terrainOpen: this.#terrainOpen,
      terrainOptions: Object.entries(ryuutama.config.terrainTypes)
        .map(([k, v]) => ({ value: k, label: v.label, img: v.icon, iconSmall: v.iconSmall })),

      weatherConfig,
      weatherOpen: this.#weatherOpen,
      weatherSVG: weatherConfig.icon.endsWith(".svg"),
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
  async _renderHTML(context, options) {
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/current-habitat/section.hbs", context,
    );
    return foundry.utils.parseHTML(htmlString);
  }

  /* -------------------------------------------------- */

  /** @override */
  _replaceHTML(result, content, options) {
    content.replaceChildren(...result);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(
      CurrentHabitat.#createContextMenuOptions.bind(this),
      "[data-terrain-id]",
      { hookName: "get{}ContextMenuOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Create context menu options for the application.
   * @this CurrentHabitat
   * @returns {ContextMenuEntry[]}
   */
  static #createContextMenuOptions() {
    const options = [
      {
        name: "RYUUTAMA.HABITAT.CONTEXT.viewFullImage",
        icon: "fa-solid fa-fw fa-image",
        callback: target => {
          const terrain = target.dataset.terrainId;
          const { icon: src, label: title } = ryuutama.config.terrainTypes[terrain];
          const application = new foundry.applications.apps.ImagePopout({ src, window: { title } });
          application.render({ force: true });
        },
      },
    ];
    if (game.release.generation < 14) options.forEach(o => o.icon = `<i class="${o.icon}"></i>`);
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * @this CurrentHabitat
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #openMenu(event, target) {
    const type = target.dataset.menu;
    this.#terrainOpen = type === "terrain" ? !this.#terrain : type === "terrain";
    this.#weatherOpen = type === "weather" ? !this.#weather : type === "weather";
  }

  /* -------------------------------------------------- */

  /**
   * @this CurrentHabitat
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configureTerrain(event, target) {
    const terrain = target.dataset.terrainId;
    return CurrentHabitat.updateHabitat({ terrain });
  }

  /* -------------------------------------------------- */

  /**
   * @this CurrentHabitat
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configureWeather(event, target) {
    const weather = target.dataset.weatherId;
    return CurrentHabitat.updateHabitat({ weather });
  }

  /* -------------------------------------------------- */
  /*   API Methods                                      */
  /* -------------------------------------------------- */

  /**
   * Update the current habitat.
   * @param {{ weather?: string, terrain?: string }} [habitat]
   * @returns {Promise<Setting>}
   */
  static async updateHabitat(habitat = {}) {
    const data = foundry.utils.mergeObject(
      game.settings.get(ryuutama.id, CurrentHabitat.SETTING),
      habitat,
      { inplace: false, insertKeys: false },
    );
    return game.settings.set(ryuutama.id, CurrentHabitat.SETTING, data);
  }
}
