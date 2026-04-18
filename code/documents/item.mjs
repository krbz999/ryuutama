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

  /**
   * Create items with respect to containers and their contents. This returns item data,
   * which should be used with `Item.createDocuments` with `keepId: true`.
   * @param {RyuutamaItem[]} items                The items to create.
   * @param {object} [options]
   * @param {RyuutamaItem} [options.container]    A container to place the items in.
   * @returns {Promise<object[]>}                 Data for items to be created.
   */
  static async createWithContents(items, { container } = {}) {
    let { containers = [], physical = [], other = [] } = Object.groupBy(items, item => {
      if (item.type === "container") return "containers";
      if (item.system.schema.has("container")) return "physical";
      return "other";
    });

    physical = new Set(physical);

    /**
     * Containers and their new ids.
     * @type {Map<string, string>}
     */
    const containerMap = new Map();

    containers = await Promise.all(containers.map(async (item) => {
      const id = foundry.utils.randomID();
      containerMap.set(item.uuid, id);
      const contents = await item.system.contents;
      contents.forEach(c => physical.add(c));
      item = game.items.fromCompendium(item);
      foundry.utils.setProperty(item, "_id", id);
      return item;
    }));

    physical = await Promise.all(Array.from(physical).map(async (item) => {
      const parent = await ryuutama.data.fields.ContainerField.getContainer(item);
      item = game.items.fromCompendium(item);
      foundry.utils.setProperty(item, "system.container", containerMap.get(parent?.uuid) ?? container?.id ?? null);
      return item;
    }));

    other = other.map(item => game.items.fromCompendium(item));

    return [containers, physical, other].flat();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static getDefaultArtwork(itemData) {
    const model = CONFIG.Item.dataModels[itemData.type];
    const img = model?.getDefaultArtwork?.(itemData) ?? model?.metadata?.defaultArtwork ?? RyuutamaItem.DEFAULT_ICON;
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
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (options.render !== false) this.#renderContainers();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changed, options, user) {
    if ((await super._preUpdate(changed, options, user)) === false) return false;

    if (foundry.utils.hasProperty(changed, "system.container")) {
      options.formerContainer = (await ryuutama.data.fields.ContainerField.getContainer(this))?.uuid ?? null;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (options.render !== false) this.#renderContainers(options.formerContainer);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if (options.render !== false) this.#renderContainers();
  }

  /* -------------------------------------------------- */

  /**
   * Render old and new containers.
   * @param {string} [formerContainer]    Uuid of a former container to re-render.
   */
  async #renderContainers(formerContainer) {
    // Re-render old container.
    formerContainer = await fromUuid(formerContainer);
    formerContainer?.sheet?.render();

    // Re-render new container.
    const newContainer = await ryuutama.data.fields.ContainerField.getContainer(this);
    newContainer?.sheet?.render();

    if (this.isEmbedded) return;

    // Re-render the sidebar or containing compendium.
    if (!this.inCompendium) ui.items.render();
    else game.packs.get(this.pack).apps.forEach(a => a.render());
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async deleteDialog(options = {}, operation = {}) {
    options = foundry.utils.mergeObject(await this.system._prepareDeleteDialogOptions?.(options, operation) ?? {}, options);
    return super.deleteDialog(options, operation);
  }
}
