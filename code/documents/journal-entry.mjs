/**
 * System implementation of the JournalEntry document class.
 * @extends foundry.documents.JournalEntry
 */
export default class RyuutamaJournalEntry extends foundry.documents.JournalEntry {
  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * @returns {object}
   */
  getRollData() {
    const data = {};
    data.name = this.name;
    data.flags = this.flags;
    return data;
  }
}
