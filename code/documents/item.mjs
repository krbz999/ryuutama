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

  /** @override */
  static getDefaultArtwork(itemData) {
    let img = this.DEFAULT_ICON;

    switch (itemData.type) {
      case "accessory":
      case "armor":
      case "cape":
      case "hat":
      case "shield":
      case "shoes":
      case "staff":
      case "weapon":
        img = "systems/ryuutama/assets/official/icons/items/equipment.svg";
        break;

      case "animal":
        img = "systems/ryuutama/assets/official/icons/items/animal.svg";
        break;

      case "class":
        break;

      case "container":
        img = "systems/ryuutama/assets/official/icons/items/container.svg";
        break;

      case "herb":
      case "skill":
      case "spell":
        break;
    }

    return { img };
  }
}
