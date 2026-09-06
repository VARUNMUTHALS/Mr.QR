import { describe, it, expect } from "vitest";
import { validateDestinationUrl } from "../../convex/helpers/validation";

describe("validateDestinationUrl", () => {
  it("allows standard https and http URLs", () => {
    expect(validateDestinationUrl("https://example.com/product")).toBe(
      "https://example.com/product"
    );
    expect(validateDestinationUrl("http://mr-qr.dev/studio")).toBe(
      "http://mr-qr.dev/studio"
    );
  });

  it("blocks dangerous script schemes", () => {
    expect(() => validateDestinationUrl("javascript:alert(1)")).toThrow(
      "Forbidden URL protocol"
    );
    expect(() => validateDestinationUrl("data:text/html,<h1>Hack</h1>")).toThrow(
      "Forbidden URL protocol"
    );
    expect(() => validateDestinationUrl("file:///etc/passwd")).toThrow(
      "Forbidden URL protocol"
    );
  });

  it("blocks SSRF loopback and internal hosts", () => {
    expect(() => validateDestinationUrl("http://localhost:8080")).toThrow(
      "Private or loopback destination hosts are prohibited"
    );
    expect(() => validateDestinationUrl("http://127.0.0.1/admin")).toThrow(
      "Private or loopback destination hosts are prohibited"
    );
    expect(() => validateDestinationUrl("http://169.254.169.254/latest/meta-data/")).toThrow(
      "Private or loopback destination hosts are prohibited"
    );
  });

  it("blocks RFC1918 private IP addresses", () => {
    expect(() => validateDestinationUrl("http://192.168.1.1")).toThrow(
      "Private network IP addresses cannot be set"
    );
    expect(() => validateDestinationUrl("http://10.0.0.1")).toThrow(
      "Private network IP addresses cannot be set"
    );
  });
});
