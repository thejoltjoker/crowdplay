import React, { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { GameState } from "@/lib/schemas/game";

const useGameRoom = (roomId: string) => {
  const [gameState, setGameState] = useState<GameState>();

  useEffect(() => {
    // 1. Listen to room document
    const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      setGameState(doc.data() as GameState);
    });

    // 2. Handle player answers
    const handleAnswer = async (answer: number) => {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`players.${userId}.answer`]: answer,
        [`players.${userId}.answeredAt`]: serverTimestamp(),
      });
    };

    return () => unsubscribe();
  }, [roomId]);

  return { gameState, handleAnswer };
};

export default useGameRoom;
