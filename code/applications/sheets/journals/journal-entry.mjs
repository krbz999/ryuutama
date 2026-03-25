export default class RyuutamaJournalEntrySheet extends foundry.applications.sheets.journal.JournalEntrySheet {
  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    const applicationOptions = super._initializeApplicationOptions(options);
    applicationOptions.classes.push(ryuutama.id);
    return applicationOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _preparePageData() {
    const data = super._preparePageData();
    for (const pageId of Object.keys(data)) {
      const page = this.document.pages.get(pageId);
      if (page.type !== "text") continue;
      if (page.title.level !== 1) continue;
      const subtitle = page.getFlag(ryuutama.id, "subtitle");
      if (!subtitle) continue;
      const pageData = data[pageId];
      pageData.name = [pageData.name, subtitle].join(", ");
    }
    return data;
  }
}
