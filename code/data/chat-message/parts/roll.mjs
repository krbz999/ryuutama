import MessagePart from "./base.mjs";

export default class RollPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "roll" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {};

  /* -------------------------------------------------- */

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/roll.hbs";
}
