import { PlanningSettings, defaultSettings } from "./PlanningSettings";

const storageKey = "PW.PlanningSettings";

export class PlanningSettingsStore {
  static getSettings(): PlanningSettings {
    const serializedValue = localStorage.getItem(storageKey);
    if (serializedValue) {
      return JSON.parse(serializedValue);
    }
    return defaultSettings;
  }

  static saveSettings(settings: PlanningSettings) {
    const serializedValue = JSON.stringify(settings);
    localStorage.setItem(storageKey, serializedValue);
  }

  static decorateSetterWithSaveSettings(setter: (value: PlanningSettings) => void): ((value: PlanningSettings) => void) {
    return settings => {
      setter(settings);
      this.saveSettings(settings);
    }
  }
}