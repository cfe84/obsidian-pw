import { App, Modal, Setting } from "obsidian";
import { DateTime } from "luxon";
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { TFile } from "obsidian";

export interface ExportConfig {
	startDate: DateTime | null;
	endDate: DateTime | null;
	includeTasksWithNoDates: boolean;
	includeNotes: boolean;
}

export class ReportExportModal extends Modal {
	private config: ExportConfig;
	private onSubmit: (config: ExportConfig) => void;

	constructor(
		app: App,
		allTodos: TodoItem<TFile>[],
		initialConfig: ExportConfig,
		onSubmit: (config: ExportConfig) => void
	) {
		super(app);
		this.config = { ...initialConfig };
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("pw-export-modal");

		contentEl.createEl("h2", { text: "Export Report" });

		// Date Range Settings
		new Setting(contentEl)
			.setName("Start Date")
			.setDesc("Beginning of report period")
			.addText((text) =>
				text
					.setValue(
						this.config.startDate
							? this.config.startDate.toISODate() || ""
							: ""
					)
					.setPlaceholder("YYYY-MM-DD")
					.onChange(async (value) => {
						this.config.startDate = value
							? DateTime.fromISO(value)
							: null;
					})
			);

		new Setting(contentEl)
			.setName("End Date")
			.setDesc("End of report period")
			.addText((text) =>
				text
					.setValue(
						this.config.endDate
							? this.config.endDate.toISODate() || ""
							: ""
					)
					.setPlaceholder("YYYY-MM-DD")
					.onChange(async (value) => {
						this.config.endDate = value
							? DateTime.fromISO(value)
							: null;
					})
			);

		// Include tasks with no dates
		new Setting(contentEl)
			.setName("Include Tasks with No Dates")
			.setDesc(
				"Include tasks that don't have due dates or completion dates"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.config.includeTasksWithNoDates)
					.onChange((value) => {
						this.config.includeTasksWithNoDates = value;
					})
			);

		// Include notes
		new Setting(contentEl)
			.setName("Include Notes")
			.setDesc("Include subtasks and notes")
			.addToggle((toggle) =>
				toggle.setValue(this.config.includeNotes).onChange((value) => {
					this.config.includeNotes = value;
				})
			);

		// Submit button
		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText("Export to Clipboard")
				.setCta()
				.onClick(() => {
					this.onSubmit(this.config);
					this.close();
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
