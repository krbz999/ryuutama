export {};

declare module "./reference.mjs" {
  export default interface ReferenceData {
    /** HTML to display in a tooltip. If blank, using the page's `text.content` value. */
    tooltip: string;
  }
}
