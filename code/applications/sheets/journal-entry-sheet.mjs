export default class RyuutamaJournalEntrySheet extends foundry.applications.sheets.journal.JournalEntrySheet {
  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    return options;
  }
}
