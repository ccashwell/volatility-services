export function ensure(envVar: string, defaultValue: string | undefined = undefined): string {
  const value = process.env[envVar.toUpperCase()]
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${envVar} not set.`)
  }
  const defaultString = defaultValue as string

  return value ?? defaultString
}
