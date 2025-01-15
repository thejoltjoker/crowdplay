import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";

import { db } from "@/lib/firebase";

const CreateRoom: React.FC = () => {
  const [roomName, setRoomName] = useState("");

  const handleCreateRoom = async () => {
    if (!roomName) {
      throw new Error("Please enter a room name!");
    }

    try {
      const roomId = await createRoom(roomName, "host_uid"); // Replace with actual host UID
      console.log(`Room created with ID: ${roomId}`);
    }
    catch (error) {
      console.error("Error creating room:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Room Name"
        value={roomName}
        onChange={e => setRoomName(e.target.value)}
      />
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
};

async function createRoom(roomName: string, hostUid: string): Promise<string> {
  const roomRef = collection(db, "rooms");
  const newRoom = {
    name: roomName,
    host: hostUid,
    createdAt: new Date(),
    active: true,
    questions: [],
    players: {},
    answers: [],
    currentQuestionIndex: 0,
  };

  const roomDoc = await addDoc(roomRef, newRoom);
  return roomDoc.id; // Return the room ID for further use
}

export default CreateRoom;
