import PseudoDocumentCollection from "../../utils/pseudo-document-collection.mjs";
import PseudoDocument from "../pseudo-document.mjs";

/**
 * @import { DataFieldContext, DataFieldOptions } from "@common/data/_types.mjs";
 */

const { TypedObjectField, TypedSchemaField } = foundry.data.fields;

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
    let field = new PseudoDocumentTypedSchemaField(model.documentConfig);
    options.validateKey ||= ((key) => foundry.data.validators.isValidId(key));
    super(field, options, context);
    this.#documentClass = model;
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
 * A subclass of TypedSchemaField that helps retain object references.
 */
class PseudoDocumentTypedSchemaField extends TypedSchemaField {
  /** @override */
  _updateCommit(source, key, value, diff, options) {
    const s = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!s || !value) {
      source[key] = value;
      return;
    }

    // Update fields in source which changed in the diff
    const element = this.types[value.type];
    for (let [k, d] of Object.entries(diff)) {
      k = foundry.utils.isDeletionKey(k) ? k.slice(2) : k;
      const field = element.getField(k);
      if (!field) continue;
      field._updateCommit(s, k, value[k], d, options);
    }
  }
}
