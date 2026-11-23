import request from "supertest";
import { describe, expect, it } from "vitest";
import { as, expectProblem, setupTestApp, tokenFor } from "./helpers.js";

const { app } = setupTestApp();

const profile = { displayName: "Neil", city: "São Paulo", contact: "neil@example.com" };

describe("/me", () => {
  it("creates the profile with PUT and returns it with GET", async () => {
    const neil = await as(app, "user-neil");

    const put = await neil.put("/me").send(profile);
    expect(put.status).toBe(200);
    expect(put.body).toEqual({ id: "user-neil", ...profile });

    const get = await neil.get("/me");
    expect(get.status).toBe(200);
    expect(get.body).toEqual({ id: "user-neil", ...profile });
  });

  it("updates an existing profile with PUT", async () => {
    const neil = await as(app, "user-neil");
    await neil.put("/me").send(profile);

    const updated = { displayName: "Neil A.", city: "Rio de Janeiro", contact: "+55 21 99999-0000" };
    const put = await neil.put("/me").send(updated);
    expect(put.status).toBe(200);

    const get = await neil.get("/me");
    expect(get.body).toEqual({ id: "user-neil", ...updated });
  });

  it("keeps each user's profile separate", async () => {
    const neil = await as(app, "user-neil");
    const buzz = await as(app, "user-buzz");
    await neil.put("/me").send(profile);
    await buzz.put("/me").send({ displayName: "Buzz", city: "Houston", contact: "buzz@example.com" });

    const get = await neil.get("/me");
    expect(get.body).toEqual({ id: "user-neil", ...profile });
  });

  it("returns 404 problem+json when the user has no profile yet", async () => {
    const nobody = await as(app, "user-nobody");

    expectProblem(await nobody.get("/me"), 404, "profile-not-found");
  });

  describe("authentication", () => {
    const getMeWith = async (token: string) =>
      request(app).get("/me").set("Authorization", `Bearer ${token}`);

    it("rejects requests without a token", async () => {
      expectProblem(await request(app).get("/me"), 401, "unauthorized");
      expectProblem(await request(app).put("/me").send(profile), 401, "unauthorized");
    });

    it("rejects a token signed with another key", async () => {
      const token = await tokenFor({ secret: "some-other-secret-that-is-long-enough" });
      expectProblem(await getMeWith(token), 401, "unauthorized");
    });

    it("rejects a malformed token", async () => {
      expectProblem(await getMeWith("not-a-jwt"), 401, "unauthorized");
    });

    it("rejects an expired token", async () => {
      const token = await tokenFor({ expiresAt: new Date(Date.now() - 60_000) });
      expectProblem(await getMeWith(token), 401, "unauthorized");
    });

    it("rejects a token without a subject", async () => {
      const token = await tokenFor({ sub: null });
      expectProblem(await getMeWith(token), 401, "unauthorized");
    });
  });

  describe("validation", () => {
    it.each([
      ["missing fields", {}, ["displayName", "city", "contact"]],
      ["blank display name", { ...profile, displayName: "   " }, ["displayName"]],
      ["non-string city", { ...profile, city: 42 }, ["city"]],
      ["overlong contact", { ...profile, contact: "x".repeat(201) }, ["contact"]],
    ])("rejects %s with 400 problem+json", async (_case, body, fields) => {
      const neil = await as(app, "user-neil");

      const res = await neil.put("/me").send(body);

      expectProblem(res, 400, "validation");
      expect(res.body.errors.map((e: { path: string }) => e.path).sort()).toEqual([...fields].sort());
      expect((await neil.get("/me")).status).toBe(404);
    });

    it("rejects a non-JSON body with 400 problem+json", async () => {
      const neil = await as(app, "user-neil");

      const res = await neil.put("/me").set("Content-Type", "application/json").send("{not json");

      expectProblem(res, 400, "malformed-body");
    });

    it("trims surrounding whitespace from the profile fields", async () => {
      const neil = await as(app, "user-neil");

      const res = await neil
        .put("/me")
        .send({ displayName: "  Neil ", city: " São Paulo ", contact: " neil@example.com " });

      expect(res.body).toEqual({ id: "user-neil", ...profile });
    });
  });
});
