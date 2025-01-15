import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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

// Dynamic schema based on number of options
function createQuestionSchema(optionCount: number) {
  const optionFields: Record<string, z.ZodString> = {};
  const validOptions: string[] = [];

  for (let i = 0; i < optionCount; i++) {
    const optionKey = `option${i}`;
    optionFields[optionKey] = z.string().min(1, `Option ${i + 1} is required`);
    validOptions.push(i.toString());
  }

  return z.object({
    questionText: z.string().min(1, "Question text is required"),
    ...optionFields,
    correctAnswer: z
      .string()
      .refine(
        val => val >= "0" && val < optionCount.toString(),
        "Please select a valid option",
      ),
  });
}

// Update the QuestionFormValues type to include dynamic options
interface QuestionFormValues {
  questionText: string;
  correctAnswer?: string;
  [key: `option${number}`]: string;
}

export interface AddQuestionDialogProps {
  onSubmit: (values: any) => void;
  trigger?: React.ReactNode;
}

const AddQuestionDialog: React.FC<AddQuestionDialogProps> = ({
  onSubmit,
  trigger,
}) => {
  const [open, setOpen] = React.useState(false);
  const [optionCount, setOptionCount] = React.useState(2);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(createQuestionSchema(optionCount)),
    defaultValues: {
      questionText: "",
      correctAnswer: undefined,
    },
  });

  const handleSubmit = (values: any) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  const addOption = () => {
    if (optionCount < 6) {
      setOptionCount(optionCount + 1);
    }
  };

  const removeOption = (index: number) => {
    if (optionCount > 2) {
      // Clear the removed option's value
      form.setValue(`option${index}`, "");
      if (form.getValues("correctAnswer") === index.toString()) {
        form.setValue("correctAnswer", undefined);
      }

      // Shift all subsequent options up
      for (let i = index; i < optionCount - 1; i++) {
        const nextValue = form.getValues(`option${i + 1}`);
        form.setValue(`option${i}`, nextValue);
      }

      setOptionCount(optionCount - 1);
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
            Create a new question for your quiz. Add between 2-6 options.
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

            <div className="space-y-4">
              {Array.from({ length: optionCount }).map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`option${index}` as keyof QuestionFormValues}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <FormLabel>
                            Option
                            {index + 1}
                          </FormLabel>
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
                            className="self-end mb-2"
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
            </div>

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
                            Option
                            {" "}
                            {index + 1}
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
