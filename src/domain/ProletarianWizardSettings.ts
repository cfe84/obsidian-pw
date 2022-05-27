export interface ProletarianWizardSettings {
  version: number,
  buttonInLeftBar: boolean,
  archiveFolder: string,
  archiveFrom: string[],
  ignoreArchivedTodos: boolean,
  defaultDailyWipLimit: number,
  dueDateAttribute: string,
  completedDateAttribute: string,
  selectedAttribute: string
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
  version: 2,
  buttonInLeftBar: true,
  archiveFolder: "archive",
  archiveFrom: [],
  ignoreArchivedTodos: true,
  defaultDailyWipLimit: 5,
  dueDateAttribute: "due",
  completedDateAttribute: "completed",
  selectedAttribute: "selected"
}