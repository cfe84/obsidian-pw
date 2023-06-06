import { Command, Editor, Hotkey, MarkdownView, Workspace } from "obsidian";
import { TodoReportView } from "src/Views/TodoReportView";

export class OpenReportCommand implements Command {
  constructor(private workspace: Workspace) { }
  id: string = "pw.open-report";
  name: string = "Open todo report";
  icon?: string = "check-small";
  mobileOnly?: boolean = false;
  callback() {
    this.workspace.getMostRecentLeaf().setViewState({
      type: TodoReportView.viewType
    });
  }
  checkCallback?: (checking: boolean) => boolean | void;
  editorCallback?: (editor: Editor, view: MarkdownView) => any;
  editorCheckCallback?: (checking: boolean, editor: Editor, view: MarkdownView) => boolean | void;
  hotkeys?: Hotkey[];

}
