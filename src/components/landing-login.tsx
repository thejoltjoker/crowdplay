import type { FormEvent } from "react";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlayer } from "@/providers/player";

import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { randomString } from "@/lib/helpers/random-string";

const USERNAME_KEY = "crowdplay_username";

export interface LandingLoginProps {}

const LandingLogin: React.FC<LandingLoginProps> = () => {
  const { setUsername } = usePlayer();
  const [tempUsername, setTempUsername] = useState(
    localStorage.getItem(USERNAME_KEY) ?? randomString("_"),
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;

    try {
      await setUsername(tempUsername);
      localStorage.setItem(USERNAME_KEY, tempUsername);
    } catch (error) {
      console.error("Failed to update username:", error);
    }
  };

  const isNewUser = !localStorage.getItem(USERNAME_KEY);

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle>
          <h4>Welcome to CrowdPlay</h4>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {isNewUser
            ? "Please choose a username to get started!"
            : "Join a multiplayer quiz game and compete with friends!"}
        </p>
        <form className="space-y-2" onSubmit={handleSubmit}>
          <Label>What should we call you?</Label>
          <div className="flex w-full gap-2">
            <Input
              type="text"
              placeholder="Enter your username"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="w-full"
              required={isNewUser}
            />
            <Button
              type="submit"
              className="flex w-fit items-center gap-2"
              disabled={!tempUsername.trim()}
            >
              Save
            </Button>
          </div>
        </form>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4">
        <Button
          variant="outline"
          className="flex w-full items-center gap-2"
          disabled={isNewUser}
        >
          Sign in with Google
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LandingLogin;
