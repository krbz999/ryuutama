/**
 * @import Document from "@common/abstract/document.mjs";
 * @import Application from "@client/applications/api/application.mjs";
 */

const { DocumentIdField, DocumentTypeField, FilePathField, StringField } = foundry.data.fields;

/**
 * A data model that allows for polymorphism across different values of `type`.
 */
export default class PseudoDocument extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      _id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
      name: new StringField({ required: true }),
      img: new FilePathField({ categories: ["IMAGE"] }),
      type: new DocumentTypeField(this),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO",
  ];

  /* -------------------------------------------------- */

  /**
   * The name of the collection that holds these pseudo-documents.
   * This name must be reused both on the TypeDataModel and when assigned on the parent document.
   * @type {string}
   * @abstract
   */
  static embedded = "";

  /* -------------------------------------------------- */

  /**
   * The pseudo-document name. Intended to be overridden by the 'base' type of a pseudo-document subclass.
   * @type {string}
   */
  static documentName = "PseudoDocument";

  /* -------------------------------------------------- */

  /**
   * The type of this pseudo-document subclass.
   * @type {string}
   */
  static TYPE = "base";

  /* -------------------------------------------------- */

  /**
   * The application used to render this pseudo-document type.
   * @type {typeof Application|null}
   */
  static get sheetClass() {
    return null;
  }

  /* -------------------------------------------------- */

  /**
   * The valid subtypes of this pseudo-document subclass.
   * This should exclude 'base' unless that is valid.
   * @type {Record<string, typeof PseudoDocument>}
   */
  static get documentConfig() {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Alias for document config. Required for TypedSchemaField.
   * @type {Record<string, typeof PseudoDocument>}
   */
  static get TYPES() {
    return this.documentConfig;
  }

  /* -------------------------------------------------- */

  /**
   * The pseudo-document name.
   * @type {string}
   */
  get documentName() {
    return this.constructor.documentName;
  }

  /* -------------------------------------------------- */

  /**
   * The id of this pseudo-document.
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /* -------------------------------------------------- */

  /**
   * The uuid of this document.
   * @type {string}
   */
  get uuid() {
    return [this.document.uuid, this.documentName, this.id].join(".");
  }

  /* -------------------------------------------------- */

  /**
   * The parent document of this pseudo-document.
   * @type {Document}
   */
  get document() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * The property path to this pseudo-document relative to its parent document.
   * @type {string}
   */
  get fieldPath() {
    return `system.${this.constructor.embedded}`;
  }

  /* -------------------------------------------------- */

  /**
   * The sheet of this pseudo-document.
   * @type {Application|null}
   */
  get sheet() {
    if (this.#sheet) return this.#sheet;
    const Cls = this.constructor.sheetClass;
    if (!Cls) return null;
    return this.#sheet = new Cls({ document: this });
  }
  #sheet = null;

  /* -------------------------------------------------- */

  /**
   * Does this pseudo-document exist in the document's source?
   * @type {boolean}
   */
  get isSource() {
    const { document, fieldPath, id } = this;
    const source = foundry.utils.getProperty(document._source, fieldPath);
    if (foundry.utils.getType(source) !== "Object") {
      throw new Error("Source is not an object!");
    }
    return id in source;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configure(options = {}) {
    super._configure(options);
    Object.defineProperty(this, "collection", {
      value: options.collection ?? null,
      writable: false,
    });
  }

  /* -------------------------------------------------- */

  /**
   * Prepare base data.
   * It is the responsiblity of the parent model to call this method.
   */
  prepareBaseData() {}

  /* -------------------------------------------------- */

  /**
   * Prepare derived data.
   * It is the responsiblity of the parent model to call this method.
   */
  prepareDerivedData() {
    if (!this.name) {
      this.name = game.i18n.localize(`TYPES.${this.documentName}.${this.type}`);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Create a new instance of this pseudo-document.
   * @param {object} [data]                     The data used for the creation.
   * @param {object} operation                  The context of the operation.
   * @param {Document} operation.parent         The parent of this document.
   * @param {boolean} [operation.renderSheet]   Render the sheet of the created pseudo-document?
   * @returns {Promise<PseudoDocument>}         A promise that resolves to the created pseudo-document.
   */
  static async create(data = {}, { parent, renderSheet, ...operation } = {}) {
    if (!parent) {
      throw new Error("A parent document must be specified for the creation of a pseudo-document!");
    }

    const { documentName, documentConfig } = this;
    data = foundry.utils.deepClone(data);
    if (!data.type) data.type = Object.keys(documentConfig)[0];
    if (!(data.type in documentConfig)) {
      throw new Error(`The '${data.type}' type is not a valid type for a '${documentName}' pseudo-document!`);
    }

    let id = operation.keepId && foundry.data.validators.isValidId(data._id) ? data._id : foundry.utils.randomID();

    const fieldPath = `system.${this.embedded}`;
    const collection = foundry.utils.getProperty(parent._source, fieldPath);
    if (foundry.utils.getType(collection) !== "Object") {
      throw new Error(`A ${parent.documentName} does not support embedded ${documentName}!`);
    }
    if (id in collection) {
      throw new Error(`The id '${id}' already exists in the embedded ${this.embedded} collection.`);
    }

    data = { ...data, _id: id };
    const pseudo = new this.documentConfig[data.type](data, { parent });
    const update = { [`${fieldPath}.${id}`]: pseudo.toObject() };
    await parent.update(update, operation);
    const created = parent.getEmbeddedDocument(this.documentName, id);
    if (renderSheet) created.sheet?.render({ force: true });
    return created;
  }

  /* -------------------------------------------------- */

  /**
   * Prompt for creating this pseudo-document.
   * @param {object} [data]                     The data used for the creation.
   * @param {object} operation                  The context of the operation.
   * @param {Document} operation.parent         The parent of this document.
   * @returns {Promise<PseudoDocument|null>}    A promise that resolves to the created pseudo-document.
   */
  static async createDialog(data = {}, { parent, ...operation } = {}) {
    const { createFormGroup, createSelectInput, createTextInput } = foundry.applications.fields;
    const options = Object.keys(this.documentConfig).map(type => {
      return { value: type, label: game.i18n.localize(`TYPES.${this.documentName}.${type}`) };
    });
    const content =
    createFormGroup({
      input: createTextInput({ name: "name" }),
      label: "Name",
    }).outerHTML + createFormGroup({
      input: createSelectInput({ options, name: "type" }),
      label: "Type",
    }).outerHTML;

    const result = await foundry.applications.api.Dialog.input({
      content,
      window: {
        title: game.i18n.format("DOCUMENT.New", { type: game.i18n.localize(`DOCUMENT.${this.documentName}`) }),
      },
    });
    if (!result) return null;
    return this.create({ ...data, ...result }, { parent, ...operation });
  }

  /* -------------------------------------------------- */

  /**
   * Delete this pseudo-document.
   * @param {object} [operation]          The context of the operation.
   * @returns {Promise<PseudoDocument>}   A promise that resolves to the deleted pseudo-document.
   */
  async delete(operation = {}) {
    if (!this.isSource) {
      throw new Error(`The pseudo-document '${this.id}' does not exist in the pseudo-document collection!`);
    }
    Object.assign(operation, { pseudo: { operation: "delete", type: this.documentName, uuid: this.uuid } });
    const update = { [`${this.fieldPath}.-=${this.id}`]: null };
    await this.document.update(update, operation);
    return this;
  }

  /* -------------------------------------------------- */

  /**
   * Duplicate this pseudo-document.
   * @returns {Promise<PseudoDocument>}   A promise that resolves to the created pseudo-document.
   */
  async duplicate() {
    if (!this.isSource) {
      throw new Error(`The pseudo-document '${this.id}' does not exist in the pseudo-document collection!`);
    }
    const activityData = foundry.utils.mergeObject(this.toObject(), {
      name: game.i18n.format("DOCUMENT.CopyOf", { name: this.name }),
    });
    return this.constructor.create(activityData, { parent: this.document });
  }

  /* -------------------------------------------------- */

  /**
   * Update this pseudo-document.
   * @param {object} [change]             The change to perform.
   * @param {object} [operation]          The context of the operation.
   * @returns {Promise<PseudoDocument>}   A promise that resolves to the updated pseudo-document.
   */
  async update(change = {}, operation = {}) {
    if (!this.isSource) {
      throw new Error(`The pseudo-document '${this.id}' does not exist in the pseudo-document collection!`);
    }

    change = foundry.utils.deepClone(foundry.utils.expandObject(change));
    this.validate({ changes: change });

    const path = [this.fieldPath, this.id].join(".");
    const update = { [path]: change };

    await this.document.update(foundry.utils.expandObject(update), operation);
    return this;
  }

  /* -------------------------------------------------- */

  /**
   * Construct a UUID relative to another document.
   * @param {Document} relative   The document to compare against.
   */
  getRelativeUUID(relative) {
    // This PseudoDocument is a sibling of the relative Document.
    if (this.collection === relative.collection) return `.${this.id}`;

    // This PseudoDocument may be a descendant of the relative Document.
    if (relative === this.document) return `.${this.documentName}.${this.id}`;

    // The relative Document was unrelated to this one.
    return this.uuid;
  }

  /* -------------------------------------------------- */

  /**
   * Create drag data for storing on initiated drag events.
   * @returns {{ type: string, uuid: string }}
   */
  toDragData() {
    if (!this.isSource) {
      throw new Error("Unable to create DragData for non-source pseudo-document.");
    }
    return {
      type: this.documentName,
      uuid: this.uuid,
    };
  }
}
