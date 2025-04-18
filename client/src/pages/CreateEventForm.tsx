import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supportedLanguages } from "@/lib/languages";

interface CreateEventFormProps {
  onEventCreated: (event: any) => void;
}

const FormSchema = z.object({
  name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  eventType: z.string().optional(),
  date: z.string().min(1, { message: "Please select a date." }),
  time: z.string().optional(),
  location: z.string().min(1, { message: "Please enter a location." }),
  description: z.string().optional(),
  supportedLanguages: z.array(z.string()).min(1, { message: "Please select at least one language." }),
  audioConfig: z.string().optional(),
  enableAudioTranslation: z.boolean().default(false),
  organizerId: z.number().default(1), // Mock organizer ID for demo
});

const CreateEventForm = ({ onEventCreated }: CreateEventFormProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [languageInput, setLanguageInput] = useState("");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      eventType: "Conference",
      date: "",
      time: "",
      location: "",
      description: "",
      supportedLanguages: ["English"],
      audioConfig: "Direct connection to venue audio system",
      enableAudioTranslation: false,
      organizerId: 1,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof FormSchema>) => {
      const response = await apiRequest("POST", "/api/events", values);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      onEventCreated(data);
      
      // Redirect to the broadcast page after showing QR code
      setTimeout(() => {
        setLocation(`/broadcast/${data.id}`);
      }, 1500); // Give the QR modal time to be shown
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    values.supportedLanguages = selectedLanguages;
    createEventMutation.mutate(values);
  };

  const handleAddLanguage = () => {
    if (languageInput && !selectedLanguages.includes(languageInput)) {
      setSelectedLanguages([...selectedLanguages, languageInput]);
      setLanguageInput("");
    }
  };

  const handleRemoveLanguage = (language: string) => {
    // Always keep at least English
    if (language !== "English") {
      setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
    }
  };

  const handleCancel = () => {
    setLocation("/dashboard");
  };

  return (
    <div>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Create New Event</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Event Details</h2>
                <p className="mt-1 text-sm text-gray-500">Provide basic information about your event to get started.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Conference 2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Conference">Conference</SelectItem>
                          <SelectItem value="Webinar">Webinar</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Convention Center, Virtual, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your event" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Translation Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Supported Languages</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedLanguages.map(language => (
                        <Badge 
                          key={language} 
                          variant="secondary"
                          className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1"
                        >
                          <span className="text-sm text-gray-700">{language}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 text-gray-400 hover:text-gray-500"
                            onClick={() => handleRemoveLanguage(language)}
                            disabled={language === "English"} // Can't remove English
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select onValueChange={setLanguageInput} value={languageInput}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguages
                            .filter(lang => !selectedLanguages.includes(lang))
                            .map(language => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddLanguage}
                        disabled={!languageInput || selectedLanguages.includes(languageInput)}
                      >
                        Add Language
                      </Button>
                    </div>
                    {form.formState.errors.supportedLanguages && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {form.formState.errors.supportedLanguages.message}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="audioConfig"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Input Configuration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audio configuration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Direct connection to venue audio system">Direct connection to venue audio system</SelectItem>
                            <SelectItem value="Dedicated microphone setup">Dedicated microphone setup</SelectItem>
                            <SelectItem value="Wireless audio streaming">Wireless audio streaming</SelectItem>
                            <SelectItem value="Custom configuration (requires technical support)">Custom configuration (requires technical support)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableAudioTranslation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Audio Translation</FormLabel>
                          <FormDescription>
                            Allow participants to listen to translated audio in addition to reading text translations.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEventMutation.isPending}
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventForm;
