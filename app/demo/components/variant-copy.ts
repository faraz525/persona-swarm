export type DemoVariant = "control" | "a" | "b";

export function toDemoVariant(value: string | undefined): DemoVariant {
  if (value === "a" || value === "b") return value;
  return "control";
}
