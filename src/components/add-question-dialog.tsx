import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGame } from "@/providers/game";

// Update the schema definition to be more explicit
const formSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  correctAnswer: z.string().min(1, "Please select a correct answer"),
  hasTimeLimit: z.boolean().default(false),
  timeLimit: z.number().min(5).max(120).nullable().default(30),
  options: z.array(z.string().min(1, "Option text is required")).min(2).max(6),
});

type FormValues = z.infer<typeof formSchema>;

export interface AddQuestionDialogProps {
  trigger?: React.ReactNode;
}

const AddQuestionDialog: React.FC<AddQuestionDialogProps> = ({ trigger }) => {
  const game = useGame();
  if (game.status !== "ready") return null;
  const [open, setOpen] = React.useState(false);
  const [optionCount, setOptionCount] = React.useState(2);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: "",
      correctAnswer: "",
      hasTimeLimit: true,
      timeLimit: 30,
      options: ["", ""],
    },
  });

  const handleSubmit = (values: FormValues) => {
    console.log("values", values);
    game.state.questions.add([
      {
        id: crypto.randomUUID(),
        text: values.questionText,
        correctOption: parseInt(values.correctAnswer),
        timeLimit: values.timeLimit,
        options: values.options.filter(Boolean),
      },
    ]);
    form.reset();
    setOpen(false);
  };

  const addOption = () => {
    if (optionCount < 6) {
      const options = form.getValues("options");
      form.setValue("options", [...options, ""]);
      setOptionCount((prev) => prev + 1);
    }
  };

  const removeOption = (index: number) => {
    if (optionCount > 2) {
      const options = form.getValues("options");
      const newOptions = options.filter((_, i) => i !== index);
      form.setValue("options", newOptions);

      if (form.getValues("correctAnswer") === index.toString()) {
        form.setValue("correctAnswer", "");
      }

      setOptionCount((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Add Question</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a new question for your quiz. Add between 2-6 options and set
            a time limit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your question here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasTimeLimit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Time Limit</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("hasTimeLimit") && (
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || 30}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Default is 30 seconds. Min: 5s, Max: 120s
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("options").map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <FormLabel>Option {index + 1}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Enter option ${index + 1}`}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      {optionCount > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mb-2 self-end"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {optionCount < 6 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addOption}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {Array.from({ length: optionCount }).map((_, index) => (
                        <FormItem
                          key={index}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={index.toString()} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Option {index + 1}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Add Question
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionDialog;
