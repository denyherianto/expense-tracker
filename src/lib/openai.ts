import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

if (!apiKey) {
  console.warn("Missing OPENAI_API_KEY environment variable.");
}

export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

export const modelName = process.env.OPENAI_MODEL || "gpt-4o";

import { z } from "zod";

export const InvoiceSchema = z.object({
  summary: z.string(),
  date: z.string(),
  totalAmount: z.number(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    category: z.string(),
  })),
});
