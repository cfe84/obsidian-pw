import { App, Modal, Setting } from "obsidian";
import { DateTime } from "luxon";

export class DateSelectionModal extends Modal {
	private startDate: DateTime;
	private endDate: DateTime;
	private onDateSelected: (date: DateTime) => void;
	private selectedDate: DateTime;

	constructor(
		app: App,
		startDate: DateTime,
		endDate: DateTime,
		onDateSelected: (date: DateTime) => void
	) {
		super(app);
		this.startDate = startDate;
		this.endDate = endDate;
		this.onDateSelected = onDateSelected;
		this.selectedDate = startDate;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: `Select Date (${this.startDate.toFormat(
				"MMM d"
			)} - ${this.endDate.toFormat("MMM d, yyyy")})`,
		});

		// Generate list of dates in range
		const dates: DateTime[] = [];
		let currentDate = this.startDate;

		while (currentDate <= this.endDate) {
			dates.push(currentDate);
			currentDate = currentDate.plus({ days: 1 });
		}

		// Create date selection container
		const dateContainer = contentEl.createDiv({
			cls: "pw-date-selection-container",
		});

		dates.forEach((date) => {
			const dateButton = dateContainer.createEl("button", {
				text: date.toFormat("cccc, MMMM d"),
				cls: "pw-date-selection-button",
			});

			if (date.equals(this.selectedDate)) {
				dateButton.addClass("pw-date-selected");
			}

			dateButton.addEventListener("click", () => {
				// Remove previous selection
				dateContainer
					.querySelectorAll(".pw-date-selected")
					.forEach((el) => el.removeClass("pw-date-selected"));

				// Add selection to clicked button
				dateButton.addClass("pw-date-selected");
				this.selectedDate = date;
			});
		});

		// Submit button
		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText("Create Daily Note")
				.setCta()
				.onClick(() => {
					this.onDateSelected(this.selectedDate);
					this.close();
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
