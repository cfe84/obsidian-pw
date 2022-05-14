import { IFile } from "src/domain/IFile";
import { App, TFile } from "obsidian";

export class ObsidianFile implements IFile<TFile> {
  name: string;
  get id(): string { return this.file.path }
  async getLastModifiedAsync(): Promise<Date> {
    const stat = await this.app.vault.adapter.stat(this.file.path)
    return new Date(stat.mtime)
  }

  constructor(private app: App, public file: TFile) {
    this.name = file.basename;
  }
  get path(): string { return this.file.path };

  private getParent(path: string): string {
    const lastSlash = path.lastIndexOf("/")
    return path.substring(0, lastSlash)
  }

  private async createHierachy(path: string, isParent = false): Promise<void> {
    const parent = this.getParent(path)
    if (!await this.app.vault.adapter.exists(parent, false)) {
      await this.createHierachy(parent, true)
    }
    if (isParent) {
      await this.app.vault.createFolder(path)
    }
  }

  async renameAsync(newPath: string): Promise<void> {
    await this.createHierachy(newPath)
    await this.app.vault.rename(this.file, newPath)
  }

  isInFolder(folder: string): boolean {
    return this.file.path.toLowerCase().startsWith(folder.toLowerCase())
  }
  async getContentAsync(): Promise<string> {
    return await this.app.vault.cachedRead(this.file);
  }
  async setContentAsync(val: string): Promise<void> {
    await this.app.vault.modify(this.file, val);
  }
}