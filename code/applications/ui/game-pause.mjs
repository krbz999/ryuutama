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
}
