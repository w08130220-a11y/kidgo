/**
 * cx — classnames helper. 接受 string / boolean / undefined / null, 串成空格分隔.
 *
 * 用法:
 *   cx("a", "b", isActive && "active", maybe ? "x" : "y")
 */
export function cx(...args: Array<string | boolean | undefined | null>): string {
  return args.filter(Boolean).join(" ");
}
