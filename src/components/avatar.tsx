import { notionists } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import React from "react";

export interface AvatarProps {
  username: string;
}

const Avatar: React.FC<AvatarProps> = ({ username }) => {
  const avatar = createAvatar(notionists, {
    seed: username,
    scale: 120,
  });

  const svg = avatar.toString();
  return (
    <div className="avatar">
      <div
        className="w-6 rounded-full border border-base-200 ring-1 ring-base-300 ring-offset-1 bg-white"
        dangerouslySetInnerHTML={{ __html: svg }}
      ></div>
    </div>
  );
};

export default Avatar;
