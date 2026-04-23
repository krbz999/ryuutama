export {};

import "./parts/_types";
import MessagePart from "./parts/base.mjs";

declare module "./standard.mjs" {
  export default interface StandardData {
    parts: Record<string, MessagePart>;
  }
}
