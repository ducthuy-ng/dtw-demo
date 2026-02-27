export function join(...args: string[]) {
  return args.filter(Boolean).join(" ");
}
