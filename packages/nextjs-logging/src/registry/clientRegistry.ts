import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { LogConfigEntry } from "../levels";

interface ILoggerRegistry {
  loggers: Record<string, LogConfigEntry>;
  setLogger: (entry: Partial<LogConfigEntry>) => void;
  getLogger: (name: string) => LogConfigEntry | undefined;
  getAll(): LogConfigEntry[];
};

export const useLoggerStore = create<ILoggerRegistry>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        loggers: {},
        setLogger: (entry) => {
          if (!entry.name) {
            console.error("Logger name is required");
            return;
          }
          const name = entry.name;
          set((state) => ({
            loggers: {
              ...state.loggers,
              [name]: { ...state.loggers[name] ?? {}, ...entry } as LogConfigEntry,
            },
          }));
        },
        getLogger: (name) => get().loggers[name],
        getAll: () => Object.values(get().loggers),
      }),
      {
        name: "logger-store",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);
