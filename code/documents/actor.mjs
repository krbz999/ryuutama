import RyuutamaPartySheet from "../applications/sheets/actors/party.mjs";

export default class RyuutamaActor extends foundry.documents.Actor {
  /** @inheritdoc */
  _configure(options = {}) {
    super._configure(options);

    const collections = {};
    for (const field of CONFIG.Actor.dataModels[this._source.type]?.schema ?? []) {
      if (!field.constructor.hierarchical || !field.constructor.implementation) continue;

      const data = this._source.system[field.name] ?? {};
      const documentClass = field.constructor.implementation.documentClasses[field.name];
      const c = collections[documentClass.documentName] = new field.constructor.implementation(field.name, data);
      Object.defineProperty(this, field.name, { value: c, writable: false });
    }

    Object.defineProperty(this, "pseudoCollections", { value: Object.seal(collections), writable: false });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getEmbeddedCollection(embeddedName) {
    return this.pseudoCollections[embeddedName] ?? super.getEmbeddedCollection(embeddedName);
  }

  /* -------------------------------------------------- */

  /** @override */
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
    const object = foundry.utils.getProperty(this.system, attribute);

    const isSpent = !schema.has("value") && schema.has("spent");
    const current = isSpent ? object.spent : object.value;
    const update = isDelta
      ? current + (isSpent ? -value : value)
      : isSpent ? (object.max - value) : value;
    if (update === current) return this;

    const allowNegative = attribute === "resources.stamina";
    const updates = {
      [`system.${attribute}.${isSpent ? "spent" : "value"}`]: Math.clamp(update, 0, allowNegative ? Infinity : object.max),
    };

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
