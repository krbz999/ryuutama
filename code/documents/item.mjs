/**
 * System implementation of the Item document class.
 * @extends foundry.documents.Item
 */
export default class RyuutamaItem extends foundry.documents.Item {
  /**
   * Identifier of this item.
   * @type {string|null}
   */
  get identifier() {
    if (this.system.identifier) return this.system.identifier;
    return this.system.schema.has("identifier") ? ryuutama.utils.createDefaultIdentifier(this.name) : null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static getDefaultArtwork(itemData) {
    const img = CONFIG.Item.dataModels[itemData.type]?.metadata.defaultArtwork ?? RyuutamaItem.DEFAULT_ICON;
    return { img: img };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (this.parent?.type === "party") return false;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getRollData() {
    const item = (typeof this.system.getRollData === "function") ? this.system.getRollData() : { ...this.system };
    item.name = this.name;
    item.flags = this.flags;
    const rollData = this.actor?.getRollData() ?? {};
    rollData.item = item;
    return rollData;
  }
}
