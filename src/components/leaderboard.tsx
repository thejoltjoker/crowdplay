import React from "react";
import Avatar from "@/components/avatar";

export interface LeaderboardProps {}

const Leaderboard: React.FC<LeaderboardProps> = ({}) => {
  const users = [
    { id: "1", username: "Alban", score: 100 },
    { id: "2", username: "John", score: 90 },
    { id: "3", username: "Jane", score: 80 },
  ];
  return (
    <div>
      <h2 className="font-bold">Leaderboard</h2>
      <ul>
        {users.map((user) => (
          <li
            className="flex items-center justify-between border-b border-base-200 py-2"
            key={user.id}
          >
            <div className="flex items-center gap-2">
              <Avatar username={user.username} />
              <span className="font-medium">{user.username}</span>
            </div>
            <span className="opacity-50">{user.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
