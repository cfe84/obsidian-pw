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
    containerEl.createEl('h3', { text: 'Daily notes' });

    new Setting(containerEl)
      .setName('Folder')
      .setDesc('Folder where daily notes are stored')
      .addText(text => text
        .setPlaceholder('Enter folder relative path')
        .setValue(this.plugin.settings.dailyNotes.folder)
        .onChange(async (value) => {
          this.plugin.settings.dailyNotes.folder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Template')
      .setDesc('Template for new notes')
      .addText(text => text
        .setPlaceholder('Some markdown is fine')
        .setValue(this.plugin.settings.dailyNotes.template)
        .onChange(async (value) => {
          this.plugin.settings.dailyNotes.template = value;
          await this.plugin.saveSettings();
        }));
  }
}