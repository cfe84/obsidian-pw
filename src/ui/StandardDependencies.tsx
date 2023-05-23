import { App } from "obsidian";
import { ILogger } from "src/domain/ILogger";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";

export interface StandardDependencies {
  logger: ILogger,
  app: App,
  settings: ProletarianWizardSettings,
}