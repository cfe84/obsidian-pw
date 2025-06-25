import { App, TFile } from "obsidian";
import { DateTime } from "luxon";

export class DailyNoteService {
	constructor(private app: App) {}

	/**
	 * Get the daily notes folder path from settings
	 */
	private getDailyNotesFolder(): string {
		// Access Obsidian's daily notes plugin settings
		const dailyNotesSettings = (this.app as any).internalPlugins?.plugins?.[
			"daily-notes"
		]?.instance?.options;
		return dailyNotesSettings?.folder || "";
	}

	/**
	 * Get the daily note template from settings
	 */
	private getDailyNoteTemplate(): string {
		const dailyNotesSettings = (this.app as any).internalPlugins?.plugins?.[
			"daily-notes"
		]?.instance?.options;
		let templatePath = dailyNotesSettings?.template;
		if (templatePath && !templatePath.endsWith(".md")) {
			// Ensure the template path ends with .md
			templatePath += ".md";
		}
		return templatePath || "";
	}

	/**
	 * Get the daily note format from settings
	 */
	private getDailyNoteFormat(): string {
		const dailyNotesSettings = (this.app as any).internalPlugins?.plugins?.[
			"daily-notes"
		]?.instance?.options;
		return dailyNotesSettings?.format || "YYYY-MM-DD";
	}

	/**
	 * Generate daily note filename for a given date
	 */
	private generateDailyNoteFilename(date: DateTime): string {
		const format = this.getDailyNoteFormat();
		// Convert moment.js format to luxon format
		const luxonFormat = format
			.replace(/date/g, "yyyy-MM-dd")
			.replace(/time/g, "HH:mm")
			.replace(/YYYY/g, "yyyy")
			.replace(/MM/g, "MM")
			.replace(/DD/g, "dd")
			.replace(/Do/g, "d")
			.replace(/ddd/g, "ccc")
			.replace(/dddd/g, "cccc");
		return date.toFormat(luxonFormat) + ".md";
	}

	/**
	 * Get daily note path for a given date
	 */
	private getDailyNotePath(date: DateTime): string {
		const folder = this.getDailyNotesFolder();
		const filename = this.generateDailyNoteFilename(date);
		return folder ? `${folder}/${filename}` : filename;
	}

	/**
	 * Check if daily note exists for given date
	 */
	async dailyNoteExists(date: DateTime): Promise<TFile | null> {
		const path = this.getDailyNotePath(date);
		const file = this.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile ? file : null;
	}

	/**
	 * Create or open daily note for given date
	 */
	async createOrOpenDailyNote(date: DateTime): Promise<void> {
		const existingFile = await this.dailyNoteExists(date);

		if (existingFile) {
			// Open existing note
			await this.app.workspace.getLeaf().openFile(existingFile);
		} else {
			// Create new daily note
			await this.createDailyNote(date);
		}
	}

	/**
	 * Create a new daily note for given date
	 */
	private async createDailyNote(date: DateTime): Promise<void> {
		const path = this.getDailyNotePath(date);
		const folder = this.getDailyNotesFolder();

		// Ensure folder exists
		if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
			await this.app.vault.createFolder(folder);
		}

		// Create file with template content
		const content = await this.generateDailyNoteContent(date);
		const file = await this.app.vault.create(path, content);

		// Open the new file
		await this.app.workspace.getLeaf().openFile(file);
	}

	/**
	 * Generate basic content for daily note
	 */
	private async generateDailyNoteContent(date: DateTime): Promise<string> {
		const templatePath = this.getDailyNoteTemplate();

		if (templatePath) {
			// Try to get the template file
			const templateFile =
				this.app.vault.getAbstractFileByPath(templatePath);
			if (templateFile instanceof TFile) {
				try {
					let templateContent = await this.app.vault.read(
						templateFile
					);

					// Replace common date placeholders in the template
					const dateStr = date.toFormat("yyyy-MM-dd");
					const timeStr = date.toFormat("HH:mm");
					const isoDate = date.toISODate();
					const shortDate = date.toFormat("MM/dd/yyyy");
					const yearMonthDay = date.toFormat("yyyy-MM-dd");
					const dayOfWeek = date.toFormat("cccc");
					const monthName = date.toFormat("MMMM");
					const dayNumber = date.toFormat("d");
					const year = date.toFormat("yyyy");

					// Handle various date format patterns that might be in templates
					templateContent = templateContent
						// Common Obsidian template variables
						.replace(/{{date}}/g, dateStr)
						.replace(/{{date:YYYY-MM-DD}}/g, isoDate || "")
						.replace(/{{date:yyyy-MM-dd}}/g, yearMonthDay)
						.replace(/{{date:MM\/dd\/yyyy}}/g, shortDate)
						.replace(/{{date:MM\/DD\/YYYY}}/g, shortDate)
						.replace(/{{date:dddd, MMMM Do, YYYY}}/g, dateStr)
						.replace(/{{date:cccc, MMMM d, yyyy}}/g, dateStr)
						.replace(/{{title}}/g, dateStr)
						// Individual components
						.replace(/{{date:YYYY}}/g, year)
						.replace(/{{date:yyyy}}/g, year)
						.replace(/{{date:MMMM}}/g, monthName)
						.replace(/{{date:dddd}}/g, dayOfWeek)
						.replace(/{{date:cccc}}/g, dayOfWeek)
						.replace(/{{date:DD}}/g, dayNumber.padStart(2, "0"))
						.replace(/{{date:dd}}/g, dayNumber.padStart(2, "0"))
						.replace(/{{date:D}}/g, dayNumber)
						.replace(/{{date:d}}/g, dayNumber)
						.replace(/{{time}}/g, timeStr);

					return templateContent;
				} catch (error) {
					console.warn("Failed to read daily note template:", error);
				}
			}
		}

		// Fallback to basic template if no template file or error reading it
		const dateStr = date.toFormat("cccc, MMMM d, yyyy");
		return `# ${dateStr}\n\n## Tasks\n\n## Notes\n\n`;
	}
}
