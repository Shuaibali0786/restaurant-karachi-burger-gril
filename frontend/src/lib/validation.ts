import { z } from "zod";
import { normalizePkMobile } from "@/lib/phone";
import type { DeliveryArea } from "@/lib/types";

/**
 * Pakistani mobile number: 03XX-XXXXXXX, +92 3XX XXXXXXX, 0092…, or 92…
 * (spaces and dashes allowed). Normalised to +923XXXXXXXXX. Landlines rejected.
 */
export const pkMobile = z
  .string()
  .refine((value) => normalizePkMobile(value) !== null, {
    message: "Enter a Pakistani mobile number like 0300-1234567",
  })
  .transform((value) => normalizePkMobile(value) as string);

const name = z.string().trim().min(2, "Please enter your name").max(60, "Name is too long");
const email = z.email("Enter a valid email address").trim();
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} can be up to ${max} characters`)
    .transform((value) => value || undefined);

export const deliveryAreaIds = ["saddar", "clifton", "dha", "pechs", "gulshan", "north-nazimabad"] as const satisfies readonly DeliveryArea[];

export const checkoutSchema = z
  .object({
    name,
    phone: pkMobile,
    area: z.enum(deliveryAreaIds, { error: "Choose your delivery area" }),
    address: z
      .string()
      .trim()
      .min(10, "Please add your house/flat number, street and block")
      .max(200, "Address can be up to 200 characters"),
    landmark: optionalText(80, "Landmark"),
    notes: optionalText(200, "Delivery notes"),
    deliveryTime: z.enum(["asap", "scheduled"]),
    scheduledFor: z
      .string()
      .optional()
      .transform((value) => value || undefined),
    payment: z.literal("cod", { error: "Only Cash on Delivery is available right now" }),
  })
  .superRefine((form, ctx) => {
    if (form.deliveryTime === "scheduled" && !form.scheduledFor) {
      ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "Pick a delivery time" });
    }
  })
  .transform((form) => ({ ...form, scheduledFor: form.deliveryTime === "scheduled" ? form.scheduledFor : undefined }));

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutFormValues = z.output<typeof checkoutSchema>;

export const contactSchema = z
  .object({
    name,
    phone: z.string().trim(),
    email: z.string().trim(),
    message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1000, "Message is too long"),
  })
  .superRefine((form, ctx) => {
    if (!form.phone && !form.email) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Add a phone number or an email so we can reply" });
      return;
    }
    if (form.phone && !pkMobile.safeParse(form.phone).success) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a Pakistani mobile number like 0300-1234567" });
    }
    if (form.email && !email.safeParse(form.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address" });
    }
  });

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile number")
    .refine((value) => email.safeParse(value).success || pkMobile.safeParse(value).success, {
      message: "Enter a valid email or a mobile number like 0300-1234567",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    name,
    email,
    phone: pkMobile,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((form) => form.password === form.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const newsletterSchema = z.object({ email });
