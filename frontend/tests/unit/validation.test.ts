import { describe, expect, it } from "vitest";
import { checkoutSchema, contactSchema, pkMobile, signupSchema } from "@/lib/validation";

describe("Pakistani mobile numbers", () => {
  it.each(["03001234567", "0300-1234567", "0300 1234567", "+923001234567", "+92 300 1234567", "0092 300 1234567", "923001234567"])(
    "accepts %s and normalises it",
    (input) => {
      expect(pkMobile.parse(input)).toBe("+923001234567");
    },
  );

  it.each(["02112345678", "0300123456", "+9230012345678", "0400-1234567", "hello", ""])("rejects %s", (input) => {
    expect(pkMobile.safeParse(input).success).toBe(false);
  });
});

const validCheckout = {
  name: "Ayesha Khan",
  phone: "0300-1234567",
  area: "clifton",
  address: "House 12, Street 4, Block 5, Clifton",
  landmark: "Near Dolmen Mall",
  notes: "",
  deliveryTime: "asap",
  scheduledFor: "",
  payment: "cod",
} as const;

describe("checkout form", () => {
  it("accepts a complete ASAP order and normalises the phone", () => {
    const result = checkoutSchema.parse(validCheckout);
    expect(result.phone).toBe("+923001234567");
    expect(result.scheduledFor).toBeUndefined();
  });

  it("requires name, area and a real address", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, name: "A", area: "", address: "Clifton" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["name", "area", "address"]));
  });

  it("requires a time slot when scheduling for later", () => {
    const missing = checkoutSchema.safeParse({ ...validCheckout, deliveryTime: "scheduled" });
    expect(missing.error?.issues[0]?.path).toEqual(["scheduledFor"]);
    const ok = checkoutSchema.parse({ ...validCheckout, deliveryTime: "scheduled", scheduledFor: "2026-09-30T16:00:00.000Z" });
    expect(ok.scheduledFor).toBe("2026-09-30T16:00:00.000Z");
  });

  it("only accepts Cash on Delivery for now", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, payment: "card" }).success).toBe(false);
  });
});

describe("other forms", () => {
  it("contact needs a phone or an email", () => {
    expect(contactSchema.safeParse({ name: "Bilal", phone: "", email: "", message: "Do you cater events?" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "Bilal", phone: "", email: "bilal@example.com", message: "Do you cater events?" }).success).toBe(true);
  });

  it("signup passwords must match", () => {
    const base = { name: "Sana", email: "sana@example.com", phone: "03211234567", password: "fire-wings-8", confirmPassword: "fire-wings-8" };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, confirmPassword: "different1" }).error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("signup needs an email or a mobile number, and each must be valid if given", () => {
    const base = { name: "Sana", email: "", phone: "", password: "fire-wings-8", confirmPassword: "fire-wings-8" };
    expect(signupSchema.safeParse(base).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, email: "sana@example.com" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, phone: "0321-1234567" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
  });
});

describe("login", () => {
  it("accepts an email or a Pakistani mobile number", async () => {
    const { loginSchema } = await import("@/lib/validation");
    expect(loginSchema.safeParse({ identifier: "sana@example.com", password: "fire-wings-8" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "0321-1234567", password: "fire-wings-8" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "sana", password: "fire-wings-8" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "sana@example.com", password: "short" }).success).toBe(false);
  });
});
