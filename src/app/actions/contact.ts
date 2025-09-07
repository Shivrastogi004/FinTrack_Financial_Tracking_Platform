
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  messageType: z.enum(['question', 'testimonial'], { required_error: 'Please select a message type.'}),
  consentToDisplay: z.boolean().optional(),
});

export async function saveContactMessage(formData: FormData) {
  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    message: formData.get('message'),
    messageType: formData.get('messageType'),
    consentToDisplay: formData.get('consentToDisplay') === 'on',
  };

  const parseResult = contactSchema.safeParse(rawData);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
    };
  }

  const { messageType, consentToDisplay, ...contactData } = parseResult.data;

  try {
    const collectionName = (messageType === 'testimonial' && consentToDisplay) ? 'testimonials' : 'contacts';
    
    await addDoc(collection(db, collectionName), {
        ...contactData,
        // Only include the fields relevant to the specific collection
        ...(collectionName === 'contacts' && { messageType, consentToDisplay }),
        createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding document: ', error);
    return {
      success: false,
      error: 'Could not save your message. Please try again later.',
    };
  }
}
