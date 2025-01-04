import ProjectDetailView from "@/components/project-detail/ProjectDetailView";
import { getProject } from "@/server/queries";
import { notFound } from "next/navigation";
import React from "react";

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.projectId);

  if (!project) {
    return notFound();
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 mt-2">
      <ProjectDetailView project={project} />
    </div>
  );
}
