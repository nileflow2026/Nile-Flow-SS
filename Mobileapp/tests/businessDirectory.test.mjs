import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const businessDirectorySource = await readFile(
  new URL("../utils/businessDirectory.js", import.meta.url),
  "utf8",
);
const businessDirectoryModule = await import(
  `data:text/javascript;base64,${Buffer.from(businessDirectorySource).toString("base64")}`
);
const {
  getBusinessDescriptionPreview,
  getBusinessDirectoryPages,
  normalizeBusiness,
} = businessDirectoryModule;

test("uses an empty page list before directory data loads", () => {
  assert.deepEqual(getBusinessDirectoryPages(undefined), []);
  assert.deepEqual(getBusinessDirectoryPages({}), []);
  assert.deepEqual(getBusinessDirectoryPages({ pages: [{ businesses: [] }] }), [
    { businesses: [] },
  ]);
});

test("maps public vendor data into a business profile", () => {
  assert.deepEqual(
    normalizeBusiness({
      id: "vendor-one",
      storeName: "Market name",
      name: "Owner name",
      storeDescription: "A public description.",
      category: "Food",
      city: "Juba",
      country: "South Sudan",
      coverImage: "https://images.example/cover.jpg",
      profileImage: "https://images.example/profile.jpg",
      createdAt: "2026-10-25T00:00:00.000Z",
      email: "private@example.com",
    }),
    {
      id: "vendor-one",
      name: "Market name",
      category: "Food",
      description: "A public description.",
      location: "Juba, South Sudan",
      coverImage: "https://images.example/cover.jpg",
      profileImage: "https://images.example/profile.jpg",
      createdAt: "2026-10-25T00:00:00.000Z",
    },
  );
});

test("falls back to public name and location fields", () => {
  assert.deepEqual(
    normalizeBusiness({
      $id: "vendor-two",
      name: "Owner name",
      location: "Central Juba",
    }),
    {
      id: "vendor-two",
      name: "Owner name",
      category: "",
      description: "",
      location: "Central Juba",
      coverImage: "",
      profileImage: "",
      createdAt: "",
    },
  );
});

test("rejects public business data without an id or display name", () => {
  assert.throws(() => normalizeBusiness({ id: "vendor" }), /missing its ID/);
  assert.throws(() => normalizeBusiness({ name: "Store" }), /missing its ID/);
});

test("limits mobile business card descriptions to one sentence", () => {
  assert.equal(
    getBusinessDescriptionPreview("First sentence. Second sentence!"),
    "First sentence.",
  );
  assert.equal(
    getBusinessDescriptionPreview("First sentence. Second sentence!", 2),
    "First sentence. Second sentence!",
  );
  assert.equal(getBusinessDescriptionPreview(""), "");
});
