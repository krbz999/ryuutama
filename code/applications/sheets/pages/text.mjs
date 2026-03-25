export default class TextPageSheet extends foundry.applications.sheets.journal.JournalEntryPageProseMirrorSheet {
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    if (this.isView) await this.#onRenderView(context, options);
    else await this.#onRenderEdit(context, options);
  }

  /* -------------------------------------------------- */

  /**
   * @param {object} context    Rendering context.
   * @param {object} options    Rendering options.
   */
  async #onRenderEdit(context, options) {
    this.element.querySelector(".page-metadata")
      .insertAdjacentElement("afterend", new foundry.data.fields.StringField().toFormGroup({
        label: _loc("RYUUTAMA.PAGE.TEXT.subtitle"),
      }, {
        name: `flags.${ryuutama.id}.subtitle`,
        value: this.document.getFlag(ryuutama.id, "subtitle") ?? "",
      }));
  }

  /* -------------------------------------------------- */

  /**
   * @param {object} context    Rendering context.
   * @param {object} options    Rendering options.
   */
  async #onRenderView(context, options) {
    if (!this.document.title.show || (this.document.title.level !== 1)) return;
    let subtitle = this.document.getFlag(ryuutama.id, "subtitle");
    if (!subtitle) return;

    subtitle = foundry.utils.parseHTML(`<span class="subtitle">${subtitle}</span>`);
    this.element.querySelector(".journal-page-header h1").insertAdjacentElement("beforeend", subtitle);
  }
}
