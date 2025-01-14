import { useUser } from "@/lib/providers/user-provider";
import React from "react";
import Avatar from "./avatar";

export interface HeaderProps {}

const Header: React.FC<HeaderProps> = ({}) => {
  const { user } = useUser();
  return (
    <div className="border-b border-base-200 w-full">
      <header className="w-full flex items-center justify-center p-4 max-w-screen-sm mx-auto">
        <h1 className="font-black text-xl tracking-wide">Crowdplay</h1>
      </header>
    </div>
  );
};

export default Header;
