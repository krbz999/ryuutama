import PseudoDocumentCollection from "../../utils/pseudo-document-collection.mjs";
import PseudoDocument from "../pseudo-document.mjs";

/**
 * @import { DataFieldContext, DataFieldOptions } from "@common/data/_types.mjs";
 */

const { ObjectField, TypedObjectField } = foundry.data.fields;

/**
 * A collection that houses pseudo-documents.
 */
export default class PseudoDocumentCollectionField extends TypedObjectField {
  /**
   * @param {typeof PseudoDocument} model   The value type of each entry in this object.
   * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]    Additional context which describes the field.
   */
  constructor(model, options = {}, context = {}) {
    if (!foundry.utils.isSubclass(model, PseudoDocument)) {
      throw new Error("A CollectionField can only be instantiated with a TypedPseudoDocument subclass.");
    }
    let field = new PseudoDocumentField(model);
    options.validateKey ||= ((key) => foundry.data.validators.isValidId(key));
    super(field, options, context);
    this.#documentClass = model;
    this.readonly = true;
  }

  /* -------------------------------------------------- */

  /** @override */
  static hierarchical = true;

  /* -------------------------------------------------- */

  /**
   * The Collection implementation to use when initializing the collection.
   * @type {typeof PseudoDocumentCollection}
   */
  static get implementation() {
    return PseudoDocumentCollection;
  }

  /* -------------------------------------------------- */

  /**
   * The pseudo-document class.
   * @type {typeof PseudoDocument}
   */
  #documentClass;

  /* -------------------------------------------------- */

  /**
   * The pseudo-document class.
   * @type {typeof PseudoDocument}
   */
  get documentClass() {
    return this.#documentClass;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    const collection = model.parent.pseudoCollections[this.documentClass.documentName];
    collection.initialize(model, options);
    return collection;
  }

  /* -------------------------------------------------- */

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    let src = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!src || !value) {
      source[key] = value;
      return;
    }

    // Reconstruct the source array, retaining object references
    for (let [id, d] of Object.entries(diff)) {
      if (foundry.utils.isDeletionKey(id)) {
        if (id.startsWith("-")) {
          delete source[key][id.slice(2)];
          continue;
        }
        id = id.slice(2);
      }
      const prior = src[id];
      if (prior) {
        this.element._updateCommit(src, id, value[id], d, options);
        src[id] = prior;
      }
      else src[id] = d;
    }
  }
}

/* -------------------------------------------------- */

/**
 * A subclass of ObjectField that helps retain object references.
 */
class PseudoDocumentField extends ObjectField {
  /**
   * @param {typeof PseudoDocument} element   The type of Document which belongs to this field.
   * @param {DataFieldOptions} [options]      Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]      Additional context which describes the field.
   */
  constructor(element, options, context) {
    super(options, context);
    this.element = element;
  }

  /* -------------------------------------------------- */

  /** @override */
  static recursive = true;

  /* -------------------------------------------------- */

  /**
   * Get the PseudoDocument definition for the specified advancement type.
   * @param {string} type                     The document type.
   * @returns {typeof PseudoDocument|null}    The PseudoDocument class, or null.
   */
  getModelForType(type) {
    return this.element.documentConfig[type] ?? null;
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _cleanType(value, options) {
    if (!(typeof value === "object")) value = {};

    const cls = this.getModelForType(value.type);
    if (cls) return cls.cleanData(value, options);
    return value;
  }

  /* -------------------------------------------------- */

  /**
   * Migrate this field's candidate source data.
   * @param {object} sourceData   Candidate source data of the root model.
   * @param {any} fieldData       The value of this field within the source data.
   */
  migrateSource(sourceData, fieldData) {
    const cls = this.getModelForType(fieldData.type);
    if (cls) cls.migrateDataSafe(fieldData);
  }

  /* -------------------------------------------------- */

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    const s = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!s || !value) {
      source[key] = value;
      return;
    }

    // Update fields in source which changed in the diff
    const element = this.element.documentConfig[value.type] ?? this.element;
    for (let [k, d] of Object.entries(diff)) {
      k = foundry.utils.isDeletionKey(k) ? k.slice(2) : k;
      const field = element.schema.getField(k);
      if (!field) continue;
      field._updateCommit(s, k, value[k], d, options);
    }
  }
}
