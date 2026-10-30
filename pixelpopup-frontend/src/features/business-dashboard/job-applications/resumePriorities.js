export function resumePriorities(record, assessmentDirty = false) {
  const assessment = record.artifacts?.find((item) => item.kind === "assessment");
  const requirements = record.requirement_decisions?.length ? record.requirement_decisions : assessment?.requirements || [];
  const gaps = requirements.map((row, index) => ({
    ...row, index,
    notMet: row.applicant_decision?.decision === "not_met" && !row.applicant_decision.stale,
  })).filter((row) => row.status !== "supported" || row.notMet || row.evidence_warning || row.applicant_decision?.stale)
    .sort((a, b) => {
      const importance = { required: 0, preferred: 1, unspecified: 2 };
      return (importance[a.importance] ?? 2) - (importance[b.importance] ?? 2) || a.index - b.index;
    });
  return { priorities: gaps.slice(0, 3), count: gaps.length, stale: Boolean(assessmentDirty || assessment?.requirements_stale), hasComparison: requirements.length > 0 };
}

export function confirmedResumeProjects(profile) {
  return (profile?.sources_confirmed ? profile.project_experience || [] : [])
    .filter((project) => project.status === "confirmed")
    .map((project, index) => ({ key: String(index), project }));
}

export function resumePromptDefaults(record, profile, assessmentDirty = false) {
  const { priorities, stale } = resumePriorities(record, assessmentDirty);
  const focus = !stale && priorities.length
    ? `Prioritize these posting requirements: ${priorities.map((row) => row.text.slice(0, 150)).join("; ")}. Use confirmed evidence; ask about missing details in reviewNotes.`.slice(0, 600)
    : "";
  const tokens = (value) => new Set((value.toLowerCase().match(/[a-z0-9][a-z0-9+#.]*/g) || []).map((word) => word.replace(/\.+$/, "")));
  const posting = tokens(`${record.role || ""} ${record.posting || ""}`);
  const priorityWords = tokens(stale ? "" : priorities.map((row) => row.text).join(" "));
  const projectKeys = confirmedResumeProjects(profile).map(({ key, project }) => ({
    key,
    score: [project.name, project.system_type, ...(project.tools || [])].filter(Boolean).reduce((score, term) => {
      const words = [...tokens(term)].filter((word) => word.length >= 3 || ["go", "c#", "c++"].includes(word));
      return score + words.filter((word) => posting.has(word)).length + words.filter((word) => priorityWords.has(word)).length * 2;
    }, 0),
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.key);
  return { emphasis: "strong", detail: "compact", experience: "confirmed", focus, projectKeys };
}
