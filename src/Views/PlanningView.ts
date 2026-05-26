import { ILogger } from "../domain/ILogger";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { TodoIndex } from "../domain/TodoIndex";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { MountPlanningComponent } from "../ui/PlanningComponent";
import { Root } from "react-dom/client";

export interface PlanningViewDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>,
}

export class PlanningView extends ItemView {
  private contentView: HTMLDivElement
  private reactRoot: Root | null = null
  getIcon(): string {
    return "calendar-glyph"
  }

  constructor(private deps: PlanningViewDeps, private settings: ProletarianWizardSettings, leaf: WorkspaceLeaf) {
    super(leaf)
    this.contentView = this.containerEl.getElementsByClassName("view-content")[0] as HTMLDivElement
  }

  static viewType: string = "pw.planning";
  getViewType() { return PlanningView.viewType }
  getDisplayText() { return "Todo planning" }

  render() {
    this.deps.logger.info(`Rendering planning view`)
    this.reactRoot?.unmount()
    this.reactRoot = MountPlanningComponent(this.contentView, {
      deps: this.deps,
      settings: this.settings,
      app: this.app,
    })
  }

  async onClose(): Promise<void> {
    this.reactRoot?.unmount()
    this.reactRoot = null
  }
}