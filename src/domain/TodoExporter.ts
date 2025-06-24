import { TodoItem, TodoStatus } from "./TodoItem";
import { ExportConfig } from "../Views/ReportExportModal";
import { TFile } from "obsidian";
import { DateTime } from "luxon";
import { ProletarianWizardSettings } from "./ProletarianWizardSettings";

export class TodoExporter {
	/**
	 * Find a todo date by attribute name (same logic as report)
	 */
	private static findTodoDate(
		todo: TodoItem<TFile>,
		attribute: string
	): DateTime | null {
		if (!todo.attributes) {
			return null;
		}
		const attr = todo.attributes[attribute];
		if (attr) {
			const d = DateTime.fromISO(`${todo.attributes[attribute]}`);
			return d.isValid ? d : null;
		}
		return null;
	}

	/**
	 * Find the todo completion date (same logic as report)
	 */
	private static findTodoCompletionDate(
		todo: TodoItem<TFile>,
		settings: ProletarianWizardSettings
	): DateTime | null {
		let d = this.findTodoDate(todo, settings.completedDateAttribute);
		if (d) {
			return d;
		}
		d = this.findTodoDate(todo, settings.dueDateAttribute);
		if (d) {
			return d;
		}
		return null;
	}

	/**
	 * Convert a TodoStatus to a markdown-friendly emoji
	 */
	private static statusToEmoji(status: TodoStatus): string {
		switch (status) {
			case TodoStatus.Complete:
				return "✅";
			case TodoStatus.Canceled:
				return "❌";
			case TodoStatus.InProgress:
				return "🔄";
			case TodoStatus.AttentionRequired:
				return "⚠️";
			case TodoStatus.Delegated:
				return "👬";
			case TodoStatus.Todo:
			default:
				return "🔲";
		}
	}

	/**
	 * Format a todo item as a markdown line
	 */
	private static formatTodoAsMarkdown(
		todo: TodoItem<TFile>,
		includeNotes: boolean
	): string {
		let result = `- ${this.statusToEmoji(todo.status)} ${todo.text}`;

		// Add attributes as badges
		if (todo.attributes) {
			const badges: string[] = [];

			// Format due date with friendly date format
			if (todo.attributes.due) {
				const dueDate = DateTime.fromISO(
					todo.attributes.due.toString()
				);
				if (dueDate.isValid) {
					badges.push(`📅 ${dueDate.toFormat("MMM d, yyyy")}`);
				} else {
					badges.push(`📅 ${todo.attributes.due}`);
				}
			}

			// Format completed date with friendly date format
			if (todo.attributes.completed) {
				const completedDate = DateTime.fromISO(
					todo.attributes.completed.toString()
				);
				if (completedDate.isValid) {
					badges.push(`✔️ ${completedDate.toFormat("MMM d, yyyy")}`);
				} else {
					badges.push(`✔️ ${todo.attributes.completed}`);
				}
			}

			// Format tags
			if (todo.attributes.tags) {
				let tags: string[];
				if (Array.isArray(todo.attributes.tags)) {
					tags = todo.attributes.tags;
				} else {
					tags = todo.attributes.tags.toString().split(",");
				}

				tags.forEach(
					(tag) => tag.trim() && badges.push(`#${tag.trim()}`)
				);
			}

			if (badges.length > 0) {
				result += ` (${badges.join(" ")})`;
			}
		}

		// Add file reference with wiki-style link
		if (todo.file) {
			const fileName =
				todo.file.name || todo.file.path.split("/").pop() || "";
			// Remove file extension for cleaner link display
			const displayName = fileName.replace(/\.[^/.]+$/, "");
			result += ` — [[${displayName}]]`;
		}

		// Add subtasks if requested
		if (includeNotes && todo.subtasks && todo.subtasks.length > 0) {
			result +=
				"\n" +
				todo.subtasks
					.map(
						(subtask) =>
							`  - ${
								subtask.status === TodoStatus.Complete
									? "✅"
									: "📝"
							} ${subtask.text}`
					)
					.join("\n");
		}

		return result;
	}

	/**
	 * Filter todos based on export configuration
	 */
	private static filterTodos(
		todos: TodoItem<TFile>[],
		config: ExportConfig,
		settings: ProletarianWizardSettings
	): TodoItem<TFile>[] {
		return todos.filter((todo) => {
			const todoDate = this.findTodoCompletionDate(todo, settings);

			// If task has no dates and we don't want to include them, filter out
			if (!todoDate && !config.includeTasksWithNoDates) {
				return false;
			}

			// Filter by date range (only if todo has a date)
			if (todoDate) {
				if (config.startDate && todoDate < config.startDate) {
					return false;
				}

				if (config.endDate && todoDate > config.endDate) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Group todos by date hierarchy (month, week, day) and then by status within each day
	 */
	private static groupByDate(
		todos: TodoItem<TFile>[],
		config: ExportConfig,
		settings: ProletarianWizardSettings
	): {
		monthEntries: Array<{
			monthKey: string;
			monthName: string;
			weekEntries: Array<{
				weekKey: string;
				weekName: string;
				dayEntries: Array<{
					dayKey: string;
					dayName: string;
					todos: TodoItem<TFile>[];
				}>;
			}>;
		}>;
	} {
		// Initialize result structure
		const months: Record<
			string,
			{
				monthName: string;
				weeks: Record<
					string,
					{
						weekName: string;
						days: Record<
							string,
							{
								dayName: string;
								todos: TodoItem<TFile>[];
							}
						>;
					}
				>;
			}
		> = {};

		// Group by month, week, day
		todos.forEach((todo) => {
			const date = this.findTodoCompletionDate(todo, settings);
			if (!date) {
				// Handle todos without dates
				const noDateMonth = "no-date";
				const noDateWeek = "no-week";
				const noDateDay = "no-day";

				if (!months[noDateMonth]) {
					months[noDateMonth] = {
						monthName: "No Date",
						weeks: {},
					};
				}

				if (!months[noDateMonth].weeks[noDateWeek]) {
					months[noDateMonth].weeks[noDateWeek] = {
						weekName: "No Week",
						days: {},
					};
				}

				if (!months[noDateMonth].weeks[noDateWeek].days[noDateDay]) {
					months[noDateMonth].weeks[noDateWeek].days[noDateDay] = {
						dayName: "No Date Assigned",
						todos: [],
					};
				}

				months[noDateMonth].weeks[noDateWeek].days[
					noDateDay
				].todos.push(todo);
				return;
			}

			// Create month key (e.g., "2025-06")
			const monthKey = date.toFormat("yyyy-MM");
			const monthName = date.toFormat("MMMM yyyy");

			// Create week key (e.g., "Week 25")
			const weekNumber = date.weekNumber;
			const weekKey = `${date.year}-W${weekNumber
				.toString()
				.padStart(2, "0")}`;
			const weekStart = date.startOf("week");
			const weekEnd = date.endOf("week");
			const weekName = `Week ${weekNumber} (${weekStart.toFormat(
				"MMM dd"
			)} - ${weekEnd.toFormat("MMM dd")})`;

			// Create day key (e.g., "2025-06-20")
			const dayKey = date.toFormat("yyyy-MM-dd");
			const dayName = date.toFormat("EEEE, MMMM d");

			// Initialize objects if they don't exist
			if (!months[monthKey]) {
				months[monthKey] = {
					monthName: monthName,
					weeks: {},
				};
			}

			if (!months[monthKey].weeks[weekKey]) {
				months[monthKey].weeks[weekKey] = {
					weekName: weekName,
					days: {},
				};
			}

			if (!months[monthKey].weeks[weekKey].days[dayKey]) {
				months[monthKey].weeks[weekKey].days[dayKey] = {
					dayName: dayName,
					todos: [],
				};
			}

			// Add todo to its day
			months[monthKey].weeks[weekKey].days[dayKey].todos.push(todo);
		});

		// Sort todos within each day by status
		Object.values(months).forEach((month) => {
			Object.values(month.weeks).forEach((week) => {
				Object.values(week.days).forEach((day) => {
					// Sort todos by status (ascending: complete > in progress > todo)
					day.todos.sort((a, b) => {
						// Primary sort by status
						if (a.status !== b.status) {
							return a.status - b.status;
						}

						// Secondary sort by text for todos with the same status
						return a.text.localeCompare(b.text);
					});
				});
			});
		});

		// Convert nested objects to sorted arrays for consistent order
		const monthEntries = Object.entries(months)
			.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort months oldest to newest
			.map(([monthKey, monthData]) => {
				const weekEntries = Object.entries(monthData.weeks)
					.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort weeks oldest to newest
					.map(([weekKey, weekData]) => {
						const dayEntries = Object.entries(weekData.days)
							.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort days oldest to newest
							.map(([dayKey, dayData]) => ({
								dayKey,
								dayName: dayData.dayName,
								todos: dayData.todos,
							}));

						return {
							weekKey,
							weekName: weekData.weekName,
							dayEntries,
						};
					});

				return {
					monthKey,
					monthName: monthData.monthName,
					weekEntries,
				};
			});

		return { monthEntries };
	}

	/**
	 * Generate the markdown export
	 */
	public static generateMarkdown(
		todos: TodoItem<TFile>[],
		config: ExportConfig,
		settings: ProletarianWizardSettings
	): string {
		// Filter todos
		const filteredTodos = this.filterTodos(todos, config, settings);

		// Group todos by date hierarchy
		const { monthEntries } = this.groupByDate(
			filteredTodos,
			config,
			settings
		);

		// Build the markdown
		let markdown = `# Task Report\n\n`;

		// Add export timestamp
		markdown += `*Generated on ${DateTime.now().toFormat(
			"MMMM d, yyyy 'at' h:mm a"
		)}*\n\n`;

		// Add date range
		if (config.startDate || config.endDate) {
			markdown += `**Date range:** `;
			if (config.startDate) {
				markdown += config.startDate.toFormat("MMMM d, yyyy");
			} else {
				markdown += "Beginning";
			}
			markdown += ` to `;
			if (config.endDate) {
				markdown += config.endDate.toFormat("MMMM d, yyyy");
			} else {
				markdown += "Present";
			}
			markdown += `\n\n`;
		}

		// Add summary stats
		markdown += `**Total tasks:** ${filteredTodos.length}\n\n`;

		if (filteredTodos.length === 0) {
			markdown += `*No tasks found matching the selected criteria.*\n\n`;
		}

		// Add todos by date hierarchy
		monthEntries.forEach(({ monthKey, monthName, weekEntries }) => {
			// Month as h1
			markdown += `# ${monthName}\n\n`;

			weekEntries.forEach(({ weekKey, weekName, dayEntries }) => {
				// Week as h2
				markdown += `## ${weekName}\n\n`;

				dayEntries.forEach(({ dayKey, dayName, todos }) => {
					// Day as h3
					markdown += `### ${dayName}\n\n`;

					if (todos.length === 0) {
						markdown += `*No tasks for this day*\n\n`;
					} else {
						// Render todos sorted by status
						todos.forEach((todo) => {
							markdown +=
								this.formatTodoAsMarkdown(
									todo,
									config.includeNotes
								) + "\n";
						});

						markdown += "\n";
					}
				});
			});
		});

		return markdown;
	}

	/**
	 * Export todos to clipboard
	 */
	public static async exportToClipboard(
		todos: TodoItem<TFile>[],
		config: ExportConfig,
		settings: ProletarianWizardSettings
	): Promise<void> {
		const markdown = this.generateMarkdown(todos, config, settings);
		await navigator.clipboard.writeText(markdown);
	}
}
