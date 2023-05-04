import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ILogger } from "../domain/ILogger";
import { App, ItemView, Menu, TFile, View, WorkspaceLeaf } from "obsidian";
import { DateTime } from "luxon";
import { TodoIndex } from "../domain/TodoIndex";
import { FileOperations } from "../domain/FileOperations";
import { DragEventParameters, TodoListEvents } from "../events/TodoListEvents";
import { PwEvent } from "../events/PwEvent";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { MountPlanningComponent } from "./PlanningComponent";

export interface PlanningViewDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>,
}

export class PlanningView extends ItemView {
  private contentView: HTMLDivElement
  private events: TodoListEvents
  getIcon(): string {
    return "calendar-glyph"
  }

  constructor(private deps: PlanningViewDeps, private settings: ProletarianWizardSettings, events: TodoListEvents, leaf: WorkspaceLeaf) {
    super(leaf)
    this.onDragHandler = this.onDragHandler.bind(this)
    this.contentView = this.containerEl.getElementsByClassName("view-content")[0] as HTMLDivElement
    this.events = {
      openFile: events.openFile,
      onDrag: new PwEvent(this.onDragHandler)
    }
  }

  private async onDragHandler(dragParameters: DragEventParameters) {
    const { id, todo } = dragParameters
  }

  static viewType: string = "pw.planning";
  getViewType() { return PlanningView.viewType }
  getDisplayText() { return "Todo planning" }

  render() {
    this.deps.logger.info(`Rendering planning view`)
    MountPlanningComponent(this.contentView, {
      deps: this.deps,
      events: this.events,
      settings: this.settings,
      app: this.app,
    })
  }
}