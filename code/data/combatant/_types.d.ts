export {};

declare module "./standard.mjs" {
  export default interface StandardData {
    /** Delayed initiative. */
    initiative: {
      /** Formula representation of delayed initiative.. */
      value: string;
    }
  }
}
