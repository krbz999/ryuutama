/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

/**
 * Extension of foreign document field to store parent container id.
 */
export default class StorageField extends foundry.data.fields.ForeignDocumentField {
  constructor() {
    super(foundry.documents.BaseItem, { idOnly: true });
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve a parent container of an item.
   * @param {RyuutamaItem} item
   * @returns {RyuutamaItem|null|Promise<RyuutamaItem|null>}
   */
  static getParentStorage(item) {
    if (!item.system.schema.has("storage")) return null;

    let container;

    // Embedded documents imply that the parent document is also loaded, so can be accessed synchronously.
    if (item.isEmbedded || !item.inCompendium) container = item.collection.get(item.system.storage);
    else container = item.collection.getDocument(item.system.storage);

    const verify = item => item && item.system.isStorage ? item : null;
    return (container instanceof Promise) ? container.then(verify) : verify(container);
  }
}
