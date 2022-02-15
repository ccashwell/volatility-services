declare namespace jest {
  // noinspection JSUnusedGlobalSymbols
  interface Matchers<R> {
    /**
     * Use `.toBeISODate` when checking if an iso date can be created from a string
     * @param {string} x
     */
    toBeISODate(): R
  }

  // noinspection JSUnusedGlobalSymbols
  interface Expect {
    toBeISODate(): any
  }
}

export {}
