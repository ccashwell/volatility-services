/* eslint-disable max-classes-per-file */
export interface ReadStream<T> {
  messages(): AsyncIterableIterator<T>
}

export abstract class BaseStream<T> implements ReadStream<T> {
  public messages(): AsyncIterableIterator<T> {
    throw new Error("Method not implemented.")
  }
}
