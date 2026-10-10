import { useState, type FormEvent } from "react";
import { useSendMessage } from "@workspace/api-client-react";
import { profile } from "@/lib/profile";
import CopyButton from "./CopyButton";
import { Section, SectionHead } from "./Section";

const EMPTY = { name: "", email: "", subject: "", body: "", website: "" };

export default function Contact() {
  const id = profile.identity;
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState<string | null>(null);
  const mutation = useSendMessage({
    mutation: {
      onSuccess: (res) => {
        setSent(res.message);
        setForm(EMPTY);
      },
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: form });
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const errorMessage = (() => {
    if (!mutation.isError) return null;
    const err = mutation.error as { data?: { message?: string }; status?: number } | null;
    return err?.data?.message ?? "Could not send. Email me directly instead.";
  })();

  return (
    <Section id="contact">
      <SectionHead eyebrow="Contact" title="Plain contact." lede={id.availability} />
      <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <dl className="reveal grid gap-5 self-start">
          <div className="flex flex-wrap items-center gap-3">
            <dt className="w-20 font-mono text-[11.5px] uppercase tracking-wider text-muted">Email</dt>
            <dd className="flex items-center gap-3">
              <a href={`mailto:${id.email}`} className="font-mono text-[15px]">{id.email}</a>
              <CopyButton value={id.email} />
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <dt className="w-20 font-mono text-[11.5px] uppercase tracking-wider text-muted">GitHub</dt>
            <dd><a href={id.github} target="_blank" rel="noreferrer" className="font-mono text-[15px]">github.com/{id.githubUser}</a></dd>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <dt className="w-20 font-mono text-[11.5px] uppercase tracking-wider text-muted">LinkedIn</dt>
            <dd><a href={id.linkedin} target="_blank" rel="noreferrer" className="font-mono text-[15px]">in/soumya-raikwar</a></dd>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <dt className="w-20 font-mono text-[11.5px] uppercase tracking-wider text-muted">Resume</dt>
            <dd><a href={id.resume} className="font-mono text-[15px]">resume.pdf</a></dd>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <dt className="w-20 font-mono text-[11.5px] uppercase tracking-wider text-muted">Where</dt>
            <dd className="text-[15px] text-muted">{id.location} · UTC+5:30</dd>
          </div>
        </dl>

        <div className="reveal panel p-5 md:p-7">
          {sent ? (
            <div className="py-6 text-center" role="status">
              <p className="font-display text-xl font-semibold">Sent.</p>
              <p className="mt-2 text-muted">{sent}</p>
              <button type="button" className="btn mt-6" onClick={() => setSent(null)}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4" aria-label="Contact form">
              <p className="text-[13.5px] text-muted">Lands in my Gmail inbox. I reply from there.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-[13px] text-muted">
                  Name
                  <input className="field" name="name" required maxLength={120} autoComplete="name" value={form.name} onChange={set("name")} />
                </label>
                <label className="grid gap-1.5 text-[13px] text-muted">
                  Email
                  <input className="field" name="email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={set("email")} />
                </label>
              </div>
              <label className="grid gap-1.5 text-[13px] text-muted">
                Subject
                <input className="field" name="subject" required maxLength={200} value={form.subject} onChange={set("subject")} />
              </label>
              <label className="grid gap-1.5 text-[13px] text-muted">
                Message
                <textarea className="field min-h-[140px] resize-y" name="body" required maxLength={5000} value={form.body} onChange={set("body")} />
              </label>
              {/* Honeypot: hidden from people, filled by bots */}
              <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? "Sending…" : "Send message"}
                </button>
                {errorMessage && (
                  <p className="text-[13.5px] text-err" role="alert">
                    {errorMessage}{" "}
                    <a className="underline" href={`mailto:${id.email}?subject=${encodeURIComponent(form.subject)}`}>
                      Open mail app
                    </a>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
