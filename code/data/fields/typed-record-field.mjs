/**
 * A subclass of TypedObjectField that adds ids to each embedded object or model,
 * as well as a getter for sorting each entry by their subtype.
 */
export default class TypedRecordField extends foundry.data.fields.TypedObjectField {
  constructor(record, options = {}, context = {}) {
    const field = new foundry.data.fields.TypedSchemaField(record);
    const validateKey = (typeof options.validateKey === "function")
      ? options.validateKey
      : value => foundry.data.validators.isValidId(value);
    super(field, { ...options, validateKey }, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options) {
    if (!value) return value;
    const object = super.initialize(value, model, options);

    foundry.utils.objectEntries(object).forEach(([id, v]) => {
      Object.defineProperty(v, "id", { value: id, writable: false, enumerable: true });
    });

    /**
     * Each advancement classified per type.
     * @type {Record<string, any[]>}
     */
    let byType;
    Object.defineProperty(object, "documentsByType", {
      enumerable: false,
      get() {
        if (byType) return byType;
        byType = {};
        foundry.utils.objectValues(object).forEach(value => {
          if (!byType[value.type]) byType[value.type] = [];
          byType[value.type].push(value);
        });
        return byType;
      },
    });
    return object;
  }
}
