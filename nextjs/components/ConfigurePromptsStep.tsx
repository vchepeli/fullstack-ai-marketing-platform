"use client";

import React, { useEffect, useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import ConfigurePromptsStepHeader from "./ConfigurePromptsStepHeader";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import PromptList from "./PromptList";
import PromptEditorDialog from "./PromptEditorDialog";
import { CommonPrompt } from "@/interfaces/CommonPrompt";
import TemplateSelectionPopup from "./TemplateSelectionPopup";

interface ConfigurePromptsStepProps {
  projectId: string;
}

function ConfigurePromptsStep({ projectId }: ConfigurePromptsStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prompts, setPrompts] = useState<CommonPrompt[]>([]);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<CommonPrompt | null>(
    null
  );

  console.log("DELETE PROMPT ID", deletePromptId);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const promptId = searchParams.get("promptId");
    if (promptId) {
      setSelectedPrompt(prompts.find((p) => p.id === promptId) || null);
    } else {
      setSelectedPrompt(null);
    }
  }, [prompts, searchParams]);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<CommonPrompt[]>(
          `/api/projects/${projectId}/prompts`
        );
        setPrompts(response.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch prompts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [projectId]);

  const handlePromptCreate = async () => {
    setIsCreatingPrompt(true);

    try {
      const response = await axios.post<CommonPrompt>(
        `/api/projects/${projectId}/prompts`,
        {
          name: "New Prompt",
          prompt: "",
          order: prompts.length,
          tokenCount: 0,
        }
      );

      const newPrompt = response.data;
      setPrompts((prev) => [...prev, newPrompt]);

      router.push(`?tab=prompts&promptId=${newPrompt.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create prompt");
    } finally {
      setIsCreatingPrompt(false);
    }
  };

  const handlePromptDelete = async (promptId: string) => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `/api/projects/${projectId}/prompts?promptId=${promptId}`
      );
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete prompt");
    } finally {
      setIsDeleting(false);
      setDeletePromptId(null);
    }
  };

  const handlePromptUpdate = async (prompt: CommonPrompt) => {
    setIsSaving(true);
    try {
      const response = await axios.patch(
        `/api/projects/${projectId}/prompts`,
        prompt
      );

      setPrompts((prevPrompts) =>
        prevPrompts.map((p) => (p.id === prompt.id ? response.data : p))
      );
      toast.success("Prompt updated successfully");
      handleOnClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOnClose = () => {
    setSelectedPrompt(null);
    router.push("?tab=prompts");
  };

  const handleTemplateSelect = async (templateId: string) => {
    setIsImportingTemplate(true);
    try {
      const response = await axios.post<CommonPrompt[]>(
        `/api/projects/${projectId}/import-template`,
        { templateId }
      );
      setPrompts((prev) => [...prev, ...response.data]);
      toast.success("Template imported successfully");
    } catch (error) {
      console.error("Failed to import template prompts", error);
      toast.error("Failed to import template");
    } finally {
      setIsImportingTemplate(false);
      setIsTemplatePopupOpen(false);
    }
  };

  return (
    <div className="space-y-4 md:space-x-6">
      <ConfigurePromptsStepHeader
        isCreatingPrompt={isCreatingPrompt}
        handlePromptCreate={handlePromptCreate}
        isImportingTemplate={isImportingTemplate}
        setIsTemplatePopupOpen={setIsTemplatePopupOpen}
      />
      <PromptList
        prompts={prompts}
        isLoading={isLoading}
        setDeletePromptId={setDeletePromptId}
      />
      <ConfirmationModal
        isOpen={!!deletePromptId}
        onClose={() => setDeletePromptId(null)}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
        onConfirm={() => deletePromptId && handlePromptDelete(deletePromptId)}
        isLoading={isDeleting}
      />
      <PromptEditorDialog
        isOpen={!!selectedPrompt}
        prompt={selectedPrompt}
        handleOnClose={handleOnClose}
        isSaving={isSaving}
        handleSave={handlePromptUpdate}
      />
      <TemplateSelectionPopup
        isOpen={isTemplatePopupOpen}
        onClose={() => setIsTemplatePopupOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}

export default ConfigurePromptsStep;
