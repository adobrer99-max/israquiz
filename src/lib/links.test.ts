import { describe, expect, it } from "vitest";
import { parseLink } from "./links";

describe("links into the compass", () => {
  it("opens a party, a statement or a glossary term", () => {
    expect(parseLink("?party=lik")).toEqual({ kind: "party", code: "LIK" });
    expect(parseLink("?item=a3")).toEqual({ kind: "item", id: "A3" });
    expect(parseLink("?term=Knesset")).toEqual({ kind: "glossary", focus: "knesset" });
  });
  it("still opens the coalition builder", () => {
    expect(parseLink("?coalition=LIK,SHS")).toEqual({ kind: "coalition", parties: ["LIK", "SHS"] });
  });
  it("ignores anything that does not exist", () => {
    expect(parseLink("?party=NOPE")).toBeNull();
    expect(parseLink("?item=Z9")).toBeNull();
    expect(parseLink("?term=nonsense")).toBeNull();
    expect(parseLink("")).toBeNull();
  });
  it("a party link wins over a coalition link", () => {
    expect(parseLink("?coalition=LIK&party=SHS")).toEqual({ kind: "party", code: "SHS" });
  });
});
