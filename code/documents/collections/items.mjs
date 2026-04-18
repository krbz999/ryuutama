/**
 * A subclass of the Items collection for Container functionality.
 */
export default class RyuutamaItems extends foundry.documents.collections.Items {
  /** @inheritdoc */
  fromCompendium(document, { clearContainer = true, ...options } = {}) {
    const itemData = super.fromCompendium(document, options);
    if (clearContainer) delete itemData.system?.container;
    return itemData;
  }
}
