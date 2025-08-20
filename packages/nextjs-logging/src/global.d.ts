// global.d.ts
import type { Registry } from "./registry/baseRegistry";
import type { Logger } from "./logger";

declare global {
  var __coreMfgServerRegistry__: Registry<Logger>;
}
