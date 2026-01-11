import MessagePart from "./parts/base.mjs";

const { TypedObjectField, TypedSchemaField } = foundry.data.fields;
const { handlebars } = foundry.applications;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      parts: new TypedObjectField(
        new TypedSchemaField(MessagePart.TYPES),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    if (Array.isArray(source?.parts)) {
      source.parts = Object.fromEntries(source.parts.map(part => [foundry.utils.randomID(), part]));
    }
    return super.migrateData(source);
  }

  /* -------------------------------------------------- */

  /**
   * Does this message contain dice rolls?
   * @type {boolean}
   */
  get isRoll() {
    return Object.values(this.parts).some(part => part.isRoll);
  }

  /* -------------------------------------------------- */

  /**
   * Is this chat message visible?
   * @type {boolean}
   */
  get visible() {
    return Object.values(this.parts).some(part => part.visible);
  }

  /* -------------------------------------------------- */

  /**
   * How many rolls are rendered in this chat message for the current user?
   * @type {number}
   */
  get _rollCount() {
    return Object.values(this.parts).reduce((acc, part) => acc + (part.visible ? part.rolls.length : 0), 0);
  }

  /* -------------------------------------------------- */

  /**
   * Render the HTML for the ChatMessage which should be added to the log.
   * @param {object} [options]              Additional options passed to the Handlebars template.
   * @param {boolean} [options.canDelete]   Render a delete button. By default, this is true for GM users.
   * @param {boolean} [options.canClose]    Render a close button for dismissing chat card notifications.
   * @returns {Promise<HTMLElement>}
   */
  async renderHTML(options = {}) {
    const headerTemplate = "systems/ryuutama/templates/chat/header.hbs";
    const context = {
      ...options,
      document: this.parent,
      actor: this.parent.speakerActor,
      user: game.user,
      rollData: this.parent.getRollData?.(),
      isWhisper: this.parent.whisper.length,
      whisperTo: this.parent.whisper.map(u => game.users.get(u)?.name).filterJoin(", "),
      canUpdate: this.parent.canUserModify(game.user, "update"),
    };

    const element = this.#renderFrame(options);

    // Render header always.
    const htmlString = await handlebars.renderTemplate(headerTemplate, context);
    element.insertAdjacentHTML("beforeend", htmlString);

    // If content is explicitly included, insert it.
    if (context.document.content) {
      const enriched = await CONFIG.ux.TextEditor.enrichHTML(context.document.content, {
        rollData: context.rollData,
        relativeTo: context.actor,
      });
      const html = foundry.utils.parseHTML(`<section data-message-part="content">${enriched}</section>`);
      element.insertAdjacentElement("beforeend", html);
    }

    // Render reusable parts.
    for (const [id, part] of Object.entries(this.parts)) {
      if (!part.visible) continue;
      Object.assign(context, { part, id });
      await part._prepareContext(context);
      const htmlString = await handlebars.renderTemplate(part.constructor.TEMPLATE, context);
      const html = foundry.utils.parseHTML(`
        <section data-message-part="${id}" data-message-part-type="${part.constructor.TYPE}">${htmlString}</section>`,
      );
      part._addListeners(html, context);
      element.insertAdjacentElement("beforeend", html);
    }

    return element;
  }

  /* -------------------------------------------------- */

  /**
   * Render the frame (the LI element) of the chat message.
   * @param {object} options
   * @returns {HTMLLIElement}
   */
  #renderFrame(options) {
    const frame = document.createElement("LI");
    const { blind, id, style, whisper } = this.parent;
    frame.dataset.messageId = id;

    const cssClasses = [
      ryuutama.id,
      "chat-message",
      "message",
      "flexcol",
      style === CONST.CHAT_MESSAGE_STYLES.IC ? "ic" : null,
      style === CONST.CHAT_MESSAGE_STYLES.EMOTE ? "emote" : null,
      whisper.length ? "whisper" : null,
      blind ? "blind" : null,
    ];
    for (const cssClass of cssClasses) if (cssClass) frame.classList.add(cssClass);
    if (options.borderColor) frame.style.setProperty("border-color", options.borderColor);
    return frame;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    for (const part of Object.values(this.parts)) {
      for (const roll of part.rolls) if (!roll._evaluated) await roll.evaluate();
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    for (const part of Object.values(this.parts)) part._onCreate(data, options, userId);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    if ((await super._preUpdate(changes, options, user)) === false) return false;
    if (this.parent.visible) options.rollCount = this._rollCount;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user);

    if (this.parent.visible && (this._rollCount > options.rollCount)) {
      ui.chat.notify(this.parent, { newMessage: false });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    for (const part of Object.values(this.parts)) part.prepareData();
  }
}
