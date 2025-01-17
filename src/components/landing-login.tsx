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
import { randomString } from "@/lib/helpers/random-string";
import { useAuth } from "@/providers/auth";

import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

export interface LandingLoginProps {}

const LandingLogin: React.FC<LandingLoginProps> = () => {
  const { username, setUsername } = useAuth();
  const [tempUsername, setTempUsername] = useState(
    username ?? randomString("_"),
  );
  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle>
          <h4>Welcome to CrowdPlay</h4>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Join a multiplayer quiz game and compete with friends!
        </p>
        <form
          className="space-y-2"
          onSubmit={() => {
            setUsername(tempUsername);
          }}
        >
          <Label>What should we call you?</Label>
          <div className="flex w-full gap-2">
            <Input
              type="text"
              placeholder="Enter your username"
              value={tempUsername}
              onChange={e => setTempUsername(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="flex w-fit items-center gap-2">
              Save
            </Button>
          </div>
        </form>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4">
        <Button variant="outline" className="flex w-full items-center gap-2">
          Sign in with Google
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LandingLogin;
