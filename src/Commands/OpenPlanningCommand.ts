import { Command, Editor, Hotkey, MarkdownView, Workspace } from "obsidian";
import { PlanningView } from "src/Views/PlanningView";

export class OpenPlanningCommand implements Command {
  constructor(private workspace: Workspace) { }
  id: string = "pw.open-planning";
  name: string = "Open planning";
  icon?: string = "check-small";
  mobileOnly?: boolean = false;
  callback() {
    this.workspace.getMostRecentLeaf().setViewState({
      type: PlanningView.viewType
    });
  }
  checkCallback?: (checking: boolean) => boolean | void;
  editorCallback?: (editor: Editor, view: MarkdownView) => any;
  editorCheckCallback?: (checking: boolean, editor: Editor, view: MarkdownView) => boolean | void;
  hotkeys?: Hotkey[];

}
