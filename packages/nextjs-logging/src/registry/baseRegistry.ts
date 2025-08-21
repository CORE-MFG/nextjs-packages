// src/registry/baseRegistry.ts

import { Logger } from "../logger";

let _log: Logger | null = null;

function log() {
  if (!_log) {
    _log = new Logger("Registry", "service", Logger.getPackageGlobalLevel(), true, true, false);
  }
  return _log;
}

export interface Registrable {
  name: string;
}

export class Registry<T extends Registrable> {
  private items = new Map<string, T>();

  register(item: T) {
    log().start("Registering item", item.name);
    log().info("Current count of items", this.items.size);
    if (!this.items.has(item.name)) {
      this.items.set(item.name, item);
    }
    log().debug("Items", Array.from(this.items.keys()));
    log().info("Count of items after new", this.items.size);
    log().success("Item registered", item.name);
  }

  list(): Record<string, T> {
    log().start("Listing items");
    log().info("Current count of items", this.items.size);
    return Object.fromEntries(this.items);
  }

  get(name: string): T | undefined {
    log().start("Getting item", name);
    log().info("Current count of items", this.items.size);
    log().debug("Items", Array.from(this.items.keys()));
    return this.items.get(name);
  }

  update(item: T) {
    log().start("Updating item", item.name);
    log().info("Current count of items", this.items.size);
    log().debug("Item", item);

    if (this.items.has(item.name)) {
      this.items.set(item.name, item);
      log().success("Item updated", item.name);
    } else {
      log().error("Item not found", item.name);
    }
  }
}
