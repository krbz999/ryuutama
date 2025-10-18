const { EmbeddedDataField, NumberField, SchemaField } = foundry.data.fields;

export default class RyuutamaTokenDocument extends foundry.documents.TokenDocument {
  /** @override */
  static _getTrackedAttributesFromSchema(schema, _path = []) {
    const attributes = { bar: [], value: [] };
    for (const [name, field] of Object.entries(schema.fields)) {
      const p = _path.concat([name]);
      if (field instanceof NumberField) attributes.value.push(p);
      const isSchema = field instanceof SchemaField;
      const isModel = field instanceof EmbeddedDataField;
      if (isSchema || isModel) {
        const schema = isModel ? field.model.schema : field;
        const isBar = (schema.has("value") || schema.has("spent")) && schema.has("max");
        if (isBar) attributes.bar.push(p);
        else {
          const inner = this.getTrackedAttributes(schema, p);
          attributes.bar.push(...inner.bar);
          attributes.value.push(...inner.value);
        }
      }
    }
    return attributes;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const bar = super.getBarAttribute(barName, { alternative });
    if (bar === null) return null;

    let { type, attribute, value, max, editable } = bar;

    // Adjustments made for things that use "spent" instead of "value" in the schema.
    if ((type === "value") && attribute.endsWith(".spent")) {
      const object = foundry.utils.getProperty(this.actor.system, attribute.slice(0, attribute.lastIndexOf(".")));
      value = object.value;
      max = object.max;
      type = "bar";
      editable = true;
    } else if (type === "bar") {
      editable = true;
    } else {
      // Due to various data preparation reasons, there are no good use cases for editable non-bar attributes.
      editable = false;
    }

    // Workaround: core later checks for `"max" in attr` and determines it is then a bar.
    const result = { type, attribute, value, max, editable };
    if (result.max === undefined) delete result.max;
    return result;
  }
}
