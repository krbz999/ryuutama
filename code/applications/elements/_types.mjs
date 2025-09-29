/**
 * @import { Item } from "@client/config.mjs";
 */

/**
 * @typedef InventoryElementEntry
 * @property {Item} document                      The item to display.
 * @property {string} [label]                     Override the displayed toolip, defaults to the item's name.
 * @property {string|string[]} [classes]          Css classes to apply.
 * @property {Record<string, string>} [dataset]   Record of additional properties to assign to the dataset.
 */

/**
 * @typedef InventoryElementConfig
 * @property {InventoryElementEntry[]} documents    Displayed document data.
 * @property {string} [action]                      An action on an entry.
 * @property {string|string[]} [classes]            Css classes to apply.
 */
