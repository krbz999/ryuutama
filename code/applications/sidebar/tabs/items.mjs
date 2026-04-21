/**
 * An extension of the items sidebar for Container functionality.
 */
export default class RyuutamaItemDirectory extends foundry.applications.sidebar.tabs.ItemDirectory {
  /** @inheritdoc */
  async _createDroppedEntry(entry, updates = {}) {
    if (!entry.system.isStorage) return super._createDroppedEntry(entry, updates);

    const Item = getDocumentClass("Item");
    const itemData = await Item.createWithContents([entry]);
    const [container] = await Item.createDocuments(itemData, { keepId: true });
    return container;
  }
}
