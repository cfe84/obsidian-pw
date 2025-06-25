import {
	LineOperations,
	ILineStructure,
	ITodoParsingResult,
} from "../../src/domain/LineOperations";
import { ProletarianWizardSettings } from "../../src/domain/ProletarianWizardSettings";
import { TodoStatus } from "../../src/domain/TodoItem";
import { MockFile } from "../mocks/MockFile";

describe("LineOperations", () => {
	let lineOperations: LineOperations;
	let mockSettings: Partial<ProletarianWizardSettings>;

	beforeEach(() => {
		mockSettings = {
			dueDateAttribute: "due",
			completedDateAttribute: "completed",
			selectedAttribute: "selected",
			defaultStartHour: "08:00",
			defaultEndHour: "17:00",
			useDataviewSyntax: false,
		};

		lineOperations = new LineOperations(
			mockSettings as ProletarianWizardSettings
		);
	});

	describe("parseLine", () => {
		it("should parse a simple line without todo markers", () => {
			const line = "This is a simple line";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "",
				checkbox: "",
				date: "",
				line: "This is a simple line",
			});
		});

		it("should parse an indented line", () => {
			const line = "  This is an indented line";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "  ",
				listMarker: "",
				checkbox: "",
				date: "",
				line: "This is an indented line",
			});
		});

		it("should parse a line with bullet list marker", () => {
			const line = "- This is a bullet point";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "-",
				checkbox: "",
				date: "",
				line: "This is a bullet point",
			});
		});

		it("should parse a line with numbered list marker", () => {
			const line = "1. This is a numbered list item";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "1.",
				checkbox: "",
				date: "",
				line: "This is a numbered list item",
			});
		});

		it("should parse a line with unchecked checkbox", () => {
			const line = "- [ ] This is an unchecked todo";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "-",
				checkbox: "[ ]",
				date: "",
				line: "This is an unchecked todo",
			});
		});

		it("should parse a line with checked checkbox", () => {
			const line = "- [x] This is a checked todo";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "-",
				checkbox: "[x]",
				date: "",
				line: "This is a checked todo",
			});
		});

		it("should parse a line with date prefix", () => {
			const line = "- [ ] 2023-12-25: Christmas todo";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "-",
				checkbox: "[ ]",
				date: "2023-12-25",
				line: "Christmas todo",
			});
		});

		it("should parse a line with short date format", () => {
			const line = "- [ ] 12-25: Christmas todo";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "",
				listMarker: "-",
				checkbox: "[ ]",
				date: "12-25",
				line: "Christmas todo",
			});
		});

		it("should parse a complex indented todo with all elements", () => {
			const line = "    * [x] 2023-12-25: Complete holiday shopping";
			const result: ILineStructure = lineOperations.parseLine(line);

			expect(result).toEqual({
				indentation: "    ",
				listMarker: "*",
				checkbox: "[x]",
				date: "2023-12-25",
				line: "Complete holiday shopping",
			});
		});
	});

	describe("lineToString", () => {
		it("should reconstruct a simple line", () => {
			const lineStructure: ILineStructure = {
				indentation: "",
				listMarker: "",
				checkbox: "",
				date: "",
				line: "Simple line",
			};
			const result = lineOperations.lineToString(lineStructure);
			expect(result).toBe("Simple line");
		});

		it("should reconstruct a todo line", () => {
			const lineStructure: ILineStructure = {
				indentation: "  ",
				listMarker: "-",
				checkbox: "[ ]",
				date: "2023-12-25",
				line: "Todo item",
			};
			const result = lineOperations.lineToString(lineStructure);
			expect(result).toBe("  - [ ] 2023-12-25: Todo item");
		});
	});

	describe("parseAttributes", () => {
		it("should parse text without attributes", () => {
			const text = "Simple todo text";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Simple todo text",
				attributes: {},
			});
		});

		it("should parse single attribute with classic syntax", () => {
			const text = "Todo text @due(2023-12-25)";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Todo text",
				attributes: {
					due: "2023-12-25",
				},
			});
		});

		it("should parse multiple attributes with classic syntax", () => {
			const text = "Todo text @due(2023-12-25) @priority(high) @selected";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Todo text",
				attributes: {
					due: "2023-12-25",
					priority: "high",
					selected: true,
				},
			});
		});

		it("should parse boolean attributes with classic syntax", () => {
			const text = "Todo text @selected @important";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Todo text",
				attributes: {
					selected: true,
					important: true,
				},
			});
		});
	});

	describe("parseAttributes with dataview syntax", () => {
		beforeEach(() => {
			mockSettings.useDataviewSyntax = true;
			lineOperations = new LineOperations(
				mockSettings as ProletarianWizardSettings
			);
		});

		it("should parse attributes with dataview syntax", () => {
			const text = "Todo text [due:: 2023-12-25]";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Todo text",
				attributes: {
					due: "2023-12-25",
				},
			});
		});

		it("should parse multiple dataview attributes", () => {
			const text = "Todo text [due:: 2023-12-25] [priority:: high]";
			const result = lineOperations.parseAttributes(text);

			expect(result).toEqual({
				textWithoutAttributes: "Todo text",
				attributes: {
					due: "2023-12-25",
					priority: "high",
				},
			});
		});
	});

	describe("toTodo", () => {
		it("should convert a todo line to TodoItem", () => {
			const line = "- [ ] Simple todo @due(2023-12-25)";
			const result: ITodoParsingResult<any> = lineOperations.toTodo(
				line,
				0
			);

			expect(result.isTodo).toBe(true);
			expect(result.lineNumber).toBe(0);
			expect(result.todo).toBeDefined();
			expect(result.todo!.text).toBe("Simple todo");
			expect(result.todo!.status).toBe(TodoStatus.Todo);
			expect(result.todo!.attributes).toEqual({
				due: "2023-12-25",
			});
		});

		it("should process wikilink dates", () => {
			const line = "- [ ] Simple todo [[2023-12-25]]";
			const result: ITodoParsingResult<any> = lineOperations.toTodo(
				line,
				0
			);

			expect(result.isTodo).toBe(true);
			expect(result.todo).toBeDefined();
			expect(result.todo!.attributes).toEqual({
				due: "2023-12-25",
			});
			expect(result.todo!.text).toBe("Simple todo");
		});

		it("should ignore wikilink date when the due date is otherwise specified", () => {
			const line = "- [ ] Simple todo [[2023-12-25]] @due(2023-12-31)";
			const result: ITodoParsingResult<any> = lineOperations.toTodo(
				line,
				0
			);

			expect(result.isTodo).toBe(true);
			expect(result.todo).toBeDefined();
			expect(result.todo!.attributes).toEqual({
				due: "2023-12-31",
			});
			expect(result.todo!.text).toBe("Simple todo [[2023-12-25]]");
		});

		it("should not convert non-todo lines", () => {
			const line = "This is just regular text";
			const result: ITodoParsingResult<any> = lineOperations.toTodo(
				line,
				0
			);

			expect(result.isTodo).toBe(false);
			expect(result.todo).toBeUndefined();
		});

		it("should handle indented todos", () => {
			const line = "    - [ ] Indented todo";
			const result: ITodoParsingResult<any> = lineOperations.toTodo(
				line,
				0
			);

			expect(result.isTodo).toBe(true);
			expect(result.indentLevel).toBe(4);
			expect(result.todo!.text).toBe("Indented todo");
		});

		it("should handle different todo statuses", () => {
			const testCases = [
				{ line: "- [ ] Todo", status: TodoStatus.Todo },
				{ line: "- [x] Complete", status: TodoStatus.Complete },
				{ line: "- [-] Canceled", status: TodoStatus.Canceled },
				{ line: "- [>] In Progress", status: TodoStatus.InProgress },
				{
					line: "- [!] Attention Required",
					status: TodoStatus.AttentionRequired,
				},
				{ line: "- [d] Delegated", status: TodoStatus.Delegated },
			];

			testCases.forEach(({ line, status }) => {
				const result = lineOperations.toTodo(line, 0);
				expect(result.todo!.status).toBe(status);
			});
		});
	});

	describe("toggleTodo", () => {
		it("should add checkbox to non-todo line", () => {
			const line = "- Regular list item";
			const result = lineOperations.toggleTodo(line);
			expect(result).toBe("- [ ] Regular list item");
		});

		it("should remove checkbox from todo line", () => {
			const line = "- [ ] Todo item";
			const result = lineOperations.toggleTodo(line);
			expect(result).toBe("- Todo item");
		});
	});

	describe("setCheckmark", () => {
		it("should set checkmark to specified value", () => {
			const line = "- [ ] Todo item";
			const result = lineOperations.setCheckmark(line, "x");
			expect(result).toBe("- [x] Todo item");
		});

		it("should change existing checkmark", () => {
			const line = "- [x] Todo item";
			const result = lineOperations.setCheckmark(line, "-");
			expect(result).toBe("- [-] Todo item");
		});
	});
});
