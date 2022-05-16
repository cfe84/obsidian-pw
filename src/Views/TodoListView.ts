import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { IDictionary } from "../domain/IDictionary";
import { DateTime } from "luxon";
import { ILogger } from "src/domain/ILogger";
import { TodoListComponent } from "./TodoListComponent";
import { TodoItemComponent } from "./TodoItemComponent";
import { PwEvent } from "src/events/PwEvent";
import { TodoListEvents } from "src/events/TodoListEvents";

export interface TodoListViewDeps {
  logger: ILogger
}

export class TodoListView extends ItemView {
  static viewType: string = "pw.todo-list";

  private todos: TodoItem<TFile>[] = []

  constructor(leaf: WorkspaceLeaf, private events: TodoListEvents, private deps: TodoListViewDeps) {
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

  private getSelectedTodos(): TodoItem<TFile>[] {
    return this.todos.filter(todo => !!todo.attributes["selected"])
  }

  private getDueTodos(): TodoItem<TFile>[] {
    const dueDateAttributes = ["due", "duedate", "when", "expire", "expires"];
    const now = DateTime.now();
    const todosWithOverdueDate = this.todos.filter(
      (todo) =>
        todo.attributes &&
        dueDateAttributes.find((attribute) => {
          if (
            todo.status === TodoStatus.Complete ||
            todo.status === TodoStatus.Canceled ||
            !todo.attributes ||
            !todo.attributes[attribute]
          )
            return false;
          try {
            const date = DateTime.fromISO(`${todo.attributes[attribute]}`);
            return date < now;
          } catch (err) {
            this.deps.logger.error(`Error while parsing date: ${err}`);
            return false;
          }
        })
    );
    return todosWithOverdueDate
  }

  public render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.createDiv('pw-todo-panel', (el) => {
      el.createEl("b", { text: "Selected:" })
      new TodoListComponent(this.events, this.getSelectedTodos(), this.app).render(el)
      el.createEl("b", { text: "Due:" })
      new TodoListComponent(this.events, this.getDueTodos(), this.app).render(el)
      el.createEl("b", { text: "All:" })
      new TodoListComponent(this.events, this.todos, this.app).render(el)
    });
  }

}