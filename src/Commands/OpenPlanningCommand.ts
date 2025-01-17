import {
	Command,
	Editor,
	Hotkey,
	MarkdownView,
	SplitDirection,
	Workspace,
	WorkspaceLeaf,
} from "obsidian";
import { PlanningView } from "src/Views/PlanningView";

export class OpenPlanningCommand implements Command {
	constructor(
		private workspace: Workspace,
		public id: string,
		public name: string,
		private where: "reuse" | "current" | "new" | "split" = "new",
		private splitDirection?: SplitDirection
	) {}

	icon?: string = "check-small";
	mobileOnly?: boolean = false;
	callback() {
		if (this.where === "reuse") {
			const existingLeaves = this.workspace.getLeavesOfType(
				PlanningView.viewType
			);
			if (existingLeaves.length > 0) {
				this.workspace.setActiveLeaf(existingLeaves[0]);
				return;
			}
		}
		const currentLeaf = this.workspace.getMostRecentLeaf();
		const parent = currentLeaf.parent;
		const leaf =
			this.splitDirection && this.where === "split" // If split, we split
				? this.workspace.createLeafBySplit(
						currentLeaf,
						this.splitDirection
				  )
				: this.where === "current"
				? currentLeaf // If "current" we use the current leaf
				: this.workspace.createLeafInParent(parent, -1); // Else we create a new leaf
		leaf.setViewState({
			type: PlanningView.viewType,
		});
		this.workspace.setActiveLeaf(leaf);
	}
	checkCallback?: (checking: boolean) => boolean | void;
	editorCallback?: (editor: Editor, view: MarkdownView) => any;
	editorCheckCallback?: (
		checking: boolean,
		editor: Editor,
		view: MarkdownView
	) => boolean | void;
	hotkeys?: Hotkey[];
}
