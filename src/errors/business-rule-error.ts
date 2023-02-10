import { ApplicationError } from "@/protocols";

export function businessRuleError(): ApplicationError {
  return {
    name: "businessRuleError",
    message: "Business Rule Error",
  };
}
