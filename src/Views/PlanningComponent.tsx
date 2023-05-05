import * as React from "react";
import { createRoot } from "react-dom/client";

import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem";
import { ILogger } from "../domain/ILogger";
import { App, TFile} from "obsidian";
import { DateTime } from "luxon";
import { TodoIndex } from "../domain/TodoIndex";
import { FileOperations } from "../domain/FileOperations";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { PlanningSettingsComponent } from "./PlanningSettingsComponent";
import { PlanningTodoColumn } from "./PlanningTodoColumn";
import { TodoListEvents } from "src/events/TodoListEvents";
import { TodoMatcher } from "src/domain/TodoMatcher";

function findTodoDate<T>(todo: TodoItem<T>, attribute: string): DateTime | null {
  if (!todo.attributes) {
    return null
  }
  const attr = todo.attributes[attribute]
  if (attr) {
    const d = DateTime.fromISO(`${todo.attributes[attribute]}`);
    return d.isValid ? d : null
  }
  return null;
}

export interface PlanningComponentDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>,
}

export interface PlanningComponentProps {
  events: TodoListEvents,
  deps: PlanningComponentDeps,
  settings: ProletarianWizardSettings,
  app: App,
}

export function PlanningComponent({events, deps, settings, app}: PlanningComponentProps) {
  const [hideEmpty, setHideEmpty ] = React.useState(true);
  const [searchParameters, setSearchParameters] = React.useState({searchPhrase: "", fuzzySearch: false});
  const [todos, setTodos] = React.useState<TodoItem<TFile>[]>(deps.todoIndex.todos);

  const filter = new TodoMatcher(searchParameters.searchPhrase, searchParameters.fuzzySearch);

  React.useEffect(() => {
    deps.todoIndex.onUpdateEvent.listen(async (todos) => {
      setTodos(todos);
    })
  }, [events])

  function getTodosByDate(from: DateTime | null, to: DateTime | null, includeSelected: boolean = false): TodoItem<TFile>[] {
    const dateIsInRange = (date: DateTime | null) => date && (from === null || date >= from) && (to === null || date < to)
    function todoInRange<T>(todo: TodoItem<T>){
      const isDone = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
      const isSelected = todo.attributes && !!todo.attributes[settings.selectedAttribute]
      const dueDate = findTodoDate(todo, settings.dueDateAttribute)
      const completedDate = findTodoDate(todo, settings.completedDateAttribute)
      const dueDateIsInRange = dateIsInRange(dueDate)
      const completedDateIsInRange = dateIsInRange(completedDate)
      const isInRangeOrSelected = dueDateIsInRange || (includeSelected && isSelected && (isDone && completedDateIsInRange || !isDone))
      if (todo.text.contains("lol")) {
        deps.logger.info(`Todo:  ${completedDateIsInRange} ${includeSelected} ${isSelected} ${isInRangeOrSelected}`)
      }
      return isInRangeOrSelected
    }
    const todosInRange = todos.filter((todo) => todo.attributes && todoInRange(todo));
    return todosInRange
  }

  function getTodosWithNoDate<T>(todos: TodoItem<T>[]): TodoItem<T>[] {
    return todos.filter(todo =>
      !findTodoDate(todo, settings.dueDateAttribute)
      && todo.attributes
      && !todo.attributes[settings.selectedAttribute]
      && todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete)
  }

  function findTodo(todoId: string): TodoItem<TFile> | undefined {
    const todo = todos.find(todo => getTodoId(todo) === todoId);
    return todo;
  }

  function moveToDate(date: DateTime) {
    return (todoId: string) => {
      const todo = findTodo(todoId);
      deps.logger.debug(`Moving ${todoId} to ${date}`);
      if (!todo) {
        deps.logger.warn(`Todo ${todoId} not found, couldn't move`);
        return;
      }
      FileOperations.updateAttributeAsync(todo, settings.dueDateAttribute, date.toISODate()).then()
    }
  }

  function removeDate() {
    return (todoId: string) => {
      const todo = findTodo(todoId);
      if (!todo) {
        return;
      }
      FileOperations.removeAttributeAsync(todo, settings.dueDateAttribute).then()
    }
  }

  function todoColumn(
      title: string,
      todos: TodoItem<TFile>[],
      hideIfEmpty = hideEmpty,
      onTodoDropped: ((todoId: string) => void) | null = null,
      isToday = false) {
    return <PlanningTodoColumn 
      hideIfEmpty={hideIfEmpty}
      title={title}
      key={title}
      onTodoDropped={onTodoDropped}
      todos={todos}
      filter={filter.matches}
      deps={{
        app, events, settings, logger: deps.logger,
      }}
      isToday={isToday}
    />;
  }

  function* getColumns() {
    const today = DateTime.now().startOf("day")
    yield todoColumn(
      "🕸️ Past",
      getTodosByDate(null, today).filter(
        todo => todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete),
      true);
      
    let bracketStart = today;
    let bracketEnd = today.plus({ day: 1 });
  
    yield todoColumn(
      "☀️ Today",
      getTodosByDate(bracketStart, bracketEnd, true),
      false,
      moveToDate(bracketStart),
      true);

    for (let i = 0; i < 6; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketEnd.plus({ day: 1 })
      if (bracketStart.weekday === 6 || bracketStart.weekday === 7) {
        continue
      }
      const label = i === 0 ? "📅 Tomorrow" : bracketStart.toFormat("📅 cccc dd/MM")
      yield todoColumn(
        label,
        getTodosByDate(bracketStart, bracketEnd),
        hideEmpty,
        moveToDate(bracketStart));
    }

    for (let i = 1; i < 5; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ weeks: 1 })
      const label = `📅 Week +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`;
      yield todoColumn(
        label,
        getTodosByDate(bracketStart, bracketEnd),
        hideEmpty,
        moveToDate(bracketStart));
    }

    for (let i = 1; i < 4; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ months: 1 })
      const label = `📅 Month +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      yield todoColumn(
        label,
        getTodosByDate(bracketStart, bracketEnd),
        hideEmpty,
        moveToDate(bracketStart));
    }

    yield todoColumn(
      "📅 Later",
      getTodosByDate(bracketStart, null),
      hideEmpty,
      moveToDate(bracketStart));

    yield todoColumn(
      "📃 Backlog",
      getTodosWithNoDate(todos),
      false,
      removeDate());
  }

  deps.logger.debug(`Rendering planning view`)

  return <>
    <div>
      {Array.from(getColumns())}
    </div>
    <PlanningSettingsComponent
      setHideEmpty={setHideEmpty}
      hideEmpty={hideEmpty}
      setSearchParameters={setSearchParameters}
      searchParameters={searchParameters}
      />
  </>;
}

export function MountPlanningComponent(onElement: HTMLElement, props: PlanningComponentProps) {
  const client = createRoot(onElement);
  client.render(<PlanningComponent {...props}></PlanningComponent>);
}