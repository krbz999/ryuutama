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
}
