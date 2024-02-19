import { LineOperations } from "../domain/LineOperations";
import { TodoStatus } from "../domain/TodoItem";
import { Command, Editor, Hotkey, MarkdownView } from "obsidian";

export class ToggleTodoCommand implements Command {
  constructor(private lineOperations: LineOperations) { }

  id: string = "pw.toggle-todo-command";
  name: string = "Mark todo as checked / unchecked";
  icon?: string = "check-small";
  mobileOnly?: boolean = false;
  callback?: () => any;
  checkCallback?: (checking: boolean) => boolean | void;
  editorCallback(editor: Editor, view: MarkdownView) {
    const lineNumber = editor.getCursor("from").line
    let line = editor.getLine(lineNumber)
    const todo = this.lineOperations.toTodo(line, lineNumber)
    if (todo.isTodo) {
      line = this.lineOperations.setCheckmark(line, todo.todo.status === TodoStatus.Complete ? " " : "x")
      editor.setLine(lineNumber, line)
    }
  };
  editorCheckCallback?: (checking: boolean, editor: Editor, view: MarkdownView) => boolean | void;
  hotkeys?: Hotkey[] = [
    {
      key: "x",
      modifiers: ["Alt"]
    }
  ];

}