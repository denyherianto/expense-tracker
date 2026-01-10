'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { openai, modelName } from '@/lib/openai';
import { InvoiceSchema } from '@/lib/openai';
import { db } from '@/db';
import { invoices, items } from '@/db/schema';
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

    let messages: any[] = [
      {
        role: 'system',
        content: `Current date is ${new Date().toISOString()}. You are an intelligent invoice parser. 
        Extract a comprehensive summary, date, total amount, and line items from the invoice.
        Instead of just a merchant name, create a "summary" that describes the transaction in Indonesian, e.g., "Makan Siang di McDonald's" or "Belanja Bulanan di Indomaret".
        The output must be a valid JSON object with the following exact structure:
        {
          "summary": "string",
          "date": "YYYY-MM-DD",
          "totalAmount": number,
          "items": [
            {
              "name": "string",
              "quantity": number,
              "unitPrice": number,
              "totalPrice": number,
              "category": "string" (One of: Sembako, Makan & Minum, Transportasi, Utilitas, Hiburan, Kesehatan, Lain-lain)
            }
          ]
        }
        Auto-categorize each item into one of the categories.
        Convert all currency to IDR (Rupiah) numeric values (e.g., 15000 for Rp15.000).
        If the quantity is implicit (e.g., "Nasi Goreng"), assume 1.`,
      },
    ];

    if (rawText) {
      messages.push({
        role: 'user',
        content: rawText,
      });
    } else if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Parse this invoice.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${file.type};base64,${base64}`,
            },
          },
        ],
      });
    }

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('Failed to generate invoice data.');
    }

    let parsedData;
    try {
        parsedData = JSON.parse(content);
    } catch (e) {
        throw new Error('Failed to parse JSON response from AI.');
    }

    // Validate with Zod
    const result = InvoiceSchema.parse(parsedData);

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
             const [newP] = await db.insert(require('@/db/schema').pockets).values({
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

    // Verify ownership
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.userId, userId))
    });

    if (!invoice) {
      throw new Error("Invoice not found or unauthorized");
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
