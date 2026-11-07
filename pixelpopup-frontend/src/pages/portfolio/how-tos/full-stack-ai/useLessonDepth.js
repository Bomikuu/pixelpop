import { useEffect, useState } from "react";

const loaders = {
  backend: () => import("./lessonDepth/backend"),
  dsa: () => import("./lessonDepth/dsa"),
  hld: () => import("./lessonDepth/hld"),
  lld: () => import("./lessonDepth/lld"),
  ai: () => import("./lessonDepth/ai"),
  devops: () => import("./lessonDepth/devops"),
  security: () => import("./lessonDepth/security"),
};
const requests = new Map();
const content = new Map();

export default function useLessonDepth(categoryId, lessonId) {
  const [state, setState] = useState(() => ({ categoryId, data: content.get(categoryId), error: false }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (content.has(categoryId)) {
      setState({ categoryId, data: content.get(categoryId), error: false });
      return () => { active = false; };
    }
    setState({ categoryId, data: null, error: false });
    if (!requests.has(categoryId)) {
      const request = loaders[categoryId]().then((module) => {
        content.set(categoryId, module.default);
        return module.default;
      }).catch((error) => { requests.delete(categoryId); throw error; });
      requests.set(categoryId, request);
    }
    requests.get(categoryId).then((data) => {
      if (active) setState({ categoryId, data, error: false });
    }).catch(() => {
      if (active) setState({ categoryId, data: null, error: true });
    });
    return () => { active = false; };
  }, [categoryId, attempt]);
  const current = state.categoryId === categoryId ? state : { data: content.get(categoryId), error: false };
  return { depth: current.data?.[lessonId], loading: !current.data && !current.error, error: current.error, retry: () => setAttempt((value) => value + 1) };
}
