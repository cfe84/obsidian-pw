import * as fs from "fs"
import * as path from "path"
import ProletarianWizard from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class ProletarianWizardSettingsTab extends PluginSettingTab {
  plugin: ProletarianWizard;

  constructor(app: App, plugin: ProletarianWizard) {
    super(app, plugin);
    this.plugin = plugin;
  }

  toggleError(spanFolderError: HTMLSpanElement, on: boolean) {
    if (on) {
      spanFolderError.innerHTML = "This folder doesn't exist!"
    } else {
      spanFolderError.innerHTML = ""
    }
  }

  async validateArchiveFolder(folder: string): Promise<boolean> {
    return await this.app.vault.adapter.exists(folder, false)
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

    containerEl.createEl('h3', { text: 'Archive' });

    new Setting(containerEl)
      .setName('Archive folder')
      .setDesc('Folder where your archives are going')
      .addText(toggle => toggle
        .setValue(this.plugin.settings.archiveFolder)
        .onChange(async (value) => {
          if (!await this.validateArchiveFolder(value)) {
            this.toggleError(spanFolderError, true)
          } else {
            this.toggleError(spanFolderError, false)
            this.plugin.settings.archiveFolder = value;
            await this.plugin.saveSettings();
          }
        }));

    let spanFolderError = containerEl.createEl('span', { text: '', cls: 'pw-error' });
    this.validateArchiveFolder(this.plugin.settings.archiveFolder).then(folderIsvalid => {
      this.toggleError(spanFolderError, !folderIsvalid)
    })

    new Setting(containerEl)
      .setName('Ignore archived todo')
      .setDesc('Ignore todos in file under archive folder')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.ignoreArchivedTodos)
        .onChange(async (value) => {
          this.plugin.settings.ignoreArchivedTodos = value;
          await this.plugin.saveSettings();
        }));
  }
}