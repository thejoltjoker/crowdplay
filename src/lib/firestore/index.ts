import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
} from "firebase/firestore";
import { z } from "zod";

import { Room, roomSchema, SetRoom, setRoomSchema } from "../schemas/room";

export const zodConverter = <T>(schema: z.ZodSchema<T>) => ({
  toFirestore: (data: Partial<T>) => {
    try {
      return schema.parse(data);
    } catch (error) {
      console.error("Invalid data", error);
      throw error;
    }
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});

export const firestore = {
  rooms: {
    set: async (room: SetRoom) => {
      const id = crypto.randomUUID();
      await setDoc(
        doc(db, "rooms", id).withConverter(zodConverter(setRoomSchema)),
        {
          ...room,
          id: room.id ?? id,
        }
      );
    },
    getOne: async (id: string) => {
      const docSnap = await getDoc(
        doc(db, "rooms", id).withConverter(zodConverter(roomSchema))
      );
      return docSnap.data() as Room;
    },
    getMany: async (q: QueryConstraint) => {
      const docSnap = await getDocs(
        query(collection(db, "rooms"), q).withConverter(zodConverter(roomSchema))
      );
      return docSnap.docs.map((doc) => doc.data()) as Room[];
    },
  },
};
