import { describe, it, expect } from "vitest";
import { PetState } from "../src/model/PetState";

describe("smoke", () => {
  it("core compila y testea", () => {
    const s: PetState = { species: "FLAN_BEBE" };
    expect(s.species).toBe("FLAN_BEBE");
  });
});
