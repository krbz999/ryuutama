export {};

interface ObjectData {
  id: string;
  name: string;
  disabled: boolean;
}

declare module "./standard.mjs" {
  export default interface StandardData {
    objects: Record<string, ObjectData>;
  }
}
