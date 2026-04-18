export default class RyuutamaItemCompendium extends foundry.applications.sidebar.apps.Compendium {
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    let items = this.collection;
    if (this.collection.index) {
      if (!this.collection._reindexing) this.collection._reindexing = this.collection.getIndex();
      await this.collection._reindexing;
      items = this.collection.index;
    }

    items.forEach(item => {
      if (items.has(item.system?.container)) this.element?.querySelector(`[data-entry-id="${item._id}"]`)?.remove();
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _createDroppedEntry(entry, updates = {}) {
    if (entry.type !== "container") return super._createDroppedEntry(entry, updates);

    const Item = getDocumentClass("Item");
    const itemData = await Item.createWithContents([entry]);
    const [container] = await Item.createDocuments(itemData, { pack: this.collection.metadata.id, keepId: true });
    return container;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _handleDroppedEntry(target, data) {
    let entry = await this._getDroppedEntryFromData(data);
    if (!entry) return;

    if (!this._entryAlreadyExists(entry)) return super._handleDroppedEntry(target, data);

    const container = await ryuutama.data.fields.ContainerField.getContainer(entry);
    if (!container || !this._entryAlreadyExists(container)) return super._handleDroppedEntry(target, data);

    await entry.update({ "system.container": null });
  }
}
