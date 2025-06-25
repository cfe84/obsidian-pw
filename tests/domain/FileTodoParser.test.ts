import { FileTodoParser } from "../../src/domain/FileTodoParser";
import {
	ProletarianWizardSettings,
	DEFAULT_SETTINGS,
} from "../../src/domain/ProletarianWizardSettings";
import { TodoStatus } from "../../src/domain/TodoItem";
import { MockFile } from "../mocks/MockFile";

describe("FileTodoParser", () => {
	let fileTodoParser: FileTodoParser<MockFile>;
	let mockSettings: ProletarianWizardSettings;

	beforeEach(() => {
		mockSettings = {
			...DEFAULT_SETTINGS,
			dueDateAttribute: "due",
			completedDateAttribute: "completed",
			selectedAttribute: "selected",
		};

		fileTodoParser = new FileTodoParser<MockFile>(mockSettings);
	});

	describe("parseMdFileAsync", () => {
		it("should parse simple todos from file content", async () => {
			const fileContent = `# My Notes

Some text here.

- [ ] First todo
- [x] Second todo that's completed
- Normal list item
- [ ] Third todo @due(2023-12-25)

More text.`;

			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(3);

			// First todo
			expect(todos[0].text).toBe("First todo");
			expect(todos[0].status).toBe(TodoStatus.Todo);
			expect(todos[0].line).toBe(4);
			expect(todos[0].file).toBe(mockFile);

			// Second todo
			expect(todos[1].text).toBe("Second todo that's completed");
			expect(todos[1].status).toBe(TodoStatus.Complete);
			expect(todos[1].line).toBe(5);

			// Third todo with attributes
			expect(todos[2].text).toBe("Third todo");
			expect(todos[2].status).toBe(TodoStatus.Todo);
			expect(todos[2].line).toBe(7);
			expect(todos[2].attributes).toEqual({ due: "2023-12-25" });
		});

		it("should handle nested todos (subtasks)", async () => {
			const fileContent = `- [ ] Main task
  - [ ] Subtask 1
  - [x] Subtask 2
    - [ ] Sub-subtask
- [ ] Another main task`;

			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(2); // Only main tasks are returned, subtasks are nested

			// First main task
			expect(todos[0].text).toBe("Main task");
			expect(todos[0].subtasks).toHaveLength(2);

			// First subtask
			expect(todos[0].subtasks![0].text).toBe("Subtask 1");
			expect(todos[0].subtasks![0].status).toBe(TodoStatus.Todo);

			// Second subtask
			expect(todos[0].subtasks![1].text).toBe("Subtask 2");
			expect(todos[0].subtasks![1].status).toBe(TodoStatus.Complete);
			expect(todos[0].subtasks![1].subtasks).toHaveLength(1);

			// Sub-subtask
			expect(todos[0].subtasks![1].subtasks![0].text).toBe("Sub-subtask");

			// Second main task
			expect(todos[1].text).toBe("Another main task");
			expect(todos[1].subtasks).toBeUndefined();
		});

		it("should handle mixed indentation levels", async () => {
			const fileContent = `- [ ] Task 1
    - [ ] Deep subtask
- [ ] Task 2
  - [ ] Normal subtask`;

			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(2);
			expect(todos[0].subtasks).toHaveLength(1);
			expect(todos[1].subtasks).toHaveLength(1);
		});

		it("should handle empty files", async () => {
			const mockFile = new MockFile("empty.md", "/path/to/empty.md", "");
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(0);
		});

		it("should handle files with no todos", async () => {
			const fileContent = `# Regular Notes

Just some regular text here.
- Regular list item
- Another regular item

No todos in this file.`;

			const mockFile = new MockFile(
				"no-todos.md",
				"/path/to/no-todos.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(0);
		});

		it("should handle different todo statuses", async () => {
			const fileContent = `- [ ] Todo
- [x] Complete
- [-] Canceled
- [>] In Progress
- [!] Attention Required
- [d] Delegated`;

			const mockFile = new MockFile(
				"statuses.md",
				"/path/to/statuses.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(6);
			expect(todos[0].status).toBe(TodoStatus.Todo);
			expect(todos[1].status).toBe(TodoStatus.Complete);
			expect(todos[2].status).toBe(TodoStatus.Canceled);
			expect(todos[3].status).toBe(TodoStatus.InProgress);
			expect(todos[4].status).toBe(TodoStatus.AttentionRequired);
			expect(todos[5].status).toBe(TodoStatus.Delegated);
		});

		it("should parse todos with various attributes", async () => {
			const fileContent = `- [ ] Simple todo
- [ ] Todo with due date @due(2023-12-25)
- [ ] Todo with multiple attributes @due(2023-12-25) @priority(high) @selected
- [ ] Todo with boolean attributes @selected @important`;

			const mockFile = new MockFile(
				"attributes.md",
				"/path/to/attributes.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(4);

			expect(todos[0].attributes).toEqual({});

			expect(todos[1].attributes).toEqual({
				due: "2023-12-25",
			});

			expect(todos[2].attributes).toEqual({
				due: "2023-12-25",
				priority: "high",
				selected: true,
			});

			expect(todos[3].attributes).toEqual({
				selected: true,
				important: true,
			});
		});

		it("should handle dataview syntax when enabled", async () => {
			const dataviewSettings = {
				...mockSettings,
				useDataviewSyntax: true,
			};

			const dataviewParser = new FileTodoParser<MockFile>(
				dataviewSettings
			);

			const fileContent = `- [ ] Todo with dataview [due:: 2023-12-25]
- [ ] Multiple dataview [due:: 2023-12-25] [priority:: high]`;

			const mockFile = new MockFile(
				"dataview.md",
				"/path/to/dataview.md",
				fileContent
			);
			const todos = await dataviewParser.parseMdFileAsync(mockFile);

			expect(todos).toHaveLength(2);

			expect(todos[0].attributes).toEqual({
				due: "2023-12-25",
			});

			expect(todos[1].attributes).toEqual({
				due: "2023-12-25",
				priority: "high",
			});
		});
	});

	describe("error handling", () => {
		it("should handle file read errors gracefully", async () => {
			const mockFile = new MockFile("error.md", "/path/to/error.md");

			// Mock file to throw error when reading content
			jest.spyOn(mockFile, "getContentAsync").mockRejectedValue(
				new Error("File read error")
			);

			await expect(
				fileTodoParser.parseMdFileAsync(mockFile)
			).rejects.toThrow("File read error");
		});

		it("should handle malformed todo lines gracefully", async () => {
			const fileContent = `- [ ] Normal todo
- [invalid checkbox format
- [] Empty checkbox
- [ ] Normal todo again`;

			const mockFile = new MockFile(
				"malformed.md",
				"/path/to/malformed.md",
				fileContent
			);
			const todos = await fileTodoParser.parseMdFileAsync(mockFile);

			// Should parse valid todos including the empty checkbox one
			expect(todos).toHaveLength(3);
			expect(todos[0].text).toBe("Normal todo");
			expect(todos[1].text).toBe("Empty checkbox"); // [] is treated as a valid empty checkbox
			expect(todos[2].text).toBe("Normal todo again");
		});
	});
});
