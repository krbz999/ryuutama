import GearData from "./templates/gear.mjs";

/**
 * @typedef StaffData
 * @property {object} description
 * @property {string} description.value
 * @property {object} gear
 * @property {string} gear.custom
 * @property {string} identifier
 * @property {string[]} modifiers
 * @property {object} price
 * @property {number} price.value
 * @property {object} size
 * @property {number} size.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class StaffData extends GearData {}
