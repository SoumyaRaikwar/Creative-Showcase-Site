import { Link } from "wouter";
import { useSeo } from "@/lib/seo";

export default function NotFound() {
  useSeo({ title: "Not found · Soumya Raikwar", description: "That page does not exist.", path: "/404" });
  return (
    <div className="wrap flex min-h-[70svh] flex-col items-start justify-center gap-4 pt-16">
      <p className="eyebrow">404</p>
      <h1 className="text-[2.2rem]">No span with that id.</h1>
      <p className="text-muted">The page you asked for is not here.</p>
      <Link href="/" className="btn btn-primary mt-2">Back to the start</Link>
    </div>
  );
}
