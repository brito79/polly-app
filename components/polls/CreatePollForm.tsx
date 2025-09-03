"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { CreatePollData } from "@/types";

interface CreatePollFormProps {
  onSubmit: (pollData: CreatePollData) => Promise<void>;
  isLoading?: boolean;
}

export function CreatePollForm({ onSubmit, isLoading = false }: CreatePollFormProps) {
  const [pollData, setPollData] = useState<CreatePollData>({
    title: "",
    description: "",
    options: ["", ""],
    allowMultipleChoices: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!pollData.title.trim()) {
      newErrors.title = "Poll title is required";
    }

    const validOptions = pollData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalPollData = {
      ...pollData,
      options: validOptions,
    };

    try {
      await onSubmit(finalPollData);
    } catch (error) {
      console.error("Create poll error:", error);
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
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              placeholder="What would you like to ask?"
              value={pollData.title}
              onChange={(e) =>
                setPollData({ ...pollData, title: e.target.value })
              }
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more context to your poll..."
              value={pollData.description}
              onChange={(e) =>
                setPollData({ ...pollData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poll Options *</Label>
              <Badge variant="secondary">
                {pollData.options.filter(opt => opt.trim()).length} options
              </Badge>
            </div>
            
            {pollData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                </div>
                {pollData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {errors.options && (
              <p className="text-sm text-red-500">{errors.options}</p>
            )}

            {pollData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowMultiple"
              checked={pollData.allowMultipleChoices}
              onChange={(e) =>
                setPollData({
                  ...pollData,
                  allowMultipleChoices: e.target.checked,
                })
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="allowMultiple" className="text-sm">
              Allow multiple choices
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Poll"}
            </Button>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
