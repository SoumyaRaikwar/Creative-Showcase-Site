import { Link } from "wouter";
import Hero from "@/components/three/Hero";
import ServiceGraph from "@/components/three/ServiceGraph";
import Contact from "@/components/Contact";
import PrRows from "@/components/github/PrRows";
import { usePrs } from "@/components/github/usePrs";
import { Section, SectionHead } from "@/components/Section";
import { narrative, profile, prUrl, issueUrl, shortRepo } from "@/lib/profile";
import { serviceColorVar } from "@/lib/trace";
import { posts } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";
import { useSeo, ROUTE_SEO } from "@/lib/seo";

function Numbers() {
  const prs = usePrs();
  const live: Record<string, string> = {
    mergedTotal: String(prs.mergedTotal),
    mergedCncf: String(prs.mergedJaegerOtel),
  };
  return (
    <section aria-label="Headline numbers" className="border-y border-line">
      <div className="wrap grid grid-cols-2 md:grid-cols-4">
        {profile.numbers.map((n, i) => (
          <div key={n.label} className={`reveal py-7 md:py-8 ${i > 0 ? "md:border-l md:border-line md:pl-6" : ""} ${i % 2 === 1 ? "border-l border-line pl-5 md:pl-6" : ""}`}>
            <p className="font-display text-[2rem] font-semibold leading-none tnum md:text-[2.4rem]">
              {"liveKey" in n && n.liveKey && live[n.liveKey] ? live[n.liveKey] : n.value}
            </p>
            <p className="mt-2 text-[14.5px] font-medium">{n.label}</p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {n.sub}
              {"liveKey" in n && n.liveKey && prs.live ? " · live" : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Narrative() {
  return (
    <Section id="work">
      <SectionHead
        eyebrow="Featured work · Jaeger"
        title="The Jaeger build, in order."
        lede={`${profile.experience.program}, ${profile.experience.period}. Mentors: ${profile.experience.mentors.join(" and ")}. ${profile.experience.summary}`}
        aside={<Link href="/work" className="btn">All pull requests</Link>}
      />
      <ol className="grid gap-px border border-line bg-line">
        {narrative.map((item, i) => (
          <li key={item.id} id={`n-${item.id}`} className="reveal scroll-mt-24 bg-ground">
            <article className="grid gap-5 p-5 md:grid-cols-[72px_minmax(0,1fr)_220px] md:gap-8 md:p-7">
              <div className="flex items-center gap-3 md:block">
                <span className="font-mono text-[12px] text-faint tnum">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-0 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted md:mt-3">
                  <span className="inline-block h-2 w-2 rounded-[1px]" style={{ background: "var(--accent)" }} />
                  {item.span}
                </span>
              </div>
              <div>
                <h3 className="text-[1.35rem] md:text-[1.5rem]">{item.title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-text">{item.summary}</p>
                {item.detail.length > 0 && (
                  <ul className="mt-3 grid gap-1.5 text-[14.5px] leading-relaxed text-muted">
                    {item.detail.map((d) => (
                      <li key={d} className="flex gap-2.5">
                        <span className="mt-[9px] h-px w-3 shrink-0 bg-line-strong" aria-hidden="true" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ul className="flex flex-wrap content-start gap-2 md:justify-end" aria-label="Links">
                {item.prs.map((pr) => (
                  <li key={`${pr.repo}#${pr.number}`}>
                    <a href={prUrl(pr)} target="_blank" rel="noreferrer" className="tag hover:border-accent hover:text-text">
                      {shortRepo(pr.repo)} #{pr.number}
                    </a>
                  </li>
                ))}
                {item.issue && (
                  <li>
                    <a href={issueUrl(item.issue)} target="_blank" rel="noreferrer" className="tag hover:border-accent hover:text-text">
                      issue #{item.issue.number}
                    </a>
                  </li>
                )}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function OpenSource() {
  const prs = usePrs();
  const countFor = (repo: string) => prs.prs.filter((p) => p.repo === repo && p.state === "merged").length;
  const recent = prs.prs.filter((p) => p.state === "merged").slice(0, 6);
  return (
    <Section id="open-source" className="border-t border-line">
      <SectionHead
        eyebrow="Open source"
        title="Jaeger, OpenTelemetry, and the rest."
        lede={`${prs.mergedTotal} merged pull requests in ${prs.repos.length} repositories, ${prs.mergedCncf} of them in CNCF projects. Counted ${prs.live ? "live from GitHub" : `on ${formatDate(prs.fetchedAt)}`}.`}
        aside={<Link href="/work" className="btn">Every PR, with timing</Link>}
      />
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {profile.openSource.map((r) => (
          <article key={r.repo} className="reveal bg-ground p-5">
            <div className="flex items-start justify-between gap-3">
              <a href={`https://github.com/${r.repo}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-[13px]">
                <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: serviceColorVar(r.repo) }} />
                {r.repo}
              </a>
              <span className="font-mono text-[12px] text-muted tnum">{countFor(r.repo)} merged</span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-faint">{r.org} · {r.lang}</p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{r.summary}</p>
          </article>
        ))}
      </div>
      <div className="reveal mt-10">
        <p className="eyebrow mb-4">Most recent merges</p>
        <PrRows prs={recent} compact />
      </div>
    </Section>
  );
}

function Project() {
  const p = profile.projects[0];
  return (
    <Section id="projects" className="border-t border-line">
      <SectionHead eyebrow="Project" title={p.name} lede={p.tagline} aside={<a href={p.github} target="_blank" rel="noreferrer" className="btn">Source on GitHub</a>} />
      <div className="reveal grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="text-[17px] leading-relaxed">{p.summary}</p>
          <ul className="mt-4 grid gap-1.5 text-[15px] leading-relaxed text-muted">
            {p.detail.map((d) => (
              <li key={d} className="flex gap-2.5">
                <span className="mt-[11px] h-px w-3 shrink-0 bg-line-strong" aria-hidden="true" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-5">
          <p className="eyebrow mb-3">Stack</p>
          <ul className="flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <li key={s} className="tag">{s}</li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-[11.5px] leading-relaxed text-faint">
            repo → clone → chunk (language + symbol aware) → embed → ChromaDB → LangGraph agent → answer / Mermaid
          </p>
        </div>
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section id="skills" className="border-t border-line">
      <SectionHead eyebrow="Skills" title="What I work with." />
      <dl className="reveal divide-y divide-line border-y border-line">
        {profile.skills.map((g) => (
          <div key={g.group} className="grid gap-2 py-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6">
            <dt className="font-mono text-[12px] uppercase tracking-wider text-muted">{g.group}</dt>
            <dd className="text-[15px] leading-relaxed">{g.items.join(" · ")}</dd>
          </div>
        ))}
      </dl>
      <div className="reveal mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Education</p>
          {profile.education.map((e) => (
            <p key={e.school} className="text-[15px]">
              {e.degree}, {e.school} <span className="text-muted">· {e.when}</span>
            </p>
          ))}
        </div>
        <div>
          <p className="eyebrow mb-3">Certifications</p>
          <ul className="grid gap-1">
            {profile.certifications.map((c) => (
              <li key={c.name} className="text-[15px]">
                <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  {c.name}
                </a>{" "}
                <span className="text-muted">· {c.org} · {c.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function About() {
  const a = profile.about;
  return (
    <Section id="about" className="border-t border-line">
      <SectionHead eyebrow="About" title="One span, inspected." lede="The same view Jaeger gives a span: tags, then the log of what happened." />
      <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="reveal grid gap-5">
          {a.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-[17px] leading-relaxed">{p}</p>
          ))}
          <div className="panel mt-2 grid place-items-center border-dashed p-6 text-center" aria-label="Photo placeholder">
            <p className="font-mono text-[11.5px] text-faint">
              TODO: photo
              <br />
              slot reserved · the monogram is the only mark until then
            </p>
          </div>
        </div>
        <div className="reveal panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[12px]">
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-[1px] align-middle" style={{ background: "var(--accent)" }} /> soumya-raikwar
              <span className="text-faint"> · span</span>
            </span>
            <span className="text-faint tnum">2021 → now</span>
          </div>
          <div className="px-4 py-3">
            <p className="eyebrow mb-2">Tags</p>
            <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1 font-mono text-[12.5px]">
              {a.tags.map((t) => (
                <div key={t.key} className="contents">
                  <dt className="text-muted">{t.key}</dt>
                  <dd className="text-text">{t.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="border-t border-line px-4 py-3">
            <p className="eyebrow mb-2">Logs</p>
            <ol className="grid gap-2">
              {a.logs.map((l) => (
                <li key={l.at + l.event.slice(0, 8)} className="grid grid-cols-[88px_1fr] gap-3 text-[13.5px] leading-relaxed">
                  <span className="font-mono text-[12px] text-muted tnum">{l.at}</span>
                  <span>{l.event}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}

function WritingTeasers() {
  const article = profile.writing[0];
  return (
    <Section id="writing" className="border-t border-line">
      <SectionHead eyebrow="Writing" title="Notes from the work." aside={<Link href="/writing" className="btn">All writing</Link>} />
      <div className="grid gap-px border border-line bg-line md:grid-cols-2">
        <a href={article.url} target="_blank" rel="noreferrer" className="reveal group bg-ground p-5">
          <img src={article.cover} alt="" width={1040} height={586} loading="lazy" className="border border-line" />
          <p className="eyebrow mt-5">LinkedIn article · {article.year}</p>
          <h3 className="mt-3 text-[1.3rem] group-hover:text-accent">{article.title}</h3>
          <p className="mt-2 text-[14.5px] text-muted">{article.subtitle}</p>
        </a>
        <div className="reveal bg-ground p-5">
          <p className="eyebrow">Blog</p>
          <ul className="mt-3 divide-y divide-line">
            {posts.slice(0, 3).map((p) => (
              <li key={p.slug} className="py-3">
                <Link href={`/blog/${p.slug}`} className="group block">
                  <h3 className="text-[1.1rem] group-hover:text-accent">{p.title}</h3>
                  <p className="mt-1 text-[14px] text-muted">{p.excerpt}</p>
                  <p className="mt-2 font-mono text-[11.5px] text-faint">
                    {formatDate(p.date)} · {p.readingMinutes} min
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export default function Home() {
  useSeo(ROUTE_SEO["/"]);
  useReveal();
  return (
    <>
      <Hero />
      <Numbers />
      <Narrative />
      <OpenSource />
      <Project />
      <Skills />
      <About />
      <ServiceGraph />
      <WritingTeasers />
      <Contact />
    </>
  );
}
