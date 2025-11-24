/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaChatMessage from "../../documents/chat-message.mjs",
 */

export default class DamageTray extends HTMLElement {
  /** @override */
  static tagName = "damage-tray";

  /* -------------------------------------------------- */

  /**
   * The id of the hook to refresh this tray when tokens are controlled, for later unassignment.
   * @type {number}
   */
  #hookId;

  /* -------------------------------------------------- */

  /**
   * The chat message this is attached to.
   * @type {RyuutamaChatMessage}
   */
  #message;

  /* -------------------------------------------------- */

  /** @override */
  connectedCallback() {
    this.#message = game.messages.get(this.closest("[data-message-id]").dataset.messageId);
    if (!this.#message) {
      throw new Error("Unable to find parent chat message for DamageTray element.");
    }

    this.#hookId = Hooks.on("controlToken", foundry.utils.debounce(() => {
      this.#refresh();
    }, 100));

    this.#refresh();
  }

  /* -------------------------------------------------- */

  /**
   * Refresh the controlled actors.
   */
  #refresh() {
    this.innerHTML = "";
    const actors = new Set((canvas?.tokens?.controlled ?? []).map(token => token.actor).filter(_ => _));
    for (const actor of actors) {
      const element = this.#createActor(actor);
      if (element) this.insertAdjacentElement("beforeend", element);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Create the element for an individual actor.
   * @param {RyuutamaActor} actor
   * @returns {HTMLElement|void}
   */
  #createActor(actor) {
    if (!["traveler", "monster"].includes(actor.type)) return;

    let damages;
    if (this.#message.type === "damage") damages = this.#message.system.damages;
    else if (this.#message.type === "standard") {
      const partId = this.closest("[data-message-part]").dataset.messagePart;
      damages = this.#message.system.parts[partId].damages;
    }
    if (!damages) return;

    const htmlString = `
    <div data-actor-uuid="${actor.uuid}">
      <img src="${actor.img}" alt="${actor.name}">
      <span>${actor.name}</span>
      <span>${actor.system.calculateDamage(damages)}</span>
    </div>`;

    return foundry.utils.parseHTML(htmlString);
  }

  /* -------------------------------------------------- */

  /** @override */
  disconnectedCallback() {
    Hooks.off("controlToken", this.#hookId);
  }
}
