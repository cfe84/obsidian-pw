import * as React from "react";

import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem"
import { MarkdownView, Menu, TFile } from "obsidian"
import { IDictionary } from "../domain/IDictionary"
import { TodoSubtasksContainer } from "./TodoSubtasksContainer";
import { TodoStatusComponent } from "./TodoStatusComponent"
import { Consts } from "../domain/Consts"
import { FileOperations } from "../domain/FileOperations"
import { StandardDependencies } from "./StandardDependencies";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";
import { Random } from "src/Random";

function priorityToIcon(
  attributes: IDictionary<string | boolean> | undefined
) {
  const attributeIsPriority = (attributeName: string) =>
    attributeName === "priority" || attributeName === "importance";
  return attributes
    ? (Object.keys(attributes)
      .filter(attributeIsPriority)
      .map((priority) => attributes[priority])
      .map((attributeValue) => {
        switch (attributeValue) {
          case "critical":
          case "highest":
            return "⚡"
          case "high":
            return "❗"
          case "medium":
            return "🔸"
          case "low":
            return "🔽"
          case "lowest":
            return "⏬"
          default:
            return ""
        }
      })[0] as string) || ""
    : "";
}

interface Color { backgroundColor: string; color: string; borderColor: string }

const colorsByTag: Record<string, Color> = {}

function getRandomPastelAndAccent(seed: string): Color {
  const random = new Random(seed);
  // Helper to clamp values between 0 and 255
  const clamp = (value: number) => Math.max(0, Math.min(255, value));

  // Generate high R/G/B values for pastel colors
  const r = random.nextInt(127, 254); // 127–254
  const g = random.nextInt(127, 254);
  const b = random.nextInt(127, 254);

  // Convert to hex
  const backgroundColor = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Generate accent color by darkening the RGB values
  const darkenFactor = 0.4; // Lower means darker
  const accentR = clamp(Math.floor(r * darkenFactor));
  const accentG = clamp(Math.floor(g * darkenFactor));
  const accentB = clamp(Math.floor(b * darkenFactor));

  const color = `#${accentR.toString(16).padStart(2, "0")}${accentG
    .toString(16)
    .padStart(2, "0")}${accentB.toString(16).padStart(2, "0")}`;

  return { backgroundColor, color, borderColor: color };
}

function getColorForTag(tag: string): Color {
  if (colorsByTag[tag]) {
    return colorsByTag[tag];
  }
  const color = getRandomPastelAndAccent(tag);
  colorsByTag[tag] = color;
  return color;
}

function formatDuration(startTimeAsStr: string) {
  const startTime = new Date(startTimeAsStr);
  if (startTime.toString() === "Invalid Date") {
    return "";
  }
  const duration = new Date().getTime() - startTime.getTime();
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  return days > 0 ? `(started ${days}d ago)` : "";
}

export interface TodoItemDisplayPreferences {
  showTags: boolean,
  showStartTime: boolean,
}

export interface TodoItemComponentProps {
  todo: TodoItem<TFile>,
  // filter?: TodoFilter<TFile>,
  playSound?: PwEvent<Sound>,
  dontCrossCompleted?: boolean,
  deps: StandardDependencies,
  displayPreferences: TodoItemDisplayPreferences,
}

export function TodoItemComponent({todo, deps, playSound, dontCrossCompleted, displayPreferences}: TodoItemComponentProps) {
  const app = deps.app;
  const settings = deps.settings;
	const fileOperations = new FileOperations(settings);
  const { showTags, showStartTime } = displayPreferences;

  async function openFileAsync(file: TFile, line: number, inOtherLeaf: boolean) {
    let leaf = app.workspace.getLeaf();
    if (inOtherLeaf) {
      leaf = app.workspace.getLeaf(true);
    } else if (leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf(false);
    }
    await leaf.openFile(file)
    let view = app.workspace.getActiveViewOfType(MarkdownView)
    const lineContent = await view.editor.getLine(line)
    view.editor.setSelection({ ch: 0, line }, { ch: lineContent.length, line })
  }

  function onClickContainer(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (ev.defaultPrevented) {
        return
      }
      openFileAsync(
        todo.file.file,
        todo.line || 0,
        ev.altKey || ev.ctrlKey || ev.metaKey,
      );
  }

  const addChangePriorityMenuItem = (menu: Menu, name: string, icon: string, otherIcon: string) => {
    if (name === todo.attributes["priority"]) {
      return
    }
    menu.addItem((item) => {
      item.setTitle(`${otherIcon} Change priority to ${name}`)
      item.setIcon(icon)
      item.onClick((evt) => {
				fileOperations.updateAttributeAsync(todo, "priority", name).then()
      })
    })
  }

  function onAuxClickContainer(evt: any){
    if (evt.defaultPrevented) {
      return
    }
    const menu = new Menu();
    menu.setNoIcon()
    addChangePriorityMenuItem(menu, "critical", "double-up-arrow-glyph", "⚡")
    addChangePriorityMenuItem(menu, "high", "up-chevron-glyph", "❗")
    addChangePriorityMenuItem(menu, "medium", "right-arrow", "🔸")
    addChangePriorityMenuItem(menu, "low", "down-chevron-glyph", "🔽")
    addChangePriorityMenuItem(menu, "lowest", "double-down-arrow-glyph", "⏬")
    menu.addItem((item) => {
      item.setTitle("🔁 Reset priority")
      item.setIcon("reset")
      item.onClick((evt) => fileOperations.removeAttributeAsync(todo, "priority").then())
    })
    menu.addSeparator()
    menu.addItem((item) => {
      item.setTitle("📌 Toggle selected")
      item.setIcon("pin")
      item.onClick((evt) => {
				fileOperations.updateAttributeAsync(todo, settings.selectedAttribute, !todo.attributes[settings.selectedAttribute])
      })
    })
    menu.showAtMouseEvent(evt)
  }

  function onDragStart(ev: any) {
    const id = getTodoId(todo)
    ev.dataTransfer.setData(Consts.TodoItemDragType, id)
  }

  const isSelectedText = !!todo.attributes[settings.selectedAttribute] ? " 📌" : "";
  const priorityIcon = priorityToIcon(todo.attributes);
  const completionClassName = (!dontCrossCompleted && (todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled))  ? "pw-todo-text-complete" : "";

  const renderUrl = (todoText: string):(string|React.ReactElement)[] => {
    const res: (string|React.ReactElement)[] = [];
    const sizeLimit = 24;
    do {
      const match = /(.+)(((https?:\/\/)([^\s]+))(.*))/.exec(todoText);
      if (!match) {
        res.splice(0, 0, todoText);
        break;
      }
      const [_, before, urlAndRest, url, protocol, link, rest] = match;
      res.splice(0, 0, rest);
      res.splice(0, 0, <a onClick={ev => ev.defaultPrevented = true} href={url} target="_blank" key={url}>🔗 {link.length > sizeLimit ? link.substring(0, sizeLimit - 3) + "...": link}</a>);
      todoText = before;
    } while (todoText && todoText.length > 0);
    return res;
  };

  const openTag = (tag: string) => {
    const searchView = this.app.workspace.getLeavesOfType("search")[0]
      ?.view as any;

    if (searchView && searchView.setQuery) {
      searchView.setQuery(`tag:${tag}`);
    } else {
      console.warn("Search view not available or does not support setQuery");
    }
  }

  const renderTags = (todoText: string): {todoText: string, tags: React.ReactElement[]} => {
    const res = [];
    let remainingText = "";
    do {
      const match = /(.*)(#[\w\d_-]+)(.*)/.exec(todoText);
      if (!match) {
        remainingText = todoText + remainingText;
        break;
      }
      const [_, before, tag, rest] = match;
      remainingText = rest + remainingText;
      todoText = before;
      const color = getColorForTag(tag);
      res.push(<span className="pw-tag-pill" style={color} onClick={ev => {ev.defaultPrevented = true; openTag(tag); }} key={_}>{tag}</span>);    
    } while (todoText && todoText.length > 0);
    return {todoText: remainingText, tags: showTags ? res : []};
  }

  const {todoText, tags} = renderTags(todo.text);

  return <>
    <div className="pw-todo-container" draggable="true" onDragStart={onDragStart} onClick={onClickContainer} onAuxClick={onAuxClickContainer}>
      <TodoStatusComponent todo={todo} deps={ { logger: deps.logger, app: app }} settings={settings} playSound={playSound} />
      <div className={`pw-todo-text ${completionClassName}`}>
        {`${priorityIcon} `}{...renderUrl(todoText)}{...tags}{`${isSelectedText}`}
        { showStartTime && deps.settings.trackStartTime && deps.settings.startedAttribute in todo.attributes ? <span className="pw-todo-duration">&nbsp;{formatDuration(todo.attributes[deps.settings.startedAttribute] as string)}</span> : null }
      </div>
      <TodoSubtasksContainer subtasks={todo.subtasks} deps={deps} key={"Subtasks-" + todo.text} dontCrossCompleted={true} displayPreferences={displayPreferences}></TodoSubtasksContainer>
    </div>
  </>;
    
}