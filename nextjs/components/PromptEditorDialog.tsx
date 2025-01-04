"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "./ui/dialog";
import { Loader2, MessageSquare, Save } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatTokens, getPromptTokenCount } from "@/utils/token-helper";
import { cn } from "@/lib/utils";
import { MAX_TOKENS_PROMPT } from "@/lib/constants";
import { CommonPrompt } from "@/interfaces/CommonPrompt";

interface PromptEditorDialogProps {
  isOpen: boolean;
  prompt: CommonPrompt | null;
  handleOnClose: () => void;
  isSaving: boolean;
  handleSave: (prompt: CommonPrompt) => void;
}

function PromptEditorDialog({
  isOpen,
  prompt,
  handleOnClose,
  isSaving,
  handleSave,
}: PromptEditorDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isExceeded, setIsExceeded] = useState(false);
  const [currentTokenCount, setCurrentTokenCount] = useState(0);

  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setContent(prompt.prompt || "");
      setCurrentTokenCount(getPromptTokenCount(prompt.prompt || ""));
    } else {
      setName("");
      setContent("");
      setCurrentTokenCount(0);
    }
  }, [prompt]);

  useEffect(() => {
    setIsExceeded(currentTokenCount > MAX_TOKENS_PROMPT);
  }, [currentTokenCount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name: fieldName, value } = e.target;
    if (fieldName === "name") {
      setName(value);
    } else {
      setContent(value);
      setCurrentTokenCount(getPromptTokenCount(value));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogTitle />
      <DialogContent className="max-w-[90%] sm:max-w-[80%] lg:max-w-[40%] bg-white p-8 md:px-12 md:py-8 rounded-3xl sm:rounded-3xl lg:border-4 border-main space-y-1">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MessageSquare
              className="h-7 w-7 sm:h-8 sm:w-8 text-main flex-shrink-0"
              strokeWidth={3}
            />
            <Input
              name="name"
              value={name}
              onChange={handleChange}
              className="flex-grow font-semibold text-xl sm:text-2xl text-main bg-transparent border-none p-0 placeholder:text-main/75 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Enter prompt name..."
            />
          </div>
          <Textarea
            name="content"
            value={content}
            onChange={handleChange}
            rows={4}
            className="w-full border-none bg-transparent resize-none min-h-[50vh] sm:min-h-[60vh] text-base sm:text-lg focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 "
            placeholder="Enter prompt content..."
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <span
            className={cn(
              "flex justify-center text-sm sm:text-base font-medium rounded-lg py-2 px-3 w-full sm:w-auto",
              isExceeded
                ? "bg-red-100 text-red-500"
                : "bg-gray-100 text-gray-500"
            )}
          >
            Tokens: {formatTokens(currentTokenCount)}/
            {formatTokens(MAX_TOKENS_PROMPT)}
          </span>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              onClick={handleOnClose}
              variant="outline"
              className="w-full text-sm sm:text-base sm:w-auto bg-gray-100 text-gray-500 hover:bg-gray-200/80 hover:text-gray-500 border-2 border-gray-200 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave({ ...prompt!, name, prompt: content })}
              disabled={isSaving}
              className="w-full text-sm sm:text-base sm:w-auto rounded-lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 mr-1 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PromptEditorDialog;
