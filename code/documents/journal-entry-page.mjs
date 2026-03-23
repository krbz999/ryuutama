export default class RyuutamaJournalEntryPage extends foundry.documents.JournalEntryPage {
  /** @inheritdoc */
  toAnchor({ attrs = {}, dataset = {}, classes = [], name, icon } = {}) {
    if (typeof this.system.richTooltip === "function") {
      dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid: this.uuid });
    }
    return super.toAnchor({ attrs, dataset, classes, name, icon });
  }

  /* -------------------------------------------------- */

  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * @returns {object}
   */
  getRollData() {
    const page = (typeof this.system.getRollData === "function") ? this.system.getRollData() : { ...this.system };
    page.name = this.name;
    page.flags = this.flags;
    const rollData = this.parent.getRollData();
    rollData.page = page;
    return rollData;
  }
}
