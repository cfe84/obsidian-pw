import { DEFAULT_SETTINGS } from "../../src/domain/ProletarianWizardSettings";

describe("App settings", () => {
  it("shows selected tasks in separate columns by default", () => {
    expect(DEFAULT_SETTINGS.selectedTasksInSeparateColumns).toBe(true);
  });
});
