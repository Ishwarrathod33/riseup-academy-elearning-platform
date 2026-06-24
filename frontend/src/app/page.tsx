import { HomePage, type HomeCourse } from "@/features/home";
import { API_BASE_URL } from "@/lib/api";

export default async function HomePageRoute() {
  const courses: HomeCourse[] = await fetch(`${API_BASE_URL}/api/courses`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.courses ?? [])
    .catch(() => []);

  return <HomePage courses={courses} />;
}
