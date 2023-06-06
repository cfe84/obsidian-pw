import * as React from "react";
import { createRoot } from "react-dom/client";

import { App, TFile } from "obsidian";
import { ILogger } from "src/domain/ILogger";
import { TodoIndex } from "src/domain/TodoIndex";
import { PlanningComponentDeps } from "./PlanningComponent";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";
import { TodoItem, TodoStatus } from "src/domain/TodoItem";
import { DateTime } from "luxon";
import { TodoListComponent } from "./TodoListComponent";

export interface TodoReportComponentDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>,
  settings: ProletarianWizardSettings, 
  app: App,
}

export interface TodoReportComponentProps {
  deps: TodoReportComponentDeps,
}

interface Container {
  title: string,
  todos: TodoItem<TFile>[],
}

interface DateContainer extends Container {
  from: DateTime,
  to: DateTime,
}

function moveToPreviousDay(date: DateTime): DateTime {
  return date.plus({ days: -1 });
} 

function moveToPreviousMonday(date: DateTime) {
  do {
    date = moveToPreviousDay(date);
  } while (date.weekday !== 1)
  return date;
}

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

function findTodoCompletionDate(todo: TodoItem<TFile>, settings: ProletarianWizardSettings) {
  let d = findTodoDate(todo, settings.completedDateAttribute);
  if (d) {
    return d;
  }
  d = findTodoDate(todo, settings.dueDateAttribute);
  if (d) {
    return d;
  }
  return null;
}

function formatInterval(from: DateTime, to: DateTime) {
  const format = from.year === DateTime.now().year ? "LLL dd" : "yyyy LLL dd";
  return `${from.toFormat(format)} to ${to.plus({days: -1}).toFormat(format)}`;
}

function getOneWeekFrom(startDate: DateTime): DateContainer {
  let to = startDate;
  let from = moveToPreviousMonday(startDate);
  return {
    from,
    to,
    title: formatInterval(from, to),
    todos: [],
  }
}

function moveToPreviousMonth(date: DateTime) {
  do {
    date = moveToPreviousDay(date);
  } while (date.day > 1)
  return date;
}

function getOneMonthFrom(startDate: DateTime): DateContainer {
  let to = startDate;
  let from = moveToPreviousMonth(startDate);
  return {
    from,
    to,
    title: formatInterval(from, to),
    todos: [],
  }
}

function getDateContainers(minDate: DateTime, numberOfWeeks: number, numberOfMonths: number): DateContainer[] {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let dateCursor = DateTime.fromJSDate(tomorrow);
  let containers = [];
  for (let i = 0; i < numberOfWeeks && dateCursor.diff(minDate).milliseconds > 0; i++) {
    const week = getOneWeekFrom(dateCursor);
    containers.push(week);
    dateCursor = week.from;
  }
  for (let i = 0; i < numberOfMonths && dateCursor.diff(minDate).milliseconds > 0; i++) {
    const month = getOneMonthFrom(dateCursor);
    containers.push(month);
    dateCursor = month.from;
  }
  return containers;
}

function filterTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
  return todos.filter(todo => todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled);
}

function groupTodos(todos: TodoItem<TFile>[], containers: DateContainer[], settings: ProletarianWizardSettings): Container[] {
  containers.forEach(container => {
    container.todos = todos.filter(todo => {
      const date = findTodoCompletionDate(todo, settings);
      if (!date) {
        return false;
      }
      return container.from.diff(date).toMillis() <= 0 && 
        container.to.diff(date).toMillis() > 0
    });
  });
  const emptyContainer: Container = {
    title: "No date",
    todos: todos.filter(todo => !findTodoCompletionDate(todo, settings)),
  };
  (containers as Container[]).push(emptyContainer);
  return containers
}

function getMinDate(todos: TodoItem<TFile>[], settings: ProletarianWizardSettings): DateTime | null {
  return todos.reduce((min, thisTodo) => {
    const completionDate = findTodoCompletionDate(thisTodo, settings);
    if (completionDate) {
      return min.diff(completionDate).milliseconds ? completionDate : min;
    }
    return min;
  }, DateTime.now());
}

function assembleTodosByDate(todos: TodoItem<TFile>[],
    numberOfWeeks: number, 
    numberOfMonths: number, 
    settings: ProletarianWizardSettings): DateContainer[] {
  todos = filterTodos(todos);
  const minDate = getMinDate(todos, settings);
  const containers = getDateContainers(minDate, numberOfWeeks, numberOfMonths);
  groupTodos(todos, containers, settings);
  return containers;
}

function mapContainerToComponent(container: Container, deps: TodoReportComponentDeps) {
  // const [folded, setFolded] = React.useState(false);
  const folded = false;
  return <div key={container.title} className="pw-report-container">
    <h2>{container.title} <span onClick={() => {}}>{folded ? "▶" : "▼"}</span></h2>
    {!folded
    ? <TodoListComponent deps={deps} todos={container.todos} dontCrossCompleted={true} key={container.title}></TodoListComponent>
    : ""}
  </div>;
}

export function TodoReportComponent({deps}: TodoReportComponentProps) {
  const [todos, setTodos] = React.useState(deps.todoIndex.todos);
  const [numberOfWeeks, setNumberOfWeeks] = React.useState(4);
  const [numberOfMonths, setNumberOfMonths] = React.useState(5);
  React.useEffect(() => {
    deps.todoIndex.onUpdateEvent.listen(async(todos) => setTodos(todos));
  }, [deps.todoIndex]);
  const containers = React.useMemo(() => assembleTodosByDate(todos, numberOfWeeks, numberOfMonths, deps.settings), [
    todos, numberOfWeeks, numberOfMonths
  ]);

  return <div className="pw-report">
    <div>
      <h1><span className="pw-planning-today-icon">✅</span> Completed todos</h1>
    </div>
    <div>
      {containers.map(container => mapContainerToComponent(container, deps))}
    </div>
  </div>;
}

export function MountTodoReportComponent(onElement: HTMLElement, props: TodoReportComponentProps) {
  const client = createRoot(onElement);
  client.render(<TodoReportComponent {...props}></TodoReportComponent>);
}