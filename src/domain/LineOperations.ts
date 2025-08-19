import { TodoItem, TodoStatus } from "./TodoItem";
import { IDictionary } from "./IDictionary";
import { Completion } from "./Completion";
import { ProletarianWizardSettings } from "./ProletarianWizardSettings";

export interface ILineStructure {
	indentation: string;
	listMarker: string;
	checkbox: string;
	date: string;
	line: string;
}

export interface ITodoParsingResult<T> {
	isTodo: boolean;
	lineNumber: number;
	todo?: TodoItem<T>;
	isBlank?: boolean;
	indentLevel: number;
}

export interface IAttributesStructure {
	textWithoutAttributes: string;
	attributes: IDictionary<string | boolean>;
}

export class LineOperations {
	constructor(private settings?: ProletarianWizardSettings) {}

	parseLine(line: string): ILineStructure {
		const regexp =
			/^(\s*)?(?:([*-]|\d+\.)\s*)?(?:(\[.?\])\s+)?(?:((?:\d\d\d\d-)?\d\d-\d\d):\s*)?(.+)/;
		const parsed = regexp.exec(line);
		if (!parsed) {
			return {
				indentation: "",
				listMarker: "",
				checkbox: "",
				date: "",
				line: line,
			};
		}
		return {
			indentation: parsed[1] || "",
			listMarker: parsed[2] || "",
			checkbox: parsed[3] || "",
			date: parsed[4] || "",
			line: parsed[5] || "",
		};
	}

	lineToString(line: ILineStructure): string {
		const space = (item: string, char: string = " ") =>
			item ? `${item}${char}` : "";
		return `${line.indentation}${space(line.listMarker)}${space(
			line.checkbox
		)}${space(line.date, ": ")}${line.line}`;
	}

	/**
	 * Provide a RegExp for matching attributes, depending on the syntax settings.
	 * For "classic" syntax, it’s something like `@due(2024-02-02)`,
	 * For "dataview" syntax, it’s something like `[due:: 2024-02-02]`.
	 */
	private getAttributeRegex(): RegExp {
		if (this.settings?.useDataviewSyntax) {
			// Example pattern for [key:: value]
			return /\[([^:\]]+)::([^\]]+)\]/g;
		} else {
			// Classic pattern for @key(value)
			return /@(\w+)(?:\(([^)]+)\))?/g;
		}
	}

	/**
	 * Convert a matched string (like `@due(2025-01-01)` or `[due:: 2025-01-01]`)
	 * into an array: `[attributeKey, attributeValueOrBoolean]`.
	 */
	private parseSingleAttribute(matchStr: string): [string, string | boolean] {
		if (this.settings?.useDataviewSyntax) {
			const regex = /\[([^:\]]+)::([^\]]+)\]/;
			const submatch = regex.exec(matchStr);
			if (!submatch) {
				// fallback if something goes wrong
				return ["", false];
			}
			const key = submatch[1].trim();
			const value = submatch[2].trim();
			return [key, value];
		} else {
			// For classic syntax: "@(\w+)(?:\(([^)]+)\))?"
			const regex = /@(\w+)(?:\(([^)]+)\))?/;
			const submatch = regex.exec(matchStr);
			if (!submatch) {
				return ["", false];
			}
			const key = submatch[1].trim();
			const val = submatch[2] ? submatch[2].trim() : true;
			return [key, val];
		}
	}

	/**
	 * Convert a single `key` and `value` into a string
	 * according to the currently used syntax.
	 *
	 * e.g. with classic syntax:
	 *   if value is boolean => `@due`
	 *   if value is string  => `@due(2025-01-01)`
	 * e.g. with dataview syntax:
	 *   `[due:: 2025-01-01]`
	 */
	private attributeToString(key: string, value: string | boolean): string {
		if (this.settings?.useDataviewSyntax) {
			// For Dataview: `[key:: value]`
			// In case value is boolean (like a tag), just store the key or do some fallback
			if (typeof value === "boolean") {
				// Maybe store `[key:: true]` or skip it—decide how you want it.
				return `[${key}:: true]`;
			}
			return `[${key}:: ${value}]`;
		} else {
			// For classic: `@key` or `@key(value)`
			if (typeof value === "boolean") {
				return `@${key}`;
			}
			return `@${key}(${value})`;
		}
	}

	parseWikilinkDate(text: string): { date: string; fullText: string }[] {
		const wikilinkRegex = /\[\[(\d{4}-\d{2}-\d{2})\]\]/g;
		const matches = [...text.matchAll(wikilinkRegex)];
		if (matches.length > 0) {
			return matches.map((match) => ({
				date: match[1].trim(),
				fullText: match[0],
			}));
		}
		return [];
	}

	/**
	 * Parse the attributes from a given line, removing those attribute tokens
	 * from the text and returning a map of { key -> value } plus the stripped text.
	 */
	parseAttributes(text: string): IAttributesStructure {
		let textWithoutAttributes = text;

		// Parse regular attributes
		const regexp = this.getAttributeRegex();
		const matches = text.match(regexp);

		const res: IDictionary<string | boolean> = {};

		if (matches) {
			matches.forEach((match) => {
				const [attrKey, attrValue] = this.parseSingleAttribute(match);
				if (!attrKey) return; // skip if something invalid

				res[attrKey] = attrValue;
				// Remove that chunk from the text
				textWithoutAttributes = textWithoutAttributes.replace(
					match,
					""
				);
			});
		}

		// Parse wikilink date if present
		const dueDateAttribute = this.settings?.dueDateAttribute || "due";
		const wikilinkDates = this.parseWikilinkDate(textWithoutAttributes);
		if (wikilinkDates.length > 0 && !res[dueDateAttribute]) {
			const latestDate = wikilinkDates.sort((a, b) =>
				b.date.localeCompare(a.date)
			)[0];
			res[dueDateAttribute] = latestDate.date;
		}
		for (const wikilink of wikilinkDates) {
			textWithoutAttributes = textWithoutAttributes.replace(
				wikilink.fullText,
				""
			);
		}

		return {
			textWithoutAttributes: textWithoutAttributes.trim(),
			attributes: res,
		};
	}

	/**
	 * Build a single string from `textWithoutAttributes` + the attributes' dictionary.
	 * E.g. "Buy milk" + { due: "2025-01-01", critical: true }
	 * => "Buy milk @due(2025-01-01) @critical"
	 * or => "Buy milk [due:: 2025-01-01] [critical:: true]"
	 */
	attributesToString(attributesStructure: IAttributesStructure): string {
		const { textWithoutAttributes, attributes } = attributesStructure;
		const attributeStr = Object.keys(attributes)
			.map((key) => {
				const val = attributes[key];
				return this.attributeToString(key, val);
			})
			.join(" ");

		// add a space only if there are attributes
		return attributeStr
			? `${textWithoutAttributes} ${attributeStr}`.trim()
			: textWithoutAttributes;
	}

	convertAttributes(line: string): string {
		const parsedLine = this.parseLine(line);
		let parsedAttributes = this.parseAttributes(parsedLine.line);
		parsedAttributes = this.convertDateAttributes(parsedAttributes);
		parsedAttributes = this.convertPriorityAttributes(parsedAttributes);
		parsedLine.line = this.attributesToString(parsedAttributes);
		return this.lineToString(parsedLine);
	}

	private convertDateAttributes(
		attributes: IAttributesStructure
	): IAttributesStructure {
		Object.keys(attributes.attributes).forEach((key) => {
			const val = attributes.attributes[key];
			if (typeof val === "string") {
				// Complete date if it's an attribute value
				const completion = Completion.completeDate(val as string);
				if (completion !== null) {
					attributes.attributes[key] = completion;
				}
			} else if (val === true) {
				// try to convert tags like @today into @due(the_date)
				const completion = Completion.completeDate(key);
				if (completion !== null) {
					delete attributes.attributes[key];
					attributes.attributes[
						this.settings?.dueDateAttribute || "due"
					] = completion;
				}
			}
		});
		return attributes;
	}

	private convertPriorityAttributes(
		attributes: IAttributesStructure
	): IAttributesStructure {
		Object.keys(attributes.attributes).forEach((key) => {
			if (["critical", "high", "medium", "low", "lowest"].includes(key)) {
				// complete priority if it's an attribute value, like @high into @priority(high)
				delete attributes.attributes[key];
				attributes.attributes["priority"] = key;
			}
		});
		return attributes;
	}

	toggleTodo(line: string): string {
		const parsedLine = this.parseLine(line);
		if (parsedLine.checkbox) {
			parsedLine.checkbox = "";
		} else {
			parsedLine.checkbox = "[ ]";
		}
		return this.lineToString(parsedLine);
	}

	setCheckmark(line: string, checkMark: string): string {
		const parsedLine = this.parseLine(line);
		parsedLine.checkbox = `[${checkMark}]`;
		return this.lineToString(parsedLine);
	}

	private markToStatus = (mark: string) => {
		mark = mark.toLowerCase();
		return mark === "]" || mark === "-" || mark === "c"
			? TodoStatus.Canceled
			: mark === ">"
			? TodoStatus.InProgress
			: mark === "!"
			? TodoStatus.AttentionRequired
			: mark === "x"
			? TodoStatus.Complete
			: mark === " "
			? TodoStatus.Todo
			: mark === "d"
			? TodoStatus.Delegated
			: TodoStatus.Todo;
	};

	private getIndentationLevel(str: string) {
		return (
			(str.match(/ /g)?.length || 0) + (str.match(/\t/g)?.length || 0) * 4
		);
	}

	toTodo<T>(line: string, lineNumber: number): ITodoParsingResult<T> {
		const parsedLine = this.parseLine(line);
		const indentLevel = this.getIndentationLevel(parsedLine.indentation);
		if (!parsedLine.checkbox)
			return {
				lineNumber,
				isTodo: false,
				indentLevel,
			};
		const attributesMatching = this.parseAttributes(parsedLine.line);
		const todo: TodoItem<T> = {
			status: this.markToStatus(parsedLine.checkbox[1]),
			text: attributesMatching.textWithoutAttributes,
			attributes: attributesMatching.attributes,
			file: undefined,
		};
		const res: ITodoParsingResult<T> = {
			lineNumber,
			isTodo: true,
			todo,
			indentLevel: this.getIndentationLevel(parsedLine.indentation),
		};
		if (lineNumber !== undefined) {
			todo.line = lineNumber;
		}
		return res;
	}
}
