/**
 * A subclass of SearchFilter that has been modified to function properly across
 * re-renders of applications; call `RyuutamaSearchFilter#bind` in the `_onRender`
 * method with `delay=false` to apply the filter without flickering HTML.
 */
export default class RyuutamaSearchFilter extends foundry.applications.ux.SearchFilter {
  constructor(config = {}) {
    super(config);
    this._contentSelector = config.contentSelector;
  }

  /* -------------------------------------------------- */

  /**
   * The container. New property because `#content` is private.
   * @type {HTMLElement}
   */
  _content;

  /* -------------------------------------------------- */

  /**
   * The content selector. New property because `#contentSelector` is private.
   * @type {string}
   */
  _contentSelector;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  bind(html, delay = true) {
    // Identify content container.
    this._content = html.querySelector(this._contentSelector);
    super.bind(html);
    if (delay) return;

    const event = new KeyboardEvent("input", { key: "Enter", code: "Enter" });
    this.filter(event, this.query, false);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  filter(event, query, delay = true) {
    if (delay) return super.filter(event, query);

    if (this._input) this._input.value = query;
    this.query = foundry.applications.ux.SearchFilter.cleanQuery(query);
    this.rgx = new RegExp(RegExp.escape(this.query), "i");
    this.callback(event, this.query, this.rgx, this._content);
  }
}
