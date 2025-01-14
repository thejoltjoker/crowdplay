import { useUser } from "@/lib/providers/user-provider";
import React from "react";
import Avatar from "@/components/avatar";
import { GamepadIcon, TrophyIcon } from "lucide-react";
export interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const { user } = useUser();
  return (
    <div className="btm-nav border-t border-base-200">
      <button>
        <GamepadIcon className="size-6" />
        <span className="text-xs font-medium">Play</span>
      </button>
      <button className="active">
        <TrophyIcon className="size-6" />
        <span className="text-xs font-medium">Leaderboard</span>
      </button>
      <button>
        <Avatar username={user?.username ?? ""} />
        <span className="text-xs font-medium">@{user?.username}</span>
      </button>
    </div>
  );
};

export default Navbar;
