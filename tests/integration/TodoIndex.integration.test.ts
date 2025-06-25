import {
	TodoIndex,
	TodoIndexDeps,
	TodoIndexSettings,
} from "../../src/domain/TodoIndex";
import {
	ProletarianWizardSettings,
	DEFAULT_SETTINGS,
} from "../../src/domain/ProletarianWizardSettings";
import { FileTodoParser } from "../../src/domain/FileTodoParser";
import { FolderTodoParser } from "../../src/domain/FolderTodoParser";
import {
	ConsoleLogger,
	LogLevel,
} from "../../src/infrastructure/ConsoleLogger";
import { MockFile } from "../mocks/MockFile";
import { TodoStatus } from "../../src/domain/TodoItem";

describe("TodoIndex (integration)", () => {
	let todoIndex: TodoIndex<MockFile>;
	let mockSettings: ProletarianWizardSettings;
	let mockDeps: TodoIndexDeps<MockFile>;
	let mockIndexSettings: TodoIndexSettings;

	beforeEach(() => {
		mockSettings = {
			...DEFAULT_SETTINGS,
			dueDateAttribute: "due",
			completedDateAttribute: "completed",
			selectedAttribute: "selected",
		};

		const fileTodoParser = new FileTodoParser<MockFile>(mockSettings);
		const logger = new ConsoleLogger(LogLevel.ERROR); // Use ERROR to suppress debug logs in tests
		const folderTodoParser = new FolderTodoParser<MockFile>({
			fileTodoParser,
			logger,
		});

		mockDeps = {
			fileTodoParser,
			folderTodoParser,
			logger,
		};

		mockIndexSettings = {
			ignoreArchivedTodos: false,
			ignoredFolders: [],
		};

		todoIndex = new TodoIndex<MockFile>(mockDeps, mockIndexSettings);
	});

	describe("fileCreated", () => {
		it("should add todos from a file when file is created", async () => {
			const fileContent = `# Test File
- [ ] Todo 1 @due(2023-12-25)
- [x] Todo 2 @completed(2023-12-20)
- [ ] Todo 3 @selected`;

			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				fileContent
			);

			// Mock the update event listener
			const updateSpy = jest.fn();
			todoIndex.onUpdateEvent.listen(updateSpy);

			// Simulate file creation
			todoIndex.fileCreated(mockFile);

			// Wait for async operations to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify todos were added
			expect(todoIndex.todos).toHaveLength(3);

			// Verify update event was fired
			expect(updateSpy).toHaveBeenCalledWith(todoIndex.todos);

			// Verify todo properties
			expect(todoIndex.todos[0].text).toBe("Todo 1");
			expect(todoIndex.todos[0].status).toBe(TodoStatus.Todo);
			expect(todoIndex.todos[0].attributes?.due).toBe("2023-12-25");

			expect(todoIndex.todos[1].text).toBe("Todo 2");
			expect(todoIndex.todos[1].status).toBe(TodoStatus.Complete);
			expect(todoIndex.todos[1].attributes?.completed).toBe("2023-12-20");

			expect(todoIndex.todos[2].text).toBe("Todo 3");
			expect(todoIndex.todos[2].attributes?.selected).toBe(true);
		});

		it("should handle empty files gracefully", async () => {
			const mockFile = new MockFile("empty.md", "/path/to/empty.md", "");

			// Mock the update event listener
			const updateSpy = jest.fn();
			todoIndex.onUpdateEvent.listen(updateSpy);

			todoIndex.fileCreated(mockFile);

			// Wait for async operations to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Empty file should result in no todos
			expect(todoIndex.todos).toHaveLength(0);

			// Update event should still be fired
			expect(updateSpy).toHaveBeenCalledWith([]);
		});
	});

	describe("filesLoaded", () => {
		it("should load todos from multiple files", async () => {
			const files = [
				new MockFile(
					"project-a.md",
					"/projects/project-a.md",
					`
- [ ] Implement feature A @due(2023-12-25) @priority(high)
- [x] Fix bug in A @completed(2023-12-20)
- [ ] Test feature A @selected
        `
				),
				new MockFile(
					"project-b.md",
					"/projects/project-b.md",
					`
- [ ] Review project B @due(2023-12-30)
- [ ] Document project B
        `
				),
			];

			const updateSpy = jest.fn();
			todoIndex.onUpdateEvent.listen(updateSpy);

			todoIndex.filesLoaded(files);

			// Wait for async operations to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(todoIndex.todos.length).toBeGreaterThan(0);
			expect(updateSpy).toHaveBeenCalled();
		});
	});

	describe("filtering and search", () => {
		beforeEach(async () => {
			// Add some test todos using fileCreated
			const files = [
				new MockFile(
					"project-a.md",
					"/projects/project-a.md",
					`
- [ ] Implement feature A @due(2023-12-25) @priority(high)
- [x] Fix bug in A @completed(2023-12-20)
- [ ] Test feature A @selected
        `
				),
				new MockFile(
					"project-b.md",
					"/projects/project-b.md",
					`
- [ ] Review project B @due(2023-12-30)
- [ ] Document project B
        `
				),
			];

			for (const file of files) {
				todoIndex.fileCreated(file);
			}

			// Wait for async operations to complete
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		it("should filter todos by status", () => {
			const completedTodos = todoIndex.todos.filter(
				(todo) => todo.status === TodoStatus.Complete
			);
			const pendingTodos = todoIndex.todos.filter(
				(todo) => todo.status === TodoStatus.Todo
			);

			expect(completedTodos.length).toBeGreaterThan(0);
			expect(pendingTodos.length).toBeGreaterThan(0);
		});

		it("should filter todos by attributes", () => {
			const dueTodos = todoIndex.todos.filter(
				(todo) => todo.attributes?.due
			);
			const selectedTodos = todoIndex.todos.filter(
				(todo) => todo.attributes?.selected
			);

			expect(dueTodos.length).toBeGreaterThan(0);
			expect(selectedTodos.length).toBeGreaterThan(0);
		});

		it("should find todos by text content", () => {
			const featureTodos = todoIndex.todos.filter((todo) =>
				todo.text.toLowerCase().includes("feature")
			);

			expect(featureTodos.length).toBeGreaterThan(0);
		});
	});

	describe("todo management", () => {
		it("should handle file updates", async () => {
			const initialContent = `- [ ] Test todo`;
			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				initialContent
			);

			// Create the file first
			todoIndex.fileCreated(mockFile);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(todoIndex.todos).toHaveLength(1);
			expect(todoIndex.todos[0].status).toBe(TodoStatus.Todo);

			// Update the file content
			const updatedContent = `- [x] Test todo`;
			mockFile.setContent(updatedContent);

			// Trigger file update
			todoIndex.fileUpdated(mockFile);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// The todo should be updated
			expect(todoIndex.todos).toHaveLength(1);
			expect(todoIndex.todos[0].status).toBe(TodoStatus.Complete);
		});

		it("should handle file deletion", async () => {
			const fileContent = `- [ ] Test todo`;
			const mockFile = new MockFile(
				"test.md",
				"/path/to/test.md",
				fileContent
			);

			// Create the file first
			todoIndex.fileCreated(mockFile);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(todoIndex.todos).toHaveLength(1);

			// Delete the file
			todoIndex.fileDeleted(mockFile);

			// The todo should be removed
			expect(todoIndex.todos).toHaveLength(0);
		});
	});
});
