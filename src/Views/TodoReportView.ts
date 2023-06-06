import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { ILogger } from "../domain/ILogger";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { TodoIndex } from "src/domain/TodoIndex";
import { MountTodoReportComponent, TodoReportComponentDeps } from "src/ui/TodoReportComponent";

export class TodoReportView extends ItemView {
  static viewType: string = "pw.todo-report";

  constructor(leaf: WorkspaceLeaf, private deps: TodoReportComponentDeps, private settings: ProletarianWizardSettings) {
    super(leaf);
  }

  getViewType(): string {
    return TodoReportView.viewType;
  }

  getDisplayText(): string {
    return 'Report';
  }

  getIcon(): string {
    return 'check-small';
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  public render(): void {
    MountTodoReportComponent(this.containerEl as HTMLElement, {
      deps: {
        logger: this.deps.logger,
        todoIndex: this.deps.todoIndex,
        app: this.app,
        settings: this.settings,
      },
    })
  }

}