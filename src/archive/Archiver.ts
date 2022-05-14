import { IFile } from "../domain/IFile";

export class Archiver {
  constructor() {

  }

  private static join(...pathElements: string[]) {
    pathElements = pathElements.map(((p, i) => {
      if (i !== 0 && p.startsWith("/")) {
        p = p.substring(1)
      }
      if (i !== pathElements.length - 1 && p.endsWith("/")) {
        p = p.substring(0, p.length - 2)
      }
      return p
    }))
    return pathElements.join("/")
  }

  static getArchiveFrom<T>(archiveFrom: string[], file: IFile<T>) {
    return archiveFrom.find(from => file.path !== from && file.path.startsWith(from))
  }

  static async archiveAsync<T>(archiveFrom: string, archiveTo: string, file: IFile<T>) {
    const relativePath = file.path.replace(archiveFrom, "")
    const year = (await file.getLastModifiedAsync()).getFullYear()
    const dest = Archiver.join(archiveTo, year.toString(), relativePath)
    await file.renameAsync(dest)
  }
}