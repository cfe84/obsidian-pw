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
		private reuse: boolean,
		private splitDirection?: SplitDirection
	) {}
	// id: string = "pw.open-planning";
	// name: string = "Open planning";

	icon?: string = "check-small";
	mobileOnly?: boolean = false;
	callback() {
		if (this.reuse) {
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
		const leaf = this.splitDirection
			? this.workspace.createLeafBySplit(currentLeaf, this.splitDirection)
			: this.workspace.createLeafInParent(parent, -1);
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
