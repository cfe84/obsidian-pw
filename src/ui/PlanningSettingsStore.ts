import { PlanningSettings, getDefaultSettings } from "./PlanningSettings";

const storageKey = "PW.PlanningSettings";

export class PlanningSettingsStore {
  static getSettings(): PlanningSettings {
    const serializedValue = localStorage.getItem(storageKey);
    let value = getDefaultSettings();
    if (serializedValue) {
      const saved = JSON.parse(serializedValue);
      Object.assign(value, saved);
    }
    return value;
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