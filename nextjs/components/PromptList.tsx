import React from "react";
import PromptContainerCard from "./PromptContainerCard";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { CommonPrompt } from "@/interfaces/CommonPrompt";

interface PromptListProps {
  prompts: CommonPrompt[];
  isLoading: boolean;
  setDeletePromptId: React.Dispatch<React.SetStateAction<string | null>>;
}

function PromptList({
  prompts,
  isLoading,
  setDeletePromptId,
}: PromptListProps) {
  const router = useRouter();

  const handleOnClick = (promptId: string) => {
    // TODO: FUTURE US, UPDATE TO SUPPORT TEMPLATE LIST AS WELL
    router.push(`?tab=prompts&promptId=${promptId}`);
  };

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-12 md:h-20 w-full rounded-xl mb-4" />
        <Skeleton className="h-12 md:h-20 w-full rounded-xl" />
      </>
    );
  }

  if (prompts.length === 0) {
    return <div>No prompts yet.</div>;
  }

  return (
    <div className="space-y-6">
      {prompts.map((prompt) => (
        <PromptContainerCard
          key={prompt.id}
          prompt={prompt}
          handleOnDelete={() => setDeletePromptId(prompt.id)}
          handleOnClick={handleOnClick}
        />
      ))}
    </div>
  );
}

export default PromptList;
