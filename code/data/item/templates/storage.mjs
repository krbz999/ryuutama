import BaseData from "./base.mjs";

/**
 * @import RyuutamaItem from "../../../documents/item.mjs";
 */

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Shared data for animals and containers, which can contain other items.
 */
export default class StorageData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isContainer() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Contained items.
   * @type {RyuutamaItem[]|Promise<RyuutamaItem[]>}
   */
  get contents() {
    /** @type {RyuutamaItem} */
    const item = this.parent;

    // This container is on an actor.
    if (item.isEmbedded) {
      return item.collection.filter(i => i.system.container === item.id);
    }

    // This is an unowned container in a pack.
    if (item.inCompendium) {
      return item.compendium.getDocuments({ system: { container: item.id } });
    }

    // This is an unowned container in the world.
    return item.collection.filter(i => i.system.container === item.id);
  }

  /* -------------------------------------------------- */

  /**
   * Calculate the capacity in use from contained items and rations.
   * @returns {Promise<number>}
   */
  async calculateCapacity() {
    const items = await this.contents;
    return items.reduce((acc, item) => acc + item.system.weight, 0);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onUpdate(changed, options, userId) {
    // Keep contents folder synchronized with container.
    if ((game.user.id === userId) && foundry.utils.hasProperty(changed, "folder")) {
      const contents = await this.contents;
      const updates = contents.map(item => ({ _id: item.id, folder: changed.folder }));
      const { pack, parent } = this.parent;
      await getDocumentClass("Item").updateDocuments(updates, { pack, parent, ...options });
    }

    super._onUpdate(changed, options, userId);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDelete(options, userId) {
    super._onDelete(options, userId);
    if (userId !== game.user.id) return;

    // Delete all contents of the container.
    if (options.deleteContents) {
      const items = await this.contents;
      if (items.length) {
        const ids = items.map(item => item.id);
        const { pack, parent } = this.parent;
        await getDocumentClass("Item").deleteDocuments(ids, { pack, parent });
      }
    }
  }
}
