export default class MessageData extends foundry.abstract.TypeDataModel {
  /**
   * The parts that will be rendered in this chat message.
   * @type {Record<string, string>}
   */
  static PARTS = {
    header: "systems/ryuutama/templates/chat/header.hbs",
    content: "systems/ryuutama/templates/chat/content.hbs",
  };

  /* -------------------------------------------------- */

  /**
   * Is this message visible to the current user?
   * Called by the document class to help determine visibility.
   * @type {boolean}
   */
  get visible() {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Render the HTML for the ChatMessage which should be added to the log
   * @param {object} [options]             Additional options passed to the Handlebars template.
   * @param {boolean} [options.canDelete]  Render a delete button. By default, this is true for GM users.
   * @param {boolean} [options.canClose]   Render a close button for dismissing chat card notifications.
   * @returns {Promise<HTMLElement>}
   */
  async renderHTML(options = {}) {
    await foundry.applications.handlebars.loadTemplates(Object.values(this.constructor.PARTS));

    const context = {
      ...options,
      document: this.parent,
      actor: this.parent.speakerActor,
      user: game.user,
      content: await CONFIG.ux.TextEditor.enrichHTML(
        this.parent.content,
        { rollData: this.parent.getRollData?.() ?? {}, relativeTo: this.parent },
      ),
    };

    await this._prepareContext(context);

    const element = document.createElement("LI");
    element.classList.add(ryuutama.id, this.parent.type, "chat-message", "message", "flexcol");
    element.dataset.messageId = this.parent.id;

    for (const [partId, template] of Object.entries(this.constructor.PARTS)) {
      const htmlString = await foundry.applications.handlebars.renderTemplate(template, context);
      const part = foundry.utils.parseHTML(htmlString);

      if (part.length > 1) {
        throw new Error("Each part for a rendered chat message must return exactly 1 HTMLElement.");
      }

      part.dataset.messagePart = partId;
      this._attachPartListeners(partId, part, context);
      element.insertAdjacentElement("beforeend", part);
    }

    this.#applyEventListeners(element);

    return element;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare additional context for rendering.
   * @param {object} context    The current rendering context. **will be mutated**
   * @returns {Promise<void>}   A promise that resolves once the rendering context has been mutated.
   */
  async _prepareContext(context) {}

  /* -------------------------------------------------- */

  /**
   * Attach listeners to a specific part.
   * @param {string} partId         The id of the part.
   * @param {HTMLElement} element   The rendered element.
   * @param {object} context        Rendering context.
   */
  _attachPartListeners(partId, element, context) {}

  /* -------------------------------------------------- */

  /**
   * Apply event listeners to the chat message.
   * @param {HTMLElement} element   The chat message element.
   */
  #applyEventListeners(element) {}
}
