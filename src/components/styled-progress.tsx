import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StyledProgressProps
  extends React.ComponentPropsWithoutRef<typeof Progress> {
  value: number;
}
export const StyledProgress = ({
  className,
  ...props
}: StyledProgressProps) => (
  <Progress
    value={props.value}
    className={cn("rounded-none h-4 p-0.5 border-primary border", className)}
  />
);
