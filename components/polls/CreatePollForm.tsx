"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createPoll } from "@/lib/actions/poll";

interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  allow_multiple_choices: boolean;
  expires_at?: string;
}

export function CreatePollForm() {
  const [pollData, setPollData] = useState<CreatePollData>({
    title: "",
    description: "",
    options: ["", ""],
    allow_multiple_choices: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const addOption = () => {
    if (pollData.options.length < 10) {
      setPollData({
        ...pollData,
        options: [...pollData.options, ""],
      });
    }
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      setPollData({ ...pollData, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({ ...pollData, options: newOptions });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!pollData.title.trim()) {
      newErrors.title = "Poll title is required";
    } else if (pollData.title.trim().length < 3) {
      newErrors.title = "Poll title must be at least 3 characters";
    }

    const validOptions = pollData.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      newErrors.options = "All options must be unique";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrors({ submit: "You must be logged in to create a poll" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await createPoll({
        title: pollData.title.trim(),
        description: pollData.description?.trim() || undefined,
        options: pollData.options.filter(opt => opt.trim()),
        allow_multiple_choices: pollData.allow_multiple_choices,
        expires_at: pollData.expires_at || undefined,
      });

      // Redirect to the created poll
      router.push(`/polls/${result.pollId}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create poll'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create a New Poll</CardTitle>
        <CardDescription>
          Create a poll to get opinions from your community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="What's your question?"
              value={pollData.title}
              onChange={(e) => setPollData({ ...pollData, title: e.target.value })}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Poll Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more context to your poll..."
              value={pollData.description}
              onChange={(e) => setPollData({ ...pollData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Poll Options */}
          <div className="space-y-2">
            <Label>Options *</Label>
            {errors.options && (
              <p className="text-sm text-red-500">{errors.options}</p>
            )}
            <div className="space-y-3">
              {pollData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant="outline" className="min-w-[24px] h-6 text-xs">
                    {index + 1}
                  </Badge>
                  <Input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1"
                  />
                  {pollData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {pollData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}
          </div>

          {/* Poll Settings */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium">Poll Settings</h3>
            
            {/* Multiple Choice */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="multiple-choice">Allow Multiple Choices</Label>
                <p className="text-sm text-gray-600">
                  Let users select more than one option
                </p>
              </div>
              <Switch
                id="multiple-choice"
                checked={pollData.allow_multiple_choices}
                onCheckedChange={(checked: boolean) => 
                  setPollData({ ...pollData, allow_multiple_choices: checked })
                }
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expires-at">
                <Calendar className="inline mr-1 h-4 w-4" />
                Expiration Date (Optional)
              </Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={pollData.expires_at || ""}
                onChange={(e) => setPollData({ ...pollData, expires_at: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-gray-600">
                Leave empty for polls that never expire
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Poll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
