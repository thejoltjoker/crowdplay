import React from "react";

export interface ErrorScreenProps {
  error: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-destructive">{error}</p>
    </div>
  );
};

export default ErrorScreen;
