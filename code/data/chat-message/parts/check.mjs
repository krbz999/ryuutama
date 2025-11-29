import MessagePart from "./base.mjs";

export default class CheckPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "check" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {};

  /* -------------------------------------------------- */

  /**
   * The template used for rendering this part in a chat message.
   * @type {string}
   */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/check.hbs";
}
