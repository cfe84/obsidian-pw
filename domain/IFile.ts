export interface IFile<T> {
  file: T,
  name: string,
  id: string,
  getContentAsync(): Promise<string>,
  setContentAsync(val: string): Promise<void>
}