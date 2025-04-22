import { ZodError } from "zod"

export const formatZodError = <T>(error: ZodError<T>) => error.errors.map((err) => `${err.message} - ${err.path}`).join(", ")
