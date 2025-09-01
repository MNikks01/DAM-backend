import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .nonempty("Email is required")
      .trim()
      .email("Invalid email format")
      .toLowerCase(),

    password: z
      .string()
      .nonempty("Password is required")
      .min(6, "Password must be at least 6 characters long"),

    confirmPassword: z.string().nonempty("Confirm password is required"),

    name: z
      .string()
      .nonempty("Name is required")
      .trim()
      .min(1, "First name cannot be empty"),

    team: z.string().nonempty("team is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .trim()
    .email("Invalid email format")
    .toLowerCase(),

  password: z.string().nonempty("Password is required"),
});

export const updateSchema = z.object({
  firstName: z
    .string()
    .nonempty("First name is required")
    .trim()
    .min(1, "First name cannot be empty"),

  lastName: z
    .string()
    .nonempty("Last name is required")
    .trim()
    .min(1, "Last name cannot be empty"),

  dob: z.string().nonempty("Date of birth is required"),

  gender: z
    .enum(["male", "female", "other"])
    .refine((val) => ["male", "female", "other"].includes(val), {
      message: "Gender must be one of: male, female, or other",
    }),

  height: z.coerce
    .number("Height is required")
    .positive("Height must be a positive number"),

  weight: z.coerce
    .number("Weight is required")
    .positive("Weight must be a positive number"),

  level: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return "beginner";
      return val;
    })
    .refine((val) => ["beginner", "intermediate", "advanced"].includes(val), {
      message: "Invalid level option",
    }),

  profilePicture: z.string().optional(),
});
