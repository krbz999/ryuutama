import RyuutamaPartySheet from "../applications/sheets/actors/party.mjs";

export default class RyuutamaActor extends foundry.documents.Actor {
  /** @inheritdoc */
  static async createDialog(data = {}, createOptions = {}, options = {}, renderOptions = {}) {
    foundry.utils.setProperty(options, "position.width", 400);
    if (("left" in options.position)) options.position.left -= 80;
    return super.createDialog(data, createOptions, options, renderOptions);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getRollData() {
    const rollData = this.system.getRollData?.() ?? { ...this.system };
    rollData.name = this.name;
    return rollData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    if (!isBar) return super.modifyTokenAttribute(attribute, value, isDelta, isBar);

    const schema = this.system.schema.getField(attribute);
    const isSpent = (schema.get("value")?.options.persisted === false) && schema.has("spent");
    if (!isSpent) return super.modifyTokenAttribute(attribute, value, isDelta, isBar);

    const { spent, max } = foundry.utils.getProperty(this.system, attribute);
    const update = isDelta ? spent - value : max - value;
    if (update === spent) return this;

    const updates = { [`system.${attribute}.spent`]: update };

    const allowed = Hooks.call("modifyTokenAttribute", { attribute, value, isDelta, isBar }, updates, this);
    return (allowed === false) ? this : this.update(updates);
  }

  /* -------------------------------------------------- */

  /**
   * Removed in favor of a system implementation.
   * @override
   */
  async rollInitiative(...args) {
    throw new Error("Ryuutama | The `Actor#rollInitiative` method has been removed in favor of `Actor#system#rollInitiative`. Please use that instead.");
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    // Remove party sheets and re-render them.
    Object.values(this.apps).forEach(app => {
      if (!(app instanceof RyuutamaPartySheet)) return;
      delete this.apps[app.id];
      if (app.rendered) app.render();
    });

    super._onDelete(options, userId);
  }
}
