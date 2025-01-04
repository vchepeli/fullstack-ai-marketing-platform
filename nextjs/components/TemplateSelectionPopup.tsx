"use client";
import { Template } from "@/server/db/schema";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Link, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TemplateSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateId: string) => void;
}

function TemplateSelectionPopup({
  isOpen,
  onClose,
  onTemplateSelect,
}: TemplateSelectionPopupProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<Template[]>("/api/templates");
        setTemplates(response.data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        toast.error("Failed to fetch templates");
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a template to load prompts into your project
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center">
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-main mr-2" />
              <div className="text-main font-semibold text-sm">
                Loading Templates...
              </div>
            </>
          ) : templates.length === 0 ? (
            <div className="text-center">
              <p className="mb-4">
                You do not have any templates with existing prompts.
              </p>
              <Link href="/templates">
                <Button>Create Template</Button>
              </Link>
            </div>
          ) : (
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-full max-w-[280px] bg-white">
                <SelectValue placeholder="Select a Template" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {templates.map((template) => (
                  <SelectItem
                    key={template.id}
                    className="focus:bg-main focus:text-white truncate pr-2"
                    value={template.id}
                  >
                    <div className="truncate max-w-[250px]">
                      {template.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelectionPopup;
