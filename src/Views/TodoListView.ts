import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { ILogger } from "../domain/ILogger";
import { TodoListEvents } from "../events/TodoListEvents";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { MountSidePanelComponent } from "../ui/TodoSidePanelComponent";
import { TodoIndex } from "src/domain/TodoIndex";

export interface TodoListViewDeps {
  logger: ILogger
}

export class TodoListView extends ItemView {
  static viewType: string = "pw.todo-list";

  constructor(leaf: WorkspaceLeaf, private events: TodoListEvents, private deps: TodoListViewDeps, private todoIndex: TodoIndex<TFile>, private settings: ProletarianWizardSettings) {
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
    return Promise.resolve();
  }

  public render(): void {
    MountSidePanelComponent(this.containerEl as HTMLElement, {
      deps: {
        app: this.app,
        logger: this.deps.logger,
        todoIndex: this.todoIndex,
        events: this.events,
        settings: this.settings,
      },
    })
  }

}