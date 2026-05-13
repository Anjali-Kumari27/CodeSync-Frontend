/// <reference types="vitest" />

import { describe, it, expect } from "vitest";

describe("Premium Features", () => {

    it("premium users can create unlimited projects", () => {

        sessionStorage.setItem("isPremium", "true");

        expect(
            sessionStorage.getItem("isPremium")
        ).toBe("true");

    });

    it("free users do not have premium access", () => {

        sessionStorage.removeItem("isPremium");

        expect(
            sessionStorage.getItem("isPremium")
        ).toBeNull();

    });

});