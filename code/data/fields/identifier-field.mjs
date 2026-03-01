/**
 * Special case StringField that includes automatic validation for identifiers.
 */
export default class IdentifierField extends foundry.data.fields.StringField {
  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, { required: true });
  }

  /* -------------------------------------------------- */

  /** @override */
  _validateType(value) {
    if (!ryuutama.utils.isValidIdentifier(value)) {
      throw new Error(_loc("RYUUTAMA.ITEM.identifierError"));
    }
  }
}
