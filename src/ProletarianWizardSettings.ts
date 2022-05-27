export interface ProletarianWizardSettings {
  version: number,
  buttonInLeftBar: boolean,
  archiveFolder: string,
  archiveFrom: string[],
  ignoreArchivedTodos: boolean,
  defaultDailyWipLimit: number
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
  version: 2,
  buttonInLeftBar: true,
  archiveFolder: "archive",
  archiveFrom: [],
  ignoreArchivedTodos: true,
  defaultDailyWipLimit: 5
}