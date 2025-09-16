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
import { TodoMatcher } from "src/domain/TodoMatcher";
import { PlanningSettingsStore } from "./PlanningSettingsStore";
import { Sound, SoundPlayer } from "./SoundPlayer";
import { PwEvent } from "src/events/PwEvent";
import { DateTimeProgressComponent } from "./DateTimeProgressComponent";
import { TodayHoursComponent } from "./TodayHoursComponent";
import { DailyNoteService } from "../domain/DailyNoteService";
import { DateSelectionModal } from "../Views/DateSelectionModal";

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
  deps: PlanningComponentDeps,
  settings: ProletarianWizardSettings,
  app: App,
}

export function PlanningComponent({deps, settings, app}: PlanningComponentProps) {
  const savedSettings = React.useMemo(() => PlanningSettingsStore.getSettings(), []);
  const [planningSettings, setPlanningSettingsState] = React.useState(savedSettings);
  const [todos, setTodos] = React.useState<TodoItem<TFile>[]>(deps.todoIndex.todos);
  const setPlanningSettings = PlanningSettingsStore.decorateSetterWithSaveSettings(setPlanningSettingsState);
  const { searchParameters, hideEmpty, wipLimit } = planningSettings;
	const fileOperations = new FileOperations(settings);
  const dailyNoteService = React.useMemo(() => new DailyNoteService(app), [app]);
  
  // Default working hours
  const defaultStartHour = settings.defaultStartHour || "08:00";
  const defaultEndHour = settings.defaultEndHour || "17:00";
  const [startTime, setStartTime] = React.useState<string>(defaultStartHour);
  const [endTime, setEndTime] = React.useState<string>(defaultEndHour);
  
  const [currentDateTime, setCurrentDateTime] = React.useState<DateTime>(DateTime.now());
  const [currentDate, setCurrentDate] = React.useState<string>(DateTime.now().toISODate() || "");

  // Function to reset the view when day changes
  const resetViewForNewDay = React.useCallback(() => {
    setStartTime(defaultStartHour);
    setEndTime(defaultEndHour);
    
    // Force a refresh by triggering the onUpdateEvent
    deps.todoIndex.onUpdateEvent.fireAsync(deps.todoIndex.todos).then(() => {
      deps.logger.info(`Date changed to ${currentDateTime.toFormat('yyyy-MM-dd')}. Planning view reset.`);
    });
  }, [defaultStartHour, defaultEndHour, deps.todoIndex, deps.logger, currentDateTime]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = DateTime.now();
      setCurrentDateTime(now);
      
      const today = now.toISODate();
      if (today && today !== currentDate) {
        setCurrentDate(today);
        resetViewForNewDay();
      }
    }, 1000);
    
    return () => clearInterval(interval); // Clean up on unmount
  }, [currentDate, resetViewForNewDay]);

  const playSound = React.useMemo(() => new PwEvent<Sound>(), []);

  const filteredTodos = React.useMemo(() => {
    const filter = new TodoMatcher(searchParameters.searchPhrase, searchParameters.fuzzySearch);
    return todos.filter(filter.matches);
  }, [todos, searchParameters]);

  React.useEffect(() => {
    deps.todoIndex.onUpdateEvent.listen(async (todos) => {
      setTodos(todos);
    })
  }, [deps.todoIndex]);

  function getTodosByDate(from: DateTime | null, to: DateTime | null, includeSelected: boolean = false): TodoItem<TFile>[] {
    const dateIsInRange = (date: DateTime | null) => date && (from === null || date >= from) && (to === null || date < to)
    function todoInRange<T>(todo: TodoItem<T>){
      const isDone = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled;
      const isSelected = todo.attributes && !!todo.attributes[settings.selectedAttribute];
      const dueDate = findTodoDate(todo, settings.dueDateAttribute);
      const completedDate = findTodoDate(todo, settings.completedDateAttribute);
      const dueDateIsInRange = dateIsInRange(dueDate);
      const completedDateIsInRange = dateIsInRange(completedDate);
      const selectedIsInRange = isSelected && (!isDone || completedDateIsInRange); // Hide completed selected that were completed on another day
      const isInRangeOrSelected = dueDateIsInRange || (isDone && completedDateIsInRange) || (includeSelected && selectedIsInRange);
      return isInRangeOrSelected;
    }
    const todosInRange = filteredTodos.filter((todo) => todo.attributes && todoInRange(todo));
    return todosInRange
  }

  function getTodosWithNoDate<T>(): TodoItem<TFile>[] {
    return filteredTodos.filter(todo =>
      !findTodoDate(todo, settings.dueDateAttribute)
      && todo.attributes
      && !todo.attributes[settings.selectedAttribute]
      && todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete)
  }

  function findTodo(todoId: string): TodoItem<TFile> | undefined {
		return todos.find(todo => getTodoId(todo) === todoId);
  }

  function moveToDate(date: DateTime) {
    return (todoId: string) => {
      const todo = findTodo(todoId);
      deps.logger.debug(`Moving ${todoId} to ${date}`);
      if (!todo) {
        deps.logger.warn(`Todo ${todoId} not found, couldn't move`);
        return;
      }
			fileOperations.updateAttributeAsync(todo, settings.dueDateAttribute, date.toISODate()).then()
    }
  }

  function removeDate() {
    return (todoId: string) => {
      const todo = findTodo(todoId);
      if (!todo) {
        return;
      }
			fileOperations.removeAttributeAsync(todo, settings.dueDateAttribute).then()
    }
  }

  function moveToDateAndStatus(date: DateTime, status: TodoStatus) {
    return (todoId: string) => {
      const todo = findTodo(todoId);
      deps.logger.debug(`Moving ${todoId} to ${date}`);
      if (!todo) {
        deps.logger.warn(`Todo ${todoId} not found, couldn't move`);
        return;
      }
      todo.status = status;

      fileOperations.updateAttributeAsync(todo, settings.dueDateAttribute, date.toISODate())
        .then(() => fileOperations.updateTodoStatus(todo, settings.completedDateAttribute))
        .then(() => {
          if (settings.trackStartTime && !todo.attributes[settings.startedAttribute] && status === TodoStatus.InProgress) {
            return fileOperations.updateAttributeAsync(todo, settings.startedAttribute, DateTime.now().toISODate())
          }
        });
    }
  }

  function getTodosByDateAndStatus(from: DateTime, to: DateTime, status: TodoStatus[]) {
    const todos = getTodosByDate(from, to, true);
    return todos.filter(todo => status.contains(todo.status));
  }

  function todoColumn(
    icon: string,
    title: string,
    todos: TodoItem<TFile>[],
    hideIfEmpty = hideEmpty,
    onTodoDropped: ((todoId: string) => void) | null = null,
    substyle?: string,
    onTitleClick?: () => void) {
    return <PlanningTodoColumn 
      hideIfEmpty={hideIfEmpty}
      planningSettings={planningSettings}
      icon={icon}
      title={title}
      key={title}
      onTodoDropped={onTodoDropped}
      todos={todos}
      playSound={playSound}      
      deps={{
        app, settings, logger: deps.logger,
      }}
      substyle={substyle}
      onTitleClick={onTitleClick}
    />;
  }

  // Handler for single date columns
  const handleSingleDateClick = (date: DateTime) => {
    return () => {
      dailyNoteService.createOrOpenDailyNote(date);
    };
  };

  // Handler for aggregate date columns
  const handleAggregateDateClick = (startDate: DateTime, endDate: DateTime, label: string) => {
    return () => {
      const modal = new DateSelectionModal(
        app,
        startDate,
        endDate,
        (selectedDate: DateTime) => {
          dailyNoteService.createOrOpenDailyNote(selectedDate);
        }
      );
      modal.open();
    };
  };

  function getTodayWipStyle() {
    if (!wipLimit.isLimited) {
      return ""
    }
    const today = DateTime.now().startOf("day")
    const tomorrow = today.plus({ day: 1 });
    const todos = getTodosByDateAndStatus(today, tomorrow, [TodoStatus.AttentionRequired, TodoStatus.Delegated, TodoStatus.InProgress, TodoStatus.Todo]);
    if (todos.length > wipLimit.dailyLimit) {
      return "pw-planning-column-content--wip-exceeded"
    }
  }

  function* getTodayColumns() {
    const today = DateTime.now().startOf("day")
    const tomorrow = today.plus({ day: 1 });

    yield todoColumn(
      "◻️",
      "Todo",
      getTodosByDateAndStatus(today, tomorrow, [TodoStatus.Todo]),
      false,
      moveToDateAndStatus(today, TodoStatus.Todo),
      "today",
      handleSingleDateClick(today));
      
    yield todoColumn(
      "⏩",
      "In progress",
      getTodosByDateAndStatus(today, tomorrow, [TodoStatus.AttentionRequired, TodoStatus.Delegated, TodoStatus.InProgress]),
      false,
      moveToDateAndStatus(today, TodoStatus.InProgress),
      "today",
      handleSingleDateClick(today));

    yield todoColumn(
      "✅",
      "Done",
      getTodosByDateAndStatus(today, tomorrow, [TodoStatus.Canceled, TodoStatus.Complete]),
      false,
      moveToDateAndStatus(today, TodoStatus.Complete),
      "today",
      handleSingleDateClick(today));
  }

  function getWipStyle(todos: TodoItem<TFile>[]) {
    if (wipLimit.isLimited) {
      if (todos.length > wipLimit.dailyLimit) {
        return "wip-exceeded";
      }
    }
    return "";
  }

  function* getColumns() {
    yield todoColumn(
      "📃",
      "Backlog",
      getTodosWithNoDate(),
      false,
      removeDate());

    const today = DateTime.now().startOf("day")
		yield todoColumn(
      "🕸️",
      "Past",
      getTodosByDate(null, today).filter(
        todo => todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete),
      true);
      
    let bracketStart = today;
    let bracketEnd = today.plus({ day: 1 });

    for (let i = 0; i < 6; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketEnd.plus({ day: 1 })
			const firstWeekday = settings.firstWeekday ?? 1
			const localDay = ((bracketStart.weekday - firstWeekday + 7) % 7) + 1
      if (!settings.showWeekEnds && localDay >= 6) {
        continue
      }
      const label = i === 0 ? "Tomorrow" : bracketStart.toFormat("cccc dd/MM")
      const todos = getTodosByDate(bracketStart, bracketEnd);
      const style = getWipStyle(todos);
      yield todoColumn(
        "📅",
        label,
        todos,
        hideEmpty,
        moveToDate(bracketStart),
        style,
        handleSingleDateClick(bracketStart));
    }

    for (let i = 1; i < 5; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ weeks: 1 })
      const label = `Week +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`;
      const todos = getTodosByDate(bracketStart, bracketEnd)
      const style = getWipStyle(todos);
      yield todoColumn(
        "📅",
        label,
        todos,
        hideEmpty,
        moveToDate(bracketStart),
        style,
        handleAggregateDateClick(bracketStart, bracketEnd.minus({ days: 1 }), label));
    }

    for (let i = 1; i < 4; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ months: 1 })
      const label = `Month +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      const todos = getTodosByDate(bracketStart, bracketEnd);
      const style = getWipStyle(todos);
      yield todoColumn(
        "📅",
        label,
        todos,
        hideEmpty,
        moveToDate(bracketStart),
        style,
        handleAggregateDateClick(bracketStart, bracketEnd.minus({ days: 1 }), label));
    }

    yield todoColumn(
      "📅",
      "Later",
      getTodosByDate(bracketStart, null),
      hideEmpty,
      moveToDate(bracketStart),
      undefined,
      () => {
        // For "Later", show a general date picker
        const modal = new DateSelectionModal(
          app,
          bracketStart,
          bracketStart.plus({ months: 6 }), // 6 months range
          (selectedDate: DateTime) => {
            dailyNoteService.createOrOpenDailyNote(selectedDate);
          }
        );
        modal.open();
      });
  }

  deps.logger.debug(`Rendering planning view`)

  return <>
    {settings.displayTodayProgressBar !== false && (
      <DateTimeProgressComponent
        currentDateTime={currentDateTime}
        startTime={startTime}
        endTime={endTime}
      />
    )}
    <div className={`pw-planning-today ${getTodayWipStyle()}`}>
      <h1 
        className="pw-planning-today-title--clickable"
        onClick={handleSingleDateClick(DateTime.now().startOf("day"))}
      >
        <span className="pw-planning-today-icon">☀️</span> Today
      </h1>
      {Array.from(getTodayColumns())}
    </div>
    <div>
      {Array.from(getColumns())}
    </div>
    <PlanningSettingsComponent
      planningSettings={planningSettings}
      setPlanningSettings={setPlanningSettings}
    />
    {settings.displayTodayProgressBar !== false && (
      <TodayHoursComponent
        startTime={startTime}
        endTime={endTime}
        defaultStartHour={settings.defaultStartHour || "08:00"}
        defaultEndHour={settings.defaultEndHour || "17:00"}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
      />
    )}
    <SoundPlayer deps={deps} playSound={playSound}></SoundPlayer>
  </>;
}

export function MountPlanningComponent(onElement: HTMLElement, props: PlanningComponentProps) {
  const client = createRoot(onElement);
  client.render(<PlanningComponent {...props}></PlanningComponent>);
}