import { Timestamp } from "firebase/firestore";
import { z } from "zod";

export const TimestampType = z.custom<Timestamp>(
  value => value instanceof Timestamp,
);
export const timestampSchema = z.object({
  createdAt: TimestampType,
  updatedAt: TimestampType,
});
