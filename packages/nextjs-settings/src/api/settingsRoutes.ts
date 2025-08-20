// @core-mfg/nextjs-settings/handlers.ts
import { NextRequest, NextResponse } from "next/server";
import { Settings, SettingsManager } from "../settings";

import { Logger } from "@core-mfg/nextjs-logging";

const logger = new Logger("settings", "package", "info", true, true);

export function makeSettingsHandlers<T extends Settings>(manager: SettingsManager<T>) {
  return {
    /** GET /api/settings → return all settings */
    GET: async () => {
      try {
        const settings = await manager.get();
        return NextResponse.json({ settings });
      } catch (error) {
        console.error("[SettingsHandler] Failed to load settings", error);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
      }
    },

    /** POST /api/settings → create new setting (fails if key exists) */
    POST: async (req: NextRequest) => {
      try {
        const body = await req.json();
        const entries = Object.entries(body) as [keyof T, T[keyof T]][];

        for (const [key, value] of entries) {
          const existing = await manager.getValue(key);
          if (existing !== undefined) {
            return NextResponse.json(
              { error: `Setting '${String(key)}' already exists` },
              { status: 409 }
            );
          }
          await manager.setValue(key, value);
        }

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("[SettingsHandler] Failed to create setting", error);
        return NextResponse.json({ error: "Failed to create setting" }, { status: 500 });
      }
    },

    /** PUT /api/settings → update existing setting(s) */
    PUT: async (req: NextRequest) => {
      try {
        const body = await req.json();
        const entries = Object.entries(body) as [keyof T, T[keyof T]][];

        for (const [key, value] of entries) {
          const existing = await manager.getValue(key);
          if (existing === undefined) {
            return NextResponse.json(
              { error: `Setting '${String(key)}' not found` },
              { status: 404 }
            );
          }
          await manager.setValue(key, value);
        }

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("[SettingsHandler] Failed to update setting", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
      }
    },
  };
}
