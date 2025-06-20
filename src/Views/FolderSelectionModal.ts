import { App, Modal } from "obsidian";

export class FolderSelectionModal extends Modal {
	private ignoredFolders: string[];
	private onSelect: (folder: string) => void;
	private folders: string[];

	constructor(
		app: App,
		ignoredFolders: string[],
		onSelect: (folder: string) => void
	) {
		super(app);
		this.ignoredFolders = ignoredFolders;
		this.onSelect = onSelect;
		this.folders = this.getAllFolders();
	}

	// Get all folders in the vault
	private getAllFolders(): string[] {
		const folders = new Set<string>();
		// Add root folder
		folders.add("/");

		// Process all files to extract their folder paths
		this.app.vault.getFiles().forEach((file) => {
			const path = file.path;
			const lastSlashIndex = path.lastIndexOf("/");

			if (lastSlashIndex > 0) {
				const folderPath = path.substring(0, lastSlashIndex);
				folders.add(folderPath);

				// Also add all parent folders
				let parent = folderPath;
				while (parent.includes("/")) {
					parent = parent.substring(0, parent.lastIndexOf("/"));
					if (parent) {
						folders.add(parent);
					}
				}
			}
		});

		// Convert to array and sort
		return Array.from(folders).sort();
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Select a folder to ignore" });

		// Create folder list
		const folderList = contentEl.createEl("div");
		folderList.addClass("pw-folder-selection-list");

		// Add search box
		const searchContainer = contentEl.createEl("div");
		searchContainer.addClass("pw-folder-search-container");

		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search folders...",
		});
		searchInput.addClass("pw-folder-search-input");

		// Filter folders as user types
		searchInput.addEventListener("input", () => {
			const searchTerm = searchInput.value.toLowerCase();
			this.renderFolderList(folderList, searchTerm);
		});

		// Render initial folder list
		this.renderFolderList(folderList, "");

		// Focus on search input
		setTimeout(() => {
			searchInput.focus();
		}, 10);
	}

	renderFolderList(containerEl: HTMLElement, searchTerm: string) {
		containerEl.empty();

		// Filter folders based on search term
		const filteredFolders = this.folders.filter((folder) =>
			folder.toLowerCase().includes(searchTerm)
		);

		if (filteredFolders.length === 0) {
			containerEl.createEl("div", { text: "No matching folders found." });
			return;
		}

		const list = containerEl.createEl("ul");
		list.addClass("pw-folder-list");

		for (const folder of filteredFolders) {
			// Skip folders that are already ignored
			if (this.ignoredFolders.contains(folder)) {
				continue;
			}

			const item = list.createEl("li");
			item.addClass("pw-folder-list-item");

			const folderButton = item.createEl("button");
			folderButton.setText(folder || "/");
			folderButton.addClass("pw-folder-select-button");

			folderButton.addEventListener("click", () => {
				this.onSelect(folder);
				this.close();
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
