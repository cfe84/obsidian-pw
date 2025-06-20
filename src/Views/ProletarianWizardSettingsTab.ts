import ProletarianWizard from "../main";
import {
	App,
	ButtonComponent,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
} from "obsidian";
import { FolderSelectionModal } from "./FolderSelectionModal";

export class ProletarianWizardSettingsTab extends PluginSettingTab {
	plugin: ProletarianWizard;

	constructor(app: App, plugin: ProletarianWizard) {
		super(app, plugin);
		this.plugin = plugin;
	}

	toggleError(spanFolderError: HTMLSpanElement, on: boolean) {
		if (on) {
			spanFolderError.innerText = "This folder doesn't exist!";
		} else {
			spanFolderError.innerText = "";
		}
	}

	async validateArchiveFolder(folder: string): Promise<boolean> {
		return await this.app.vault.adapter.exists(folder, true);
	}

	async validateArchiveFromFolder(folders: string[]): Promise<boolean> {
		const exist = await Promise.all(
			folders.map((folder) => this.app.vault.adapter.exists(folder, true))
		);
		return exist.indexOf(false) < 0;
	}

	// Show modal for folder selection
	private showFolderSelectionModal(): void {
		const modal = new FolderSelectionModal(
			this.app,
			this.plugin.settings.ignoredFolders,
			async (selectedFolder: string) => {
				if (
					!this.plugin.settings.ignoredFolders.contains(
						selectedFolder
					)
				) {
					this.plugin.settings.ignoredFolders.push(selectedFolder);
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings view
				}
			}
		);
		modal.open();
	}

	// Render the list of ignored folders with delete buttons
	private renderIgnoredFolders(containerEl: HTMLElement): void {
		containerEl.empty();

		if (this.plugin.settings.ignoredFolders.length === 0) {
			containerEl
				.createEl("div", { text: "No folders are being ignored." })
				.addClass("pw-no-ignored-folders");
			return;
		}

		const list = containerEl.createEl("ul");
		list.addClass("pw-ignored-folders-items");

		for (const folder of this.plugin.settings.ignoredFolders) {
			const item = list.createEl("li");
			item.addClass("pw-ignored-folder-item");

			const folderText = item.createEl("span", { text: folder || "/" });
			folderText.addClass("pw-ignored-folder-name");

			const removeButton = new ButtonComponent(item);
			removeButton
				.setIcon("trash")
				.setTooltip("Remove")
				.onClick(async () => {
					this.plugin.settings.ignoredFolders.remove(folder);
					await this.plugin.saveSettings();
					this.renderIgnoredFolders(containerEl); // Re-render only the list
				});
		}
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Planning").setHeading();

		new Setting(containerEl)
			.setName("Daily WIP limit")
			.setDesc("Default daily limit for work in process")
			.addText((txt) =>
				txt
					.setValue(
						this.plugin.settings.defaultDailyWipLimit.toString()
					)
					.onChange(async (txtValue) => {
						const value = Number.parseInt(txtValue);
						if (Number.isNaN(value)) {
							this.plugin.settings.defaultDailyWipLimit = 0;
						} else
							this.plugin.settings.defaultDailyWipLimit = value;
					})
			);

		new Setting(containerEl).setName("Ignore").setHeading();

		// Ignored folders section
		const ignoredFoldersSection = containerEl.createEl("div");
		ignoredFoldersSection.addClass("pw-ignored-folders-section");

		new Setting(ignoredFoldersSection)
			.setName("Ignored folders")
			.setDesc("Folders from which you don't want todos")
			.addButton((button) => {
				button
					.setButtonText("Add folder")
					.setCta()
					.onClick(() => {
						this.showFolderSelectionModal();
					});
			});

		// Display current ignored folders
		const ignoredFoldersList = ignoredFoldersSection.createEl("div");
		ignoredFoldersList.addClass("pw-ignored-folders-list");
		this.renderIgnoredFolders(ignoredFoldersList);

		const days = [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday",
		];

		new Setting(containerEl)
			.setName("First weekday")
			.setDesc("Specify the first weekday weekend filtering")
			.addDropdown((dropDown) => {
				days.forEach((display, index) =>
					dropDown.addOption((index + 1).toString(), display)
				);
				dropDown.setValue(
					(this.plugin.settings.firstWeekday ?? 1).toString()
				);
				dropDown.onChange(async (value: string) => {
					this.plugin.settings.firstWeekday = parseInt(value);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Show weekend in planning")
			.setDesc("Should weekend days be displayed in the planning view")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showWeekEnds)
					.onChange(async (value) => {
						this.plugin.settings.showWeekEnds = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Ignore archived todo")
			.setDesc("Ignore todos in file under archive folder")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ignoreArchivedTodos)
					.onChange(async (value) => {
						this.plugin.settings.ignoreArchivedTodos = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Attributes").setHeading();

		new Setting(containerEl)
			.setName("Use Dataview Syntax")
			.setDesc(
				"Default (off) is @due(2025-01-01). When turned on, syntax becomes [due:: 2025-01-01]"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useDataviewSyntax)
					.onChange(async (value) => {
						this.plugin.settings.useDataviewSyntax = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Due date attribute")
			.setDesc("Attribute to set a todo due date")
			.addText((toggle) =>
				toggle
					.setValue(this.plugin.settings.dueDateAttribute)
					.onChange(async (value) => {
						if (!value || value.contains(" ")) {
							return;
						} else {
							this.plugin.settings.dueDateAttribute = value;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Completed date attribute")
			.setDesc("Attribute to set a todo completed date")
			.addText((toggle) =>
				toggle
					.setValue(this.plugin.settings.completedDateAttribute)
					.onChange(async (value) => {
						if (!value || value.contains(" ")) {
							return;
						} else {
							this.plugin.settings.completedDateAttribute = value;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Selected attribute")
			.setDesc("Attribute to selected a todo")
			.addText((toggle) =>
				toggle
					.setValue(this.plugin.settings.selectedAttribute)
					.onChange(async (value) => {
						if (!value || value.contains(" ")) {
							return;
						} else {
							this.plugin.settings.selectedAttribute = value;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Track start time")
			.setDesc("Track when todo was moved to 'In progress'")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.trackStartTime)
					.onChange(async (value) => {
						this.plugin.settings.trackStartTime = value;
						await this.plugin.saveSettings();
						startedAttribute.setDisabled(!value);
					})
			);

		const startedAttribute = new Setting(containerEl)
			.setName("Started attribute")
			.setDesc("Attribute to track the started date of a todo")
			.addText((toggle) =>
				toggle
					.setValue(this.plugin.settings.startedAttribute)
					.onChange(async (value) => {
						if (!value || value.contains(" ")) {
							return;
						} else {
							this.plugin.settings.startedAttribute = value;
							await this.plugin.saveSettings();
						}
					})
			)
			.setDisabled(!this.plugin.settings.trackStartTime);

		new Setting(containerEl).setName("Progress Tracking").setHeading();

		new Setting(containerEl)
			.setName("Default start hour")
			.setDesc("Default start hour for daily progress tracking")
			.addText((text) =>
				text
					.setPlaceholder("08:00")
					.setValue(this.plugin.settings.defaultStartHour || "08:00")
					.onChange(async (value) => {
						this.plugin.settings.defaultStartHour = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default end hour")
			.setDesc("Default end hour for daily progress tracking")
			.addText((text) =>
				text
					.setPlaceholder("17:00")
					.setValue(this.plugin.settings.defaultEndHour || "17:00")
					.onChange(async (value) => {
						this.plugin.settings.defaultEndHour = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Display today's progress bar")
			.setDesc(
				"Show a progress bar representing today's progress in working hours"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.displayTodayProgressBar !== false
					)
					.onChange(async (value) => {
						this.plugin.settings.displayTodayProgressBar = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
