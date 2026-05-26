import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { ILogger } from "../domain/ILogger";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { MountSidePanelComponent } from "../ui/TodoSidePanelComponent";
import { TodoIndex } from "src/domain/TodoIndex";
import { Root } from "react-dom/client";

export interface TodoListViewDeps {
  logger: ILogger
}

export class TodoListView extends ItemView {
  static viewType: string = "pw.todo-list";
  private reactRoot: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private deps: TodoListViewDeps, private todoIndex: TodoIndex<TFile>, private settings: ProletarianWizardSettings) {
    super(leaf);
  }

  getViewType(): string {
    return TodoListView.viewType;
  }

  getDisplayText(): string {
    return 'Todo';
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
    this.reactRoot = MountSidePanelComponent(this.containerEl as HTMLElement, {
      deps: {
        app: this.app,
        logger: this.deps.logger,
        todoIndex: this.todoIndex,
        settings: this.settings,
      },
    })
  }

}