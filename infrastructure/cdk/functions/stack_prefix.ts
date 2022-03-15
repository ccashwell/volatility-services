export const stackPrefix = (namespace: string, environment: string, stage: string) => {
  return (componentName: string) => `${namespace}-${environment}-${stage}-${componentName}`
}
