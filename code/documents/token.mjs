export default class RyuutamaTokenDocument extends foundry.documents.TokenDocument {
  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const bar = super.getBarAttribute(barName, { alternative });
    if (bar === null) return null;

    // Due to various data preparation reasons, there are no good use cases for editable non-bar attributes.
    if (bar.type !== "bar") bar.editable = false;

    return bar;
  }
}
