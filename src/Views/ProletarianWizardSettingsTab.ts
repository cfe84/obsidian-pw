import ProletarianWizard from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class ProletarianWizardSettingsTab extends PluginSettingTab {
  plugin: ProletarianWizard;

  constructor(app: App, plugin: ProletarianWizard) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Proletarian Wizard' });
    containerEl.createEl('h3', { text: 'UI' });

    new Setting(containerEl)
      .setName('Planning ribbon icon')
      .setDesc('Show planning ribbon icon in left bar')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.buttonInLeftBar)
        .onChange(async (value) => {
          this.plugin.settings.buttonInLeftBar = value;
          await this.plugin.saveSettings();
        }));
  }
}