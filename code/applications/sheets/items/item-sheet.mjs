import RyuutamaDocumentSheet from "../../api/document-sheet.mjs";

/**
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 */

export default class RyuutamaItemSheet extends RyuutamaDocumentSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    position: { width: 400 },
    window: {
      contentClasses: ["standard-form"],
    },
    actions: {
      decreaseRation: RyuutamaItemSheet.#decreaseRation,
      increaseRation: RyuutamaItemSheet.#increaseRation,
      removeSkill: RyuutamaItemSheet.#removeSkill,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: "systems/ryuutama/templates/sheets/item-sheet/identity.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    details: {
      template: null,
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    actions: {
      template: "systems/ryuutama/templates/sheets/item-sheet/actions.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/item-sheet/effects.hbs",
      classes: ["tab", "scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "identity" },
        { id: "details" },
        { id: "actions" },
        { id: "effects" },
      ],
      initial: "identity",
      labelPrefix: "RYUUTAMA.ITEM.TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return this.document.name;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const details = this.document.system.constructor.DETAILS_TEMPLATE;
    const parts = foundry.utils.deepClone(this.constructor.PARTS);
    parts.details.template = details;
    if (!this.document.system.schema.has("actions")) delete parts.actions;
    Object.values(parts).forEach(p => p.templates ??= []);
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (!this.document.system.schema.has("actions")) delete tabs.actions;
    return tabs;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    Object.assign(context, {
      enriched: {
        description: await CONFIG.ux.TextEditor.enrichHTML(
          this.document.system.description.value,
          { rollData: this.document.getRollData(), relativeTo: this.document, secrets: this.document.isOwner },
        ),
      },
    });

    // Effects.
    context.effects = this.#prepareEffects();

    // Subtype specific context modification.
    await this.document.system._prepareSubtypeContext(this, context, options);

    if (this.document.system.schema.has("actions")) this.#prepareActions(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare actions.
   * @param {object} context    Rendering context. **will be mutated**.
   */
  #prepareActions(context) {
    context.actions = {
      document: this.document.system.actions,
      source: this.document.system.actions._source,
      fields: this.document.system.actions.schema.fields,
    };

    context.actions.damageOptions = Object.keys(ryuutama.config.damageRollProperties)
      .filter(key => !ryuutama.config.damageRollProperties[key].hidden)
      .map(key => ({ value: key, label: ryuutama.config.damageRollProperties[key].label }));
  }

  /* -------------------------------------------------- */

  /**
   * Prepare effects.
   * @returns {{ enabledEffects: object[], disabledEffects: object[] }}
   */
  #prepareEffects(context) {
    const { enabled = [], disabled = [] } = Object.groupBy(this.document.effects.contents, effect => {
      if (effect.type !== "standard") return "status";
      return effect.disabled ? "disabled" : "enabled";
    });

    return {
      enabledEffects: enabled.map(effect => ({ document: effect })),
      disabledEffects: disabled.map(effect => ({ document: effect, classes: ["inactive"] })),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Manage effects.
    this._createContextMenu(
      RyuutamaItemSheet.#createActiveEffectContextOptions.bind(this),
      ".document-listing .document-list .entry[data-document-name=ActiveEffect]",
      { hookName: "Get{}ActiveEffectContextOptions", parentClassHooks: false, fixed: true },
    );

    // Manage a container's contents.
    this._createContextMenu(
      RyuutamaItemSheet.#createItemContextOptions.bind(this),
      ".document-listing .document-list .entry[data-document-name=Item]",
      { hookName: "get{}ItemContextOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for effects.
   * @this RyuutamaItemSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createActiveEffectContextOptions() {
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        label: "RYUUTAMA.ITEM.CONTEXT.EFFECT.edit",
        icon: "fa-solid fa-edit",
        onClick: (event, target) => getItem(target).sheet.render({ force: true }),
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.EFFECT.delete",
        icon: "fa-solid fa-trash",
        onClick: (event, target) => getItem(target).deleteDialog({
          renderOptions: { window: { windowId: this.window.windowId } },
        }),
        visible: () => this.isEditable,
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.EFFECT.disable",
        icon: "fa-solid fa-times",
        onClick: (event, target) => getItem(target).update({ disabled: true }),
        visible: target => this.isEditable && !getItem(target).disabled,
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.EFFECT.enable",
        icon: "fa-solid fa-check",
        onClick: (event, target) => getItem(target).update({ disabled: false }),
        visible: target => this.isEditable && getItem(target).disabled,
      },
    ];
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for items.
   * @this RyuutamaItemSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createItemContextOptions() {
    const getContainedItem = target => fromUuid(target.closest("[data-uuid]").dataset.uuid);

    return [
      {
        label: "RYUUTAMA.ITEM.CONTEXT.ITEM.view",
        icon: "fa-solid fa-eye",
        onClick: (event, target) => getContainedItem(target).then(item => item.sheet.render({ force: true, mode: 1 })),
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.ITEM.edit",
        icon: "fa-solid fa-edit",
        onClick: (event, target) => getContainedItem(target).then(item => item.sheet.render({ force: true, mode: 0 })),
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.ITEM.delete",
        icon: "fa-solid fa-trash",
        onClick: (event, target) => getContainedItem(target).then(item => {
          item.deleteDialog({ renderOptions: { window: { windowId: this.window.windowId } } });
        }),
        visible: target => this.isEditable,
      },
      {
        label: "RYUUTAMA.ITEM.CONTEXT.ITEM.remove",
        icon: "fa-solid fa-hand",
        onClick: (event, target) => getContainedItem(target).then(item => {
          item.update({ "system.storage": null });
        }),
        visible: target => this.document.system.isStorage && this.isEditable,
        group: "system",
      },
    ];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    const target = event.target;

    // Dropping a Skill item onto a Class item sheet.
    const isSkillDrop = target.classList.contains("droparea")
      && (this.document.type === "class")
      && (item.type === "skill");
    if (isSkillDrop) {
      await this.document.update({
        "system.skills": this.document.system.toObject().skills.concat({ uuid: item.uuid }),
      });
      return true;
    }

    // Dropping a physical item onto a container item sheet.
    if (item.system.schema.has("storage") && !item.system.isStorage && this.document.system.isStorage) {
      // Case 1: The two items are in the same collection.
      if (item.collection.contents.includes(this.document)) {
        const batches = [{
          action: "update",
          parent: item.parent,
          documentName: "Item",
          updates: [{ _id: item.id, "system.storage": this.document.id }],
        }];

        // If the item is equipped, it should be unequipped.
        if (item.actor?.system.equipped?.[item.type] === item) batches.push({
          action: "update",
          parent: item.actor.parent,
          documentName: "Actor",
          updates: [{ _id: item.actor.id, [`system.equipped.${item.type}`]: null }],
          pack: item.actor.pack,
        });

        await foundry.documents.modifyBatch(batches);
        return true;
      }

      // Case 2: Owned or unowned container, and an item from elsewhere.
      else {
        const { pack, parent } = this.document;
        const keepId = !this.document.collection.has(item.id);
        const itemData = game.items.fromCompendium(item, { clearFolder: true, keepId });
        foundry.utils.setProperty(itemData, "system.storage", this.document.id);
        foundry.utils.setProperty(itemData, "folder", this.document.folder?.id);
        await getDocumentClass("Item").create(itemData, { pack, parent, keepId });
        return true;
      }
    }

    return super._onDropItem(event, item);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #decreaseRation(event, target) {
    const type = target.closest("[data-ration-type]").dataset.rationType;
    this.document.system.removeRations(1, type);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #increaseRation(event, target) {
    const type = target.closest("[data-ration-type]").dataset.rationType;
    this.document.system.addRations(1, { type });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #removeSkill(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    const skills = this.document.system.toObject().skills;
    skills.findSplice(s => s.uuid === uuid);
    this.document.update({ "system.skills": skills });
  }
}
