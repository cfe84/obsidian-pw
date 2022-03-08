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

  private foldState: IDictionary<boolean> = {}
  private todos: TodoItem<TFile>[] = []

  constructor(leaf: WorkspaceLeaf, private openFile: (file: TFile, line: number) => Promise<void>, private deps: TodoListViewDeps) {
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
    container.createDiv('pw-todo-panel', (el) => {
      el.createEl("b", { text: "Selected:" })
      this.renderTodos(this.getSelectedTodos(), el);
      el.createEl("b", { text: "Due:" })
      this.renderTodos(this.getDueTodos(), el);
      el.createEl("b", { text: "All:" })
      this.renderTodos(this.todos, el);
    });
  }

  private getPriorityValue(todo: TodoItem<TFile>): number {
    if (!todo.attributes || !todo.attributes["priority"]) {
      return 0
    }
    const priority = todo.attributes["priority"] as string
    const priorities: IDictionary<number> = {
      critical: 10,
      high: 9,
      medium: 5,
      low: 3,
      lowest: -1,
    }
    return priorities[priority] || 0
  };

  private sortTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
    if (!todos) {
      return todos
    }
    return todos.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b) - this.getPriorityValue(a);
      if (!priorityDiff) {
        return a.text.toLocaleLowerCase().localeCompare(b.text.toLocaleLowerCase())
      }
      return priorityDiff
    })
  }

  private getTodoId<T>(todo: TodoItem<T>) {
    return todo.file.id + "-" + todo.text
  }

  private renderTodos(todos: TodoItem<TFile>[], el: HTMLElement) {
    const foldedText = ` ▶`
    const unfoldedText = " ▼"
    el.createDiv(undefined, (el) => {
      this.sortTodos(todos).forEach(todo => {
        el.createDiv("pw-todo-container", (container) => {
          container.createEl("span", {
            text: `${this.statusToIcon(todo.status)} `,
            cls: "todo-checkbox"
          })
          const textElement = container.createEl("span", {
            text: `${this.priorityToIcon(todo.attributes)} ${todo.text}`,
            cls: "todo-text"
          })
          const subDisplay = container.createEl("span", {
            text: todo.subtasks && todo.subtasks.length ? foldedText : "  ",
            cls: "todo-sub"
          })
          const subElementsContainer = container.createEl("div", "todo-sub-container")
          textElement.onclick = () => this.openFile(todo.file.file, todo.line || 0);

          const todoId = this.getTodoId(todo)
          let subTasksUnfolded = false
          const toggleSubElement = () => {
            if (subTasksUnfolded) {
              subDisplay.innerText = foldedText
              subElementsContainer.childNodes.forEach(child => subElementsContainer.removeChild(child))
            } else {
              subDisplay.innerText = unfoldedText
              this.renderTodos(todo.subtasks, subElementsContainer);
            }
            subTasksUnfolded = !subTasksUnfolded
            // Save state
            this.foldState[todoId] = subTasksUnfolded
          }
          subDisplay.onclick = toggleSubElement
          // Restore state
          if (this.foldState[todoId]) {
            toggleSubElement()
          }
        })
      })
    })
  }
}