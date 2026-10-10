import { Link } from "wouter";
import { profile } from "@/lib/profile";
import Monogram from "./Monogram";

export default function Footer() {
  const id = profile.identity;
  return (
    <footer className="border-t border-line">
      <div className="wrap flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Monogram size={26} />
          <div className="text-[13px] leading-tight">
            <p className="font-medium">{id.name}</p>
            <p className="text-muted">Bhopal, India · {new Date().getFullYear()}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted">
          <li><Link href="/work">Work</Link></li>
          <li><Link href="/writing">Writing</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><a href={id.github} target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a href={id.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
          <li><a href={id.resume}>Resume (PDF)</a></li>
          <li><a href="https://github.com/SoumyaRaikwar/Creative-Showcase-Site" target="_blank" rel="noreferrer">Site source</a></li>
        </ul>
      </div>
    </footer>
  );
}
