/**
 * A subclass of the Items collection for Container functionality.
 */
export default class RyuutamaItems extends foundry.documents.collections.Items {
  /** @inheritdoc */
  fromCompendium(document, { clearStorage = true, ...options } = {}) {
    const itemData = super.fromCompendium(document, options);
    if (clearStorage) delete itemData.system?.storage;
    return itemData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getVisibleTreeContents() {
    return this.contents.filter(item => item.visible && !ryuutama.data.fields.StorageField.getParentStorage(item));
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  async importFromCompendium(pack, id, updateData = {}, options = {}) {
    const created = await super.importFromCompendium(pack, id, updateData, options);
    if (!created.system.isStorage) return created;

    const item = await pack.getDocument(id);
    const contents = await item.system.contents;
    if (contents.length) {
      // const fromOptions = foundry.utils.mergeObject({ clearSort: false }, options);
      const toCreate = await getDocumentClass("Item").createWithContents(
        contents,
        { storage: created, keepId: options.keepId },
      );
      await getDocumentClass("Item").createDocuments(toCreate, { fromCompendium: true, keepId: true });
    }

    return created;
  }
}
