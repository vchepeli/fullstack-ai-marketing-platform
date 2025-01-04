"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatTokens, getPromptTokenCount } from "@/utils/token-helper";
import { MAX_TOKENS_PROMPT } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CommonPrompt } from "@/interfaces/CommonPrompt";

interface PromptContainerCardProps {
  prompt: CommonPrompt;
  handleOnDelete: () => void;
  handleOnClick: (promptId: string) => void;
}

function PromptContainerCard({
  handleOnDelete,
  handleOnClick,
  prompt,
}: PromptContainerCardProps) {
  const [isExceeded, setIsExceeded] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    const newTokenCount = getPromptTokenCount(prompt.prompt || "");
    setTokenCount(newTokenCount);
    setIsExceeded(newTokenCount > MAX_TOKENS_PROMPT);
  }, [prompt]);

  return (
    <Card
      className="border border-gray-200 bg-gray-50 rounded-2xl shadow-sm hover:border-main hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer"
      onClick={() => handleOnClick(prompt.id)}
    >
      <CardContent className="p-4 sm:p-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-grow min-w-0 space-x-2">
            <MessageSquare
              className="h-4 w-4 sm:h-6 sm:w-6 text-main flex-shrink-0"
              strokeWidth={3}
            />
            <h3 className="font-semibold text-base sm:text-lg text-main truncate">
              {prompt.name}
            </h3>

            {!prompt.prompt && (
              <div className="bg-yellow-100 text-yellow-700 text-xs rounded-md px-1 py-0.5 sm:px-2 sm:py-1">
                <span className="hidden sm:inline">Prompt empty</span>
              </div>
            )}

            {isExceeded && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="bg-red-100 text-red-500 text-xs rounded-md px-1 py-0.5 sm:px-2 sm:py-1">
                      <span className="hidden sm:inline">
                        Token Count Exceeded
                      </span>
                      <span className="sm:hidden">Exceeded</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs text-gray-600">
                      Current Tokens: {formatTokens(tokenCount)}, Maximum:{" "}
                      {formatTokens(MAX_TOKENS_PROMPT)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex space-x-1 flex-shrink-0 ml-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleOnDelete();
              }}
              size="sm"
              variant="ghost"
              className="text-main hover:text-red-600 hover:bg-red-50 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PromptContainerCard;
