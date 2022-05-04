export interface ProletarianWizardSettings {
  version: number,
  buttonInLeftBar: boolean,
  archiveFolder: string,
  ignoreArchivedTodos: boolean
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
  version: 2,
  buttonInLeftBar: true,
  archiveFolder: "archive",
  ignoreArchivedTodos: true
}