export interface ProletarianWizardSettings {
  dailyNotes: {
    folder: string,
    template: string
  };
}

export const DEFAULT_SETTINGS: ProletarianWizardSettings = {
  dailyNotes: {
    folder: "21 - Recurrence/daily-notes",
    template: "# Notes\n\n"
  }
}