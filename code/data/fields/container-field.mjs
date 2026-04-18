/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

/**
 * Extension of foreign document field to store parent container id.
 */
export default class ContainerField extends foundry.data.fields.ForeignDocumentField {
  constructor() {
    super(foundry.documents.BaseItem, { idOnly: true });
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve a parent container of an item.
   * @param {RyuutamaItem} item
   * @returns {RyuutamaItem|null|Promise<RyuutamaItem|null>}
   */
  static getContainer(item) {
    if (!item.system.schema.has("container")) return null;

    let container;

    // Embedded documents imply that the parent document is also loaded, so can be accessed synchronously.
    if (item.isEmbedded || !item.inCompendium) container = item.collection.get(item.system.container);
    else container = item.collection.getDocument(item.system.container);

    const verify = item => item && (item.type === "container") ? item : null;
    return (container instanceof Promise) ? container.then(verify) : verify(container);
  }
}
