/**
 * @import Advancement from "../../data/advancement/advancement.mjs";
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 * @import Folder from "@client/documents/folder.mjs";
 * @import { getDocumentClass } from "@client/utils/helpers.mjs";
 */

const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

/**
 * Base document sheet.
 * @extends DocumentSheet
 * @mixes HandlebarsApplicationMixin
 */
export default class RyuutamaDocumentSheet extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 560,
    },
    window: {
      contentClasses: ["standard-form"],
    },
    mode: 1,
    actions: {
      toggleEditMode: RyuutamaDocumentSheet.#toggleEditMode,
      createEffect: RyuutamaDocumentSheet.#createEffect,
      renderEmbedded: RyuutamaDocumentSheet.#renderEmbedded,
      contextMenu: RyuutamaDocumentSheet.#contextMenu,
      renderDocument: RyuutamaDocumentSheet.#renderDocument,
    },
  };

  /* -------------------------------------------------- */

  /**
   * Different sheet modes.
   * @enum {number}
   */
  static SHEET_MODES = Object.freeze({ EDIT: 0, PLAY: 1 });

  /* -------------------------------------------------- */

  /**
   * Is the sheet in edit mode?
   * @type {boolean}
   */
  get isEditMode() {
    return this._sheetMode === RyuutamaDocumentSheet.SHEET_MODES.EDIT;
  }

  /* -------------------------------------------------- */

  /**
   * Is the user able to perform actions such as rolls?
   * @type {boolean}
   */
  get isInteractive() {
    return this.isEditable && !this.document.inCompendium;
  }

  /* -------------------------------------------------- */

  /**
   * The current sheet mode.
   * @type {0|1}
   */
  _sheetMode = this.options.mode;

  /* -------------------------------------------------- */

  /**
   * A reference to the DragDrop instance, reused across re-renders.
   * @type {DragDrop}
   */
  _dragDrop;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (("mode" in options) && this.isEditable) this._sheetMode = options.mode;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    const type = options.document.type;
    switch (options.document.documentName) {
      case "Actor": options.classes.push("actor", type); break;
      case "Item": options.classes.push("item", type); break;
    }
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const button = document.createElement("BUTTON");
    button.type = "button";
    button.classList.add("header-control", "icon", "fa-solid", "fa-fw", "fa-lock");
    Object.assign(button.dataset, { action: "toggleEditMode", tooltip: "RYUUTAMA.SHEET.toggleEditMode" });
    this.window.controls.insertAdjacentElement("afterend", button);
    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const isEditable = context.editable && this.isEditMode;
    return Object.assign(context, {
      sheet: this,
      isEditable,
      isInteractive: this.isInteractive,
      disabled: !isEditable,
      document: this.document,
      systemFields: this.document.system.schema.fields,
      source: this.document._source,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const input of this.element.querySelectorAll("input[type=number], input[type=text].delta")) {
      input.addEventListener("focus", () => input.select());
      if (input.classList.contains("delta")) {
        input.addEventListener("change", () => ryuutama.utils.parseInputDelta(input, this.document));
      }
    }

    // Set up drag-drop.
    this._dragDrop ??= new CONFIG.ux.DragDrop({
      dragSelector: ".document-listing .document-list .entry",
      dropSelector: null,
      permissions: {
        dragstart: RyuutamaDocumentSheet._canDragstart.bind(this),
        drop: RyuutamaDocumentSheet._canDrop.bind(this),
      },
      callbacks: {
        dragstart: RyuutamaDocumentSheet._onDragstart.bind(this),
        drop: RyuutamaDocumentSheet._onDrop.bind(this),
      },
    });
    this._dragDrop.bind(this.element);
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve embedded document via uuid.
   * @param {string} uuid   The uuid of the embedded document.
   * @returns {foundry.abstract.Document}
   */
  getEmbeddedDocument(uuid) {
    const { collection, embedded, documentId } = foundry.utils.parseUuid(uuid);
    let document = collection.get(documentId);
    while (document && (embedded.length > 1)) {
      const [embeddedName, embeddedId] = embedded.splice(0, 2);
      document = document.getEmbeddedDocument(embeddedName, embeddedId);
    }
    return document;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   */
  static #toggleEditMode(event, target) {
    const modes = RyuutamaDocumentSheet.SHEET_MODES;
    this._sheetMode = (this.isEditMode || !this.isEditable) ? modes.PLAY : modes.EDIT;
    this.render();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   */
  static #createEffect(event, target) {
    getDocumentClass("ActiveEffect").create({
      name: this.document.name,
      img: this.document.img,
      transfer: false,
      disabled: false,
    }, { parent: this.document });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   */
  static #renderEmbedded(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    return this.getEmbeddedDocument(uuid).sheet.render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static #contextMenu(event, target) {
    const { clientX, clientY } = event;
    event.stopPropagation();
    target.closest(".entry").dispatchEvent(new PointerEvent("contextmenu", {
      clientX, clientY,
      view: window, // TODO: v14 will likely require this to be a specific window.
      bubbles: true,
      cancelable: true,
    }));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaDocumentSheet
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static #renderDocument(event, target) {
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    fromUuid(uuid).then(document => document.sheet.render({ force: true }));
  }

  /* -------------------------------------------------- */
  /*   Drag & Drop Handlers                             */
  /* -------------------------------------------------- */

  /**
   * Can the current user initiate a drag event?
   * @this RyuutamaDocumentSheet
   * @param {string} selector   The css selector on which the drag event is targeted.
   * @returns {boolean}
   */
  static _canDragstart(selector) {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Can the current user perform a drop event?
   * @this RyuutamaDocumentSheet
   * @param {string} selector   The css selector on which the drag event is ended.
   * @returns {boolean}
   */
  static _canDrop(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------------- */

  /**
   * Initiate a drag event.
   * @this RyuutamaDocumentSheet
   * @param {DragEvent} event   Initiating drag event.
   * @returns {boolean}         If true, no further actions should be able to be taken by a subclass.
   */
  static _onDragstart(event) {
    const target = event.currentTarget;
    if ("link" in event.target.dataset) return true;

    const embedded = this.getEmbeddedDocument(target.closest("[data-uuid]")?.dataset.uuid);
    if (!embedded) return false;
    const data = embedded.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Perform drop actions.
   * @this RyuutamaDocumentSheet
   * @param {DragEvent} event   Initiating drop event.
   * @returns {Promise}         Whether the drop was fully resolved, either truthy or falsy.
   */
  static async _onDrop(event) {
    const { uuid } = CONFIG.ux.TextEditor.getDragEventData(event);
    const model = await fromUuid(uuid);
    if (!model) return false;

    switch (model.documentName) {
      case "ActiveEffect": return this._onDropActiveEffect(event, model);
      case "Actor": return this._onDropActor(event, model);
      case "Folder": return this._onDropFolder(event, model);
      case "Item": return this._onDropItem(event, model);
      case "Advancement": return this._onDropAdvancement(event, model);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Handle drop events of an effect.
   * @param {DragEvent} event               Initiating drop event.
   * @param {RyuutamaActiveEffect} effect   The dropped effect.
   * @returns {Promise}                     Whether the drop was fully resolved, either truthy or falsy.
   */
  async _onDropActiveEffect(event, effect) {
    if (!("effects" in this.document.collections)) return false;
    if (effect.parent === this.document) return false; // TODO: sort the effects?
    const keepId = !this.document.effects.has(effect.id);

    // TODO: clean up in v14.
    const effectData = game.effects?.fromCompendium(effect, { clearFolder: true, keepId }) ?? effect.toObject();
    effectData.origin = this.document.uuid;
    return getDocumentClass("ActiveEffect").create(effectData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * Handle drop events of an actor.
   * @param {DragEvent} event       Initiating drop event.
   * @param {RyuutamaActor} actor   The dropped actor.
   * @returns {Promise}             Whether the drop was fully resolved, either truthy or falsy.
   */
  async _onDropActor(event, actor) {}

  /* -------------------------------------------------- */

  /**
   * Handle drop events of a folder.
   * @param {DragEvent} event   Initiating drop event.
   * @param {Folder} folder     The dropped folder.
   * @returns {Promise}         Whether the drop was fully resolved, either truthy or falsy.
   */
  async _onDropFolder(event, folder) {
    const folders = (game.release.generation < 14) && folder.inCompendium
      ? [folder].concat(folder.collection.folders.filter(f => f.getParentFolders().includes(folder)))
      : [folder].concat(folder.getSubfolders(true));
    let documents = folders.flatMap(folder => folder.contents);
    if (folder.inCompendium) {
      documents = await folder.collection.getDocuments({ _id__in: documents.map(d => d._id) });
    }
    for (const document of documents) await this[`_onDrop${folder.type}`]?.(event, document);
  }

  /* -------------------------------------------------- */

  /**
   * Handle drop events of an item.
   * @param {DragEvent} event     Initiating drop event.
   * @param {RyuutamaItem} item   The dropped item.
   * @returns {Promise}           Whether the drop was fully resolved, either truthy or falsy.
   */
  async _onDropItem(event, item) {
    if (!("items" in this.document.collections)) return false;
    if (item.parent === this.document) return false; // TODO: sort the items?
    const keepId = !this.document.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { clearFolder: true, keepId });
    return getDocumentClass("Item").create(itemData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * Handle drop events of an advancement pseudo-document.
   * @param {DragEvent} event           Initiating drop event.
   * @param {Advancement} advancement   The dropped advancement.
   * @returns {Promise}                 Whether the drop was fully resolved, either truthy or falsy.
   */
  async _onDropAdvancement(event, advancement) {}
}
