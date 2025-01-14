import type {
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { z } from 'zod'
import type { Event, SetEvent } from '../schemas/event'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { eventSchema, setEventSchema } from '../schemas/event'

export function converter<T>(schema: z.ZodSchema<T>) {
  return {
    toFirestore: (data: Partial<T>) => {
      try {
        return schema.parse(data)
      }
      catch (error) {
        console.error('Invalid data', error)
        throw error
      }
    },
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
  }
}

export const firestore = {
  events: {
    set: async (event: SetEvent) => {
      const id = crypto.randomUUID()
      await setDoc(doc(db, 'events', id).withConverter(converter(setEventSchema)), {
        ...event,
        id: event.id ?? id,
      })
    },
    getOne: async (id: string) => {
      const docSnap = await getDoc(doc(db, 'events', id))
      return docSnap.data() as Event
    },
    getMany: async (q: QueryConstraint) => {
      const docSnap = await getDocs(
        query(collection(db, 'events'), q).withConverter(converter(eventSchema)),
      )
      return docSnap.docs.map(doc => doc.data()) as Event[]
    },
  },
}
