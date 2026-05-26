import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { ILogger } from "../domain/ILogger";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { MountTodoReportComponent, TodoReportComponentDeps } from "src/ui/TodoReportComponent";
import { Root } from "react-dom/client";

export class TodoReportView extends ItemView {
  static viewType: string = "pw.todo-report";
  private reactRoot: Root | null = null;

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
    this.reactRoot?.unmount();
    this.reactRoot = null;
    return Promise.resolve();
  }

  public render(): void {
    this.reactRoot?.unmount();
    this.reactRoot = MountTodoReportComponent(this.containerEl as HTMLElement, {
      deps: {
        logger: this.deps.logger,
        todoIndex: this.deps.todoIndex,
        app: this.app,
        settings: this.settings,
      },
    })
  }

}