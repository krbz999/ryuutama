/**
 * @import { StringFieldOptions, DataFieldContext } from "@client/data/_types.mjs"
 * @import Document from "@common/abstract/document.mjs"
 */

/**
 * @typedef _LocalDocumentFieldOptions
 * @property {string} subtype   The document subtype referenced by this field.
 * @property {boolean} idOnly   Read the value as a string instead of a model?
 */

/**
 * @typedef {StringFieldOptions & _LocalDocumentFieldOptions} LocalDocumentFieldOptions
 */

export default class LocalDocumentField extends foundry.data.fields.DocumentIdField {
  /**
   * @param {typeof Document} model               The local DataModel class definition
   *                                              which this field links to.
   * @param {LocalDocumentFieldOptions} options   Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]          Additional context which describes the field.
   */
  constructor(model, options, context = {}) {
    super(options, context);
    if (!foundry.utils.isSubclass(model, foundry.abstract.DataModel)) {
      throw new Error("A LocalDocumentField must specify a DataModel subclass as its type.");
    }

    /**
     * A reference to the model class which is stored in this field.
     * @type {typeof Document}
     */
    this.model = model;

    if (!(options.subtype in CONFIG[model.documentName].dataModels)) {
      throw new Error("A LocalDocumentField must specify a specific document subtype.");
    }

    /**
     * A reference to the document subtype that is stored in this field.
     * @type {string}
     */
    this.subtype = options.subtype;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get _defaults() {
    return Object.assign(super._defaults, { nullable: true, readonly: false, idOnly: false });
  }

  /* -------------------------------------------------- */

  /** @override */
  _cast(value) {
    if (typeof value === "string") return value;
    if (value instanceof this.model) {
      if (value.type !== this.subtype) {
        throw new Error("The value of a LocalDocumentField must adhere to the specific subtype.");
      }
      return value._id;
    }
    throw new Error(`The value provided to a LocalDocumentField must be a ${this.model.name} instance.`);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    if (this.idOnly) return value;
    if (model?.pack) return null;
    if (!game.collections) return value; // Server-side.
    return () => {
      const item = model.parent.getEmbeddedDocument(this.model.documentName, value) ?? null;
      return item && (item.type === this.subtype) ? item : null;
    };
  }
}
