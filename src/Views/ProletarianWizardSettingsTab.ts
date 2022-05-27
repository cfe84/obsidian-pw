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
    return await this.app.vault.adapter.exists(folder, true)
  }

  async validateArchiveFromFolder(folders: string[]): Promise<boolean> {
    const exist = await Promise.all(folders.map(folder => this.app.vault.adapter.exists(folder, true)))
    return exist.indexOf(false) < 0
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

    containerEl.createEl('h3', { text: 'Planning' });

    new Setting(containerEl)
      .setName('Daily WIP limit')
      .setDesc('Default daily limit for work in process')
      .addText(txt => txt
        .setValue(this.plugin.settings.defaultDailyWipLimit.toString())
        .onChange(async (txtValue) => {
          const value = Number.parseInt(txtValue)
          if (Number.isNaN(value)) {
            this.plugin.settings.defaultDailyWipLimit = 0
          } else
            this.plugin.settings.defaultDailyWipLimit = value
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
      .setName('Archive from')
      .setDesc('Folders from where you will archive (; separated, leave empty if all)')
      .addText(toggle => toggle
        .setValue(this.plugin.settings.archiveFrom.join(";"))
        .onChange(async (value) => {
          const folders = value.split(";")
          if (!await this.validateArchiveFromFolder(folders)) {
            this.toggleError(spanArchiveFromError, true)
          } else {
            this.toggleError(spanArchiveFromError, false)
            this.plugin.settings.archiveFrom = folders;
            await this.plugin.saveSettings();
          }
        }));

    let spanArchiveFromError = containerEl.createEl('span', { text: '', cls: 'pw-error' });
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