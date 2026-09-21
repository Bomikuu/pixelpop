import { useRef, useState } from "react";

export default function useAstaProjectDialog() {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const projectDialogOpenerRef = useRef(null);

  function openProjectDialog(event) {
    projectDialogOpenerRef.current = event?.currentTarget || null;
    setProjectDialogOpen(true);
  }

  function closeProjectDialog() {
    setProjectDialogOpen(false);
    requestAnimationFrame(() => projectDialogOpenerRef.current?.focus());
  }

  return { projectDialogOpen, openProjectDialog, closeProjectDialog };
}
