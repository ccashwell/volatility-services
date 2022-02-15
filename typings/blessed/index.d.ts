declare module "blessed" {
  interface Program {
    input: any
    output: any
  }
  interface Screen {
    program: Program
    render()

    key(exitKeys: string[], cb: (ch: string, key: string) => void)

    on(event: string, cb: () => void)
  }
  declare function screen(): Screen

  interface ChartOptions {
    title: string
    style: {
      line: string
    }
    x: string[]
    y: number[]
  }
  type ChartData = ChartOptions
}
