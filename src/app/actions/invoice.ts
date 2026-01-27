'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { openai, modelName } from '@/lib/openai';
import { InvoiceSchema } from '@/lib/openai';
import { db } from '@/db';
import { invoices, items, pockets } from '@/db/schema';
import { revalidatePath } from 'next/cache';

// ... (existing imports)

export async function processInvoice(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // ... (existing form processing)

    const rawText = formData.get('rawText') as string | null;
    const file = formData.get('file') as File | null;

    if (!rawText && !file) {
      throw new Error('Please provide either text or an image.');
    }

    let imageUrl: string | undefined;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      imageUrl = `data:${file.type};base64,${base64}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      {
        role: 'system',
        content: `Current date is ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })} (UTC+7). You are an intelligent invoice parser.
        Extract a comprehensive summary, date, total amount, and line items from the invoice.
        Instead of just a merchant name, create a "summary" that describes the transaction in English, e.g., "Lunch at McDonald's" or "Monthly Groceries at Walmart".

        The result MUST be a valid JSON object with the following structure:
        {
          "summary": "String",
          "date": "ISO8601 Date String (YYYY-MM-DD)",
          "totalAmount": Number,
          "items": [
            {
              "name": "String",
              "quantity": Number,
              "unitPrice": Number,
              "totalPrice": Number,
              "category": "String (Food, Transport, Utilities, Entertainment, Health, Education, Shopping, Other)"
            }
          ]
        }

        IMPORTANT:
        - The invoice is likely in Indonesian format (IDR).
        - "." (DOT) is the THOUSAND separator (e.g., 38.000 = 38000, 1.500 = 1500).
        - "," (COMMA) is the DECIMAL separator.
        - Return all number fields as raw Integers (no formatting).
        
        Return ONLY the JSON. No markdown formatting.`
      },
      {
        role: 'user',
        content: [
          { type: "text", text: "Please parse this invoice." },
          ...(imageUrl ? [{ type: "image_url", image_url: { url: imageUrl } }] : []),
          ...(rawText ? [{ type: "text", text: `Invoice Text:\n${rawText}` }] : [])
        ]
      }
    ];

    const completion = await openai.chat.completions.create({
      model: modelName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('Failed to generate invoice data.');
    }

    let parsedData;
    try {
        parsedData = JSON.parse(content);
    } catch {
        throw new Error('Failed to parse JSON response from AI.');
    }

    // Validate with Zod
    const result = InvoiceSchema.parse(parsedData);

    if (result.items.length === 0 && (!result.totalAmount || result.totalAmount === 0)) {
      throw new Error('Failed to process invoice data. Please ensure the image/text is clear.');
    }

    const pocketId = formData.get('pocketId') as string;
    
    let finalPocketId = pocketId;

    if (!finalPocketId) {
        // Fallback logic
        const existing = await db.query.pockets.findFirst({
          where: (pockets, { eq }) => and(eq(pockets.name, 'Personal'), eq(pockets.userId, userId))
        });
        if (existing) {
            finalPocketId = existing.id;
        } else {
          const [newP] = await db.insert(pockets).values({
                name: 'Personal',
               userId: userId
             }).returning();
             finalPocketId = newP.id;
        }
    }

    // Save to Database
    const invoice = await db.transaction(async (tx) => {
        const [newInvoice] = await tx.insert(invoices).values({
          userId: userId, 
            summary: result.summary,
            date: new Date(result.date),
            totalAmount: result.totalAmount.toString(),
            pocketId: finalPocketId,
            rawText: rawText || 'Image Upload',
        }).returning();

        const itemValues = result.items.map((item) => ({
            invoiceId: newInvoice.id,
            name: item.name,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            category: item.category,
        }));

        if (itemValues.length > 0) {
           await tx.insert(items).values(itemValues);
        }

        // Return the full invoice object with items
        const savedInvoice = await tx.query.invoices.findFirst({
            where: eq(invoices.id, newInvoice.id),
            with: { items: true }
        });
        
        if (!savedInvoice) throw new Error("Failed to retrieve saved invoice");
        return savedInvoice;
    });

    revalidatePath('/');
    revalidatePath('/invoices');
    revalidatePath('/analysis');

    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error processing invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Verify ownership (Creator OR Pocket Owner)
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: { pocket: true }
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const isCreator = invoice.userId === userId;
    const isPocketOwner = invoice.pocket?.userId === userId;

    if (!isCreator && !isPocketOwner) {
      throw new Error("Unauthorized to delete this invoice");
    }

    // Delete items first (cascade should handle this but explicit is safer/clearer if no cascade)
    await db.delete(items).where(eq(items.invoiceId, id));

    // Delete invoice
    await db.delete(invoices).where(eq(invoices.id, id));

    revalidatePath('/');
    revalidatePath('/invoices');
    revalidatePath('/analysis');

    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
