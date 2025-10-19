/**
 * @import Document from "@common/abstract/document.mjs";
 */

/**
 * @typedef DocumentListEntry
 * @property {Document} document                  The document to display.
 * @property {string} [label]                     Override the displayed toolip, defaults to the item's name.
 * @property {string|string[]} [classes]          Css classes to apply.
 * @property {Record<string, string>} [dataset]   Record of additional properties to assign to the dataset.
 */

/**
 * @typedef DocumentListConfig
 * @property {DocumentListEntry[]} documents    Displayed document data.
 * @property {string} [action]                  An action on an entry.
 * @property {string|string[]} [classes]        Css classes to apply.
 * @property {boolean} [inline=true]            Render just the custom element?
 * @property {string} [label]                   The label for the header element of the listing's group.
 * @property {boolean} [tooltips=false]         If true, assigns hoverable tooltips to the documents.
 */
