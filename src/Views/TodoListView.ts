import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { ILogger } from "../domain/ILogger";
import { TodoListEvents } from "../events/TodoListEvents";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";

export interface TodoListViewDeps {
  logger: ILogger
}

export class TodoListView extends ItemView {
  static viewType: string = "pw.todo-list";

  private todos: TodoItem<TFile>[] = []

  constructor(leaf: WorkspaceLeaf, private events: TodoListEvents, private deps: TodoListViewDeps, private settings: ProletarianWizardSettings) {
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

  onTodosChanged(todos: TodoItem<TFile>[]) {
    this.deps.logger.debug(`Todos updated`);
    this.todos = todos.filter(todo =>
      todo.status !== TodoStatus.Complete
      && todo.status !== TodoStatus.Canceled);
    this.render()
  }

  public render(): void {
    const container = this.containerEl.children[1];
    // MountListComponent(container as HTMLElement, {
    //   app: this.app,
    //   events: this.events,
    //   settings: this.settings,
    //   todos: this.todos,
    // })
  }

}