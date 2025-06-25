import { IFile } from "../../src/domain/IFile";

export class MockFile implements IFile<any> {
	public file: any;
	public name: string;
	public path: string;
	public id: string;
	private content: string;
	private lastModified: Date;

	constructor(name: string, path: string, content: string = "", id?: string) {
		this.name = name;
		this.path = path;
		this.content = content;
		this.id = id || `mock-${name}-${path}`;
		this.file = { name, path }; // Mock file object
		this.lastModified = new Date();
	}

	async getLastModifiedAsync(): Promise<Date> {
		return this.lastModified;
	}

	async renameAsync(folder: string): Promise<void> {
		this.path = `${folder}/${this.name}`;
	}

	async getContentAsync(): Promise<string> {
		return this.content;
	}

	async setContentAsync(val: string): Promise<void> {
		this.content = val;
		this.lastModified = new Date();
	}

	isInFolder(folder: string): boolean {
		return this.path.startsWith(folder);
	}

	// Helper methods for testing
	setContent(content: string): void {
		this.content = content;
		this.lastModified = new Date();
	}

	setLastModified(date: Date): void {
		this.lastModified = date;
	}
}
