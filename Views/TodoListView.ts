import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { IDictionary } from "../domain/IDictionary";
import { DateTime } from "luxon";
import { ILogger } from "ILogger";

export interface TodoListViewDeps {
  logger: ILogger
}

export class TodoListView extends ItemView {
  static viewType: string = "pw.todo-list";
  private todos: TodoItem<TFile>[] = []
  constructor(leaf: WorkspaceLeaf, private openFile: (file: TFile) => void, private deps: TodoListViewDeps) {
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
    this.todos = todos.filter(todo => todo.status !== TodoStatus.Complete && todo.status !== TodoStatus.Canceled);
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

  private statusToIcon = (status: TodoStatus): string => {
    switch (status) {
      case TodoStatus.Complete:
        return "✔";
      case TodoStatus.AttentionRequired:
        return "❗";
      case TodoStatus.Canceled:
        return "❌";
      case TodoStatus.Delegated:
        return "👬";
      case TodoStatus.InProgress:
        return "‍⏩";
      case TodoStatus.Todo:
        return "⬜";
      default:
        return "";
    }
  };

  private priorityToIcon(
    attributes: IDictionary<string | boolean> | undefined
  ) {
    const attributeIsPriority = (attributeName: string) =>
      attributeName === "priority" || attributeName === "importance";
    return attributes
      ? (Object.keys(attributes)
        .filter(attributeIsPriority)
        .map((priority) => attributes[priority])
        .map((attributeValue) =>
          attributeValue === "critical"
            ? "❗❗"
            : attributeValue === "high"
              ? "❗"
              : attributeValue === "medium"
                ? "🔸"
                : attributeValue === "low"
                  ? "🔽"
                  : attributeValue === "lowest"
                    ? "⏬"
                    : ""
        )[0] as string) || ""
      : "";
  }

  public render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.createDiv('pw-container', (el) => {
      el.createEl("b", { text: "Selected:" })
      this.renderTodos(this.getSelectedTodos(), el);
      el.createEl("b", { text: "Due:" })
      this.renderTodos(this.getDueTodos(), el);
      el.createEl("b", { text: "All:" })
      this.renderTodos(this.todos, el);
    });
  }

  private renderTodos(todos: TodoItem<TFile>[], el: HTMLElement) {
    el.createDiv(undefined, (el) => {
      todos.forEach(todo => {
        const todoElement = el.createEl("div", {
          text: `${this.statusToIcon(todo.status)} ${this.priorityToIcon(todo.attributes)} ${todo.text}`
        })
        todoElement.onclick = () => this.openFile(todo.file.file);
      })
    })
  }
}