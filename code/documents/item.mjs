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
  static async createDialog(data, createOptions, { types, context, ...dialogOptions } = {}, renderOptions) {
    const itemOptions = Object.entries(CONFIG.Item.dataModels)
      .map(([type, model]) => {
        if (types?.length && !types.includes(type)) return null;
        const label = _loc(`TYPES.Item.${type}`);
        const group = model.metadata?.createGroup ? _loc(model.metadata.createGroup) : undefined;
        return { group, label, value: type, _sort: model.metadata?.createSort };
      })
      .filter(_ => _);

    itemOptions.sort((a, b) => {
      // Grouped entries go after un-grouped entries.
      if (!a.group && b.group) return -1;
      if (!b.group && a.group) return 1;

      // Two ungrouped entries are sorted by explicit sort or by label, as are two entries in the same group.
      if ((!a.group && !b.group) || (a.group === b.group))
        return (a._sort && b._sort) ? (a._sort - b._sort) : a.label.localeCompare(b.label);

      // Two entries in different groups are sorted by group label.
      return a.group.localeCompare(b.group);
    });

    context = { ...context, types: itemOptions };
    return super.createDialog(data, createOptions, { context, ...dialogOptions }, renderOptions);
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
