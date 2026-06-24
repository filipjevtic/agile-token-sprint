import { describe, it } from "node:test";
import assert from "node:assert";
import { escapeCsvValue, toCsv } from "./csv.js";

describe("escapeCsvValue", () => {
  it("passes through simple values", () => {
    assert.strictEqual(escapeCsvValue("hello"), "hello");
    assert.strictEqual(escapeCsvValue(42), "42");
    assert.strictEqual(escapeCsvValue(true), "true");
  });

  it("renders null/undefined as empty", () => {
    assert.strictEqual(escapeCsvValue(null), "");
    assert.strictEqual(escapeCsvValue(undefined), "");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    assert.strictEqual(escapeCsvValue("a,b"), '"a,b"');
    assert.strictEqual(escapeCsvValue('say "hi"'), '"say ""hi"""');
    assert.strictEqual(escapeCsvValue("line1\nline2"), '"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("serializes rows with a header line", () => {
    const csv = toCsv(
      [
        { name: "Ada", tokens: 100 },
        { name: "Bob, Jr", tokens: 50 },
      ],
      [
        { header: "Name", value: (r) => r.name },
        { header: "Tokens", value: (r) => r.tokens },
      ]
    );
    assert.strictEqual(csv, 'Name,Tokens\r\nAda,100\r\n"Bob, Jr",50');
  });

  it("emits just the header for no rows", () => {
    const csv = toCsv<{ a: string }>([], [{ header: "A", value: (r) => r.a }]);
    assert.strictEqual(csv, "A");
  });
});
