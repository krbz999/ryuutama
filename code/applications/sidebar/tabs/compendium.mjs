export default class RyuutamaCompendiumDirectory extends foundry.applications.sidebar.tabs.CompendiumDirectory {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      openCompendiumBrowser: RyuutamaCompendiumDirectory.#openCompendiumBrowser,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (!options.parts.includes("header")) return;

    const button = foundry.utils.parseHTML(`
      <button type="button" class="open-compendium-browser" data-action="openCompendiumBrowser">
        <i class="fa-solid fa-map" inert></i>
        <span>${_loc("RYUUTAMA.BROWSER.openCompendiumBrowser")}</span>
      </button>
      `);
    this.element.querySelector("[data-application-part=header] .header-actions").insertAdjacentElement("beforeend", button);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaCompendiumDirectory
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #openCompendiumBrowser(event, target) {
    new ryuutama.applications.apps.RyuutamaCompendiumBrowser().render({ force: true });
  }
}
