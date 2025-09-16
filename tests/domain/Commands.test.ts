import { ToggleTodoCommand } from "../../src/Commands/ToggleTodoCommand";
import { ToggleOngoingTodoCommand } from "../../src/Commands/ToggleOngoingTodoCommand";
import { LineOperations } from "../../src/domain/LineOperations";
import { ProletarianWizardSettings, DEFAULT_SETTINGS } from "../../src/domain/ProletarianWizardSettings";
import { TodoStatus } from "../../src/domain/TodoItem";
import { FileOperations } from "../../src/domain/FileOperations";
import { ObsidianFile } from "../../src/infrastructure/ObsidianFile";
import { App, Editor, MarkdownView, TFile } from "obsidian";
import { DateTime } from "luxon";

// Mock dependencies
jest.mock("../../src/domain/FileOperations");
jest.mock("../../src/infrastructure/ObsidianFile");
jest.mock("luxon");

// Mock Editor and MarkdownView
const mockEditor = {
	getCursor: jest.fn(),
	getLine: jest.fn(),
	setLine: jest.fn(),
} as unknown as Editor;

const mockFile = {
	path: "/test/file.md",
	basename: "file.md",
} as TFile;

const mockView = {
	file: mockFile,
} as MarkdownView;

const mockApp = {
	vault: {
		adapter: {
			stat: jest.fn(),
		},
	},
} as unknown as App;

const MockFileOperations = FileOperations as jest.MockedClass<typeof FileOperations>;
const MockObsidianFile = ObsidianFile as jest.MockedClass<typeof ObsidianFile>;

describe("Commands", () => {
	let lineOperations: LineOperations;
	let settings: ProletarianWizardSettings;
	let mockFileOperations: jest.Mocked<FileOperations>;
	let mockObsidianFile: jest.Mocked<ObsidianFile>;

	beforeEach(() => {
		jest.clearAllMocks();
		
		settings = {
			...DEFAULT_SETTINGS,
			trackStartTime: true,
			startedAttribute: "started",
			completedDateAttribute: "completed",
		};
		
		lineOperations = new LineOperations(settings);
		
		// Setup FileOperations mock
		mockFileOperations = {
			updateAttributeAsync: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<FileOperations>;
		MockFileOperations.mockImplementation(() => mockFileOperations);
		
		// Setup ObsidianFile mock
		mockObsidianFile = {
			path: "/test/file.md",
			name: "file.md",
			id: "/test/file.md",
		} as unknown as jest.Mocked<ObsidianFile>;
		MockObsidianFile.mockImplementation(() => mockObsidianFile);
		
		// Setup DateTime mock
		const mockDateTime = {
			toISODate: jest.fn().mockReturnValue("2024-01-15"),
		};
		(DateTime.now as jest.Mock) = jest.fn().mockReturnValue(mockDateTime);
	});

	describe("ToggleTodoCommand", () => {
		let command: ToggleTodoCommand;

		beforeEach(() => {
			command = new ToggleTodoCommand(lineOperations, settings, mockApp);
		});

		it("should have correct command properties", () => {
			expect(command.id).toBe("pw.toggle-todo-command");
			expect(command.name).toBe("Mark todo as checked / unchecked");
			expect(command.icon).toBe("check-small");
		});

		it("should toggle unchecked todo to checked and set completed attribute", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo @due(2024-01-01)";
			const expectedLine = "- [x] Test todo @due(2024-01-01)";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			
			// Verify FileOperations was called to set completed attribute
			expect(MockFileOperations).toHaveBeenCalledWith(settings);
			expect(mockFileOperations.updateAttributeAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					status: TodoStatus.Todo,
					text: "Test todo",
					attributes: { due: "2024-01-01" },
					file: mockObsidianFile,
					line: lineNumber,
				}),
				"completed",
				"2024-01-15"
			);
		});

		it("should toggle checked todo to unchecked and remove completed attribute", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [x] Completed todo @completed(2024-01-10)";
			const expectedLine = "- [ ] Completed todo @completed(2024-01-10)";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			
			// Verify FileOperations was called to remove completed attribute
			expect(mockFileOperations.updateAttributeAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					status: TodoStatus.Complete,
					text: "Completed todo",
					file: mockObsidianFile,
					line: lineNumber,
				}),
				"completed",
				undefined
			);
		});

		it("should not update attributes when file is not available", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";
			const mockViewWithoutFile = {} as MarkdownView;

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockViewWithoutFile);

			// Verify only checkbox was updated, no file operations
			expect(mockEditor.setLine).toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});

		it("should not update attributes when settings are not available", () => {
			// Setup
			const commandWithoutSettings = new ToggleTodoCommand(lineOperations);
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			commandWithoutSettings.editorCallback(mockEditor, mockView);

			// Verify only checkbox was updated, no file operations
			expect(mockEditor.setLine).toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});

		it("should handle non-todo lines gracefully", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "This is not a todo line";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify no changes were made
			expect(mockEditor.setLine).not.toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});
	});

	describe("ToggleOngoingTodoCommand", () => {
		let command: ToggleOngoingTodoCommand;

		beforeEach(() => {
			command = new ToggleOngoingTodoCommand(lineOperations, settings, mockApp);
		});

		it("should have correct command properties", () => {
			expect(command.id).toBe("pw.toggle-ongoing-todo-command");
			expect(command.name).toBe("Mark todo as ongoing / unchecked");
			expect(command.icon).toBe("check-small");
		});

		it("should toggle unchecked todo to in-progress and set started attribute", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo @priority(high)";
			const expectedLine = "- [>] Test todo @priority(high)";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			
			// Verify FileOperations was called to set started attribute
			expect(MockFileOperations).toHaveBeenCalledWith(settings);
			expect(mockFileOperations.updateAttributeAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					status: TodoStatus.Todo,
					text: "Test todo",
					attributes: { priority: "high" },
					file: mockObsidianFile,
					line: lineNumber,
				}),
				"started",
				"2024-01-15"
			);
		});

		it("should toggle in-progress todo to unchecked", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [>] In progress todo @started(2024-01-10)";
			const expectedLine = "- [ ] In progress todo @started(2024-01-10)";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			
			// Verify no file operations were called (since we're not setting started when going back to todo)
			expect(mockFileOperations.updateAttributeAsync).not.toHaveBeenCalled();
		});

		it("should not set started attribute when trackStartTime is disabled", () => {
			// Setup
			const settingsWithoutTracking = { ...settings, trackStartTime: false };
			const commandWithoutTracking = new ToggleOngoingTodoCommand(lineOperations, settingsWithoutTracking, mockApp);
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";
			const expectedLine = "- [>] Test todo";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			commandWithoutTracking.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated but no file operations
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			expect(mockFileOperations.updateAttributeAsync).not.toHaveBeenCalled();
		});

		it("should not set started attribute when it already exists", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo @started(2024-01-05)";
			const expectedLine = "- [>] Test todo @started(2024-01-05)";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was updated but started attribute was not set again
			expect(mockEditor.setLine).toHaveBeenCalledWith(lineNumber, expectedLine);
			expect(mockFileOperations.updateAttributeAsync).not.toHaveBeenCalled();
		});

		it("should not update attributes when file is not available", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";
			const mockViewWithoutFile = {} as MarkdownView;

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockViewWithoutFile);

			// Verify only checkbox was updated, no file operations
			expect(mockEditor.setLine).toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});

		it("should not update attributes when settings are not available", () => {
			// Setup
			const commandWithoutSettings = new ToggleOngoingTodoCommand(lineOperations);
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			commandWithoutSettings.editorCallback(mockEditor, mockView);

			// Verify only checkbox was updated, no file operations
			expect(mockEditor.setLine).toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});

		it("should handle non-todo lines gracefully", () => {
			// Setup
			const lineNumber = 0;
			const originalLine = "This is not a todo line";

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify no changes were made
			expect(mockEditor.setLine).not.toHaveBeenCalled();
			expect(MockFileOperations).not.toHaveBeenCalled();
		});
	});

	describe("Error handling", () => {
		it("should handle FileOperations errors gracefully in ToggleTodoCommand", () => {
			// Setup
			const command = new ToggleTodoCommand(lineOperations, settings, mockApp);
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);
			mockFileOperations.updateAttributeAsync.mockRejectedValue(new Error("File operation failed"));

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was still updated despite error
			expect(mockEditor.setLine).toHaveBeenCalled();
			
			// Wait for async operation to complete
			return new Promise(resolve => {
				setTimeout(() => {
					expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
					consoleSpy.mockRestore();
					resolve(undefined);
				}, 0);
			});
		});

		it("should handle FileOperations errors gracefully in ToggleOngoingTodoCommand", () => {
			// Setup
			const command = new ToggleOngoingTodoCommand(lineOperations, settings, mockApp);
			const lineNumber = 0;
			const originalLine = "- [ ] Test todo";
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			mockEditor.getCursor = jest.fn().mockReturnValue({ line: lineNumber });
			mockEditor.getLine = jest.fn().mockReturnValue(originalLine);
			mockFileOperations.updateAttributeAsync.mockRejectedValue(new Error("File operation failed"));

			// Execute
			command.editorCallback(mockEditor, mockView);

			// Verify checkbox was still updated despite error
			expect(mockEditor.setLine).toHaveBeenCalled();
			
			// Wait for async operation to complete
			return new Promise(resolve => {
				setTimeout(() => {
					expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
					consoleSpy.mockRestore();
					resolve(undefined);
				}, 0);
			});
		});
	});
});
