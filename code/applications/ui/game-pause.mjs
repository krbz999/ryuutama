export default class RyuutamaGamePause extends foundry.applications.ui.GamePause {
  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      spin: false,
      icon: "systems/ryuutama/assets/official/ui/ryuutama-logo.svg",
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  async _renderHTML(context, options) {
    const img = document.createElement("ryuutama-icon");
    img.src = context.icon;
    if (context.spin) img.classList.add("fa-spin");
    const caption = document.createElement("figcaption");
    caption.innerText = context.text;
    return [img, caption];
  }
}
