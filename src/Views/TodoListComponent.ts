import { IDictionary } from "../domain/IDictionary";
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoFilter, TodoListEvents } from "../events/TodoListEvents";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";

export class TodoListComponent {
  private todoComponents: TodoItemComponent[] = []
  constructor(private events: TodoListEvents, private todos: TodoItem<TFile>[], private app: App, private settings: ProletarianWizardSettings) {

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

  private getStatusValue(todo: TodoItem<TFile>): number {
    switch (todo.status) {
      case TodoStatus.Canceled:
        return 0
      case TodoStatus.Complete:
        return 1
      default:
        return 10
    }
  }

  private sortTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
    if (!todos) {
      return []
    }
    return todos.sort((a, b) => {
      const statusDiff = this.getStatusValue(b) - this.getStatusValue(a);
      if (statusDiff) {
        return statusDiff
      }
      const priorityDiff = this.getPriorityValue(b) - this.getPriorityValue(a);
      if (!priorityDiff) {
        return a.text.toLocaleLowerCase().localeCompare(b.text.toLocaleLowerCase())
      }
      return priorityDiff
    })
  }

  public render(el: HTMLElement) {
    el.createDiv(undefined, (el) => {
      const todos = this.sortTodos(this.todos)
      this.todoComponents = todos.map(todo => new TodoItemComponent(this.events, todo, this.app, this.settings))
      this.todoComponents.forEach(component => component.render(el))
    })
  }
}