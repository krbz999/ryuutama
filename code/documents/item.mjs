export default class RyuutamaItem extends foundry.documents.Item {
  /**
   * Identifier of this item.
   * @type {string|null}
   */
  get identifier() {
    if (this.system.identifier) return this.system.identifier;
    return this.system.schema.has("identifier") ? ryuutama.utils.createDefaultIdentifier(this.name) : null;
  }
}
