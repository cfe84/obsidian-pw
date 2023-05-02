export interface ProletarianWizardSettings {
  version: number,
  buttonInLeftBar: boolean,
  ignoredFolders: string[],
  ignoreArchivedTodos: boolean,
  defaultDailyWipLimit: number,
  dueDateAttribute: string,
  completedDateAttribute: string,
  selectedAttribute: string
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
  version: 3,
  buttonInLeftBar: true,
  ignoredFolders: [],
  ignoreArchivedTodos: true,
  defaultDailyWipLimit: 5,
  dueDateAttribute: "due",
  completedDateAttribute: "completed",
  selectedAttribute: "selected"
}