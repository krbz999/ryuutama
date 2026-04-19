/**
 * An extension of the items sidebar for Container functionality.
 */
export default class RyuutamaItemDirectory extends foundry.applications.sidebar.tabs.ItemDirectory {
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll("[data-entry-id]").forEach(element => {
      const item = game.items.get(element.dataset.entryId);
      if (ryuutama.data.fields.StorageField.getParentStorage(item)) element.remove();
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _createDroppedEntry(entry, updates = {}) {
    if (!entry.system.isStorage) return super._createDroppedEntry(entry, updates);

    const Item = getDocumentClass("Item");
    const itemData = await Item.createWithContents([entry]);
    const [container] = await Item.createDocuments(itemData, { keepId: true });
    return container;
  }
}
