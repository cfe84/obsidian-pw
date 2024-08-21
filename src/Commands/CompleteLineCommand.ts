import { LineOperations } from "../domain/LineOperations";
import { Command, Editor, Hotkey, MarkdownView } from "obsidian";

export class CompleteLineCommand implements Command {
  constructor(private lineOperations: LineOperations) { }

  id: string = "pw.complete-line";
  name: string = "Complete line attributes";
  icon?: string = "check-small";
  mobileOnly?: boolean = false;
  callback?: () => any;
  checkCallback?: (checking: boolean) => boolean | void;
  editorCallback(editor: Editor, view: MarkdownView) {
    const lineNumber = editor.getCursor("from").line;
    let line = editor.getLine(lineNumber);
    line = this.lineOperations.convertAttributes(line);
    editor.setLine(lineNumber, line);
  };
  editorCheckCallback?: (checking: boolean, editor: Editor, view: MarkdownView) => boolean | void;
  hotkeys?: Hotkey[] = [
    {
      key: ".",
      modifiers: ["Alt"]
    }
  ];

}