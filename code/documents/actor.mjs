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

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    for (const collection of Object.values(this.pseudoCollections))
      for (const pseudo of collection) pseudo.prepareBaseData();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    for (const collection of Object.values(this.pseudoCollections))
      for (const pseudo of collection) pseudo.prepareDerivedData();
  }

  /* -------------------------------------------------- */

  /** @override */
  getRollData() {
    const rollData = this.system.getRollData?.() ?? { ...this.system };
    rollData.name = this.name;
    return rollData;
  }

  /* -------------------------------------------------- */

  /**
   * Removed in favor of a system implementation.
   * @override
   */
  async rollInitiative(...args) {
    throw new Error("Ryuutama | The `Actor#rollInitiative` method has been removed in favor of `Actor#system#rollInitiative`. Please use that instead.");
  }
}
