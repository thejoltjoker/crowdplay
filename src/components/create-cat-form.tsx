import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { catZodSchema } from "../../functions/src/mongo/models/cat";

export function CreateCatForm() {
  const form = useForm<z.infer<typeof catZodSchema>>({
    resolver: zodResolver(catZodSchema),
    defaultValues: {
      name: "",
      age: 0,
      breed: "",
      pets: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof catZodSchema>) => {
    console.log(values);
  };
  return (
    <Card className="w-[350px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Create cat</CardTitle>
            <CardDescription>Create a new cat.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5">
                    <FormLabel htmlFor="name">Name</FormLabel>
                    <FormControl>
                      <Input
                        id="name"
                        placeholder="Felix"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>Name of the cat</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5">
                    <FormLabel htmlFor="age">Age</FormLabel>
                    <FormControl>
                      <Input
                        id="age"
                        placeholder="3"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Math.max(Number(e.target.value), 0))
                        }
                        required
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>Age of the cat</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              {/* <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5">
                    <FormLabel htmlFor="breed">Breed</FormLabel>
                    <FormControl>
                      <Select>
                        <SelectTrigger id="breed">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="tabby">Tabby</SelectItem>
                          <SelectItem value="persian">Persian</SelectItem>
                          <SelectItem value="siamese">Siamese</SelectItem>
                          <SelectItem value="maine-coon">Maine Coon</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>Breed of the cat</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Save</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
