// src/registry/baseRegistry.ts

export interface Registrable {
  name: string;
}

export class Registry<T extends Registrable> {
  private items = new Map<string, T>();

  register(item: T) {
    console.log("[Registry] registering item", item.name);
    console.log("[Registry] current count of items", this.items.size);
    if (!this.items.has(item.name)) {
      this.items.set(item.name, item);
    }
    console.log("[Registry] items", Array.from(this.items.keys()));
    console.log("[Registry] count of items after new", this.items.size);
  }

  list(): Record<string, T> {
    console.log("[Registry] listing items");
    console.log("[Registry] current count of items", this.items.size);
    console.log("[Registry] items", Array.from(this.items.keys()));
    console.log("[Registry] count of items after list", this.items.size);
    return Object.fromEntries(this.items);
  }

  get(name: string): T | undefined {
    console.log("[Registry] getting item", name);
    console.log("[Registry] current count of items", this.items.size);
    console.log("[Registry] items", Array.from(this.items.keys()));
    console.log("[Registry] count of items after get", this.items.size);
    return this.items.get(name);
  }

  update(item: T) {
    if (this.items.has(item.name)) {
      this.items.set(item.name, item);
    }
  }
}
