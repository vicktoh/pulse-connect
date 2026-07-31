"use client"

import { useRef, useState } from "react"
import { XIcon } from "lucide-react"
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { db } from "@/lib/firebase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LABS, SECTORS, type Sector } from "@/lib/pulse/labs"

const SECTOR_ITEMS = SECTORS.map((sector) => ({
  value: sector,
  label: LABS[sector].formLabel,
}))

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "",
  org: "",
  sector: null as Sector | null,
  observed: "",
  changed: "",
}

type FormShape = typeof EMPTY_FORM
type FieldErrors = Partial<Record<keyof FormShape, string>>

/** Mirrors the length and format limits enforced in firestore.rules. */
function validate(form: FormShape): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = "Please tell us your name."
  else if (form.name.trim().length > 80) errors.name = "Please keep this under 80 characters."

  if (!form.email.trim()) errors.email = "We need an email to confirm your submission."
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
    errors.email = "That does not look like an email address."

  if (!form.role.trim()) errors.role = "Please tell us your role."
  else if (form.role.trim().length > 80) errors.role = "Please keep this under 80 characters."

  if (!form.org.trim()) errors.org = "Please tell us your organisation."
  else if (form.org.trim().length > 120) errors.org = "Please keep this under 120 characters."

  if (!form.sector) errors.sector = "Please choose a sector."

  if (!form.observed.trim()) errors.observed = "Please describe what you observed."
  if (!form.changed.trim()) errors.changed = "Please tell us what changed it, or what could."

  return errors
}

export function SubmitDialog() {
  const { ensureAnonymous } = useFirebaseAuth()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormShape>(key: K, value: FormShape[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    // Clear the error as soon as the field is touched — correcting a mistake
    // should feel like progress, not like being nagged.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset once the exit animation has run.
      setTimeout(() => {
        setSubmitted(false)
        setForm(EMPTY_FORM)
        setErrors({})
        setSubmitError(null)
      }, 200)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    // Honeypot: a real person never fills a field they cannot see. Show the
    // success panel anyway so a bot learns nothing from the difference.
    if (honeypot.current?.value) {
      setSubmitted(true)
      return
    }

    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const visitor = await ensureAnonymous()
      // Generate the id up front so the submission and its private contact
      // document share it and can be written in one atomic batch — the rules
      // reject a submission whose contact doc is not created alongside it.
      const submissionRef = doc(collection(db, "submissions"))

      const batch = writeBatch(db)
      batch.set(submissionRef, {
        name: form.name.trim(),
        role: form.role.trim(),
        org: form.org.trim(),
        sector: form.sector,
        status: "received",
        moderation: "pending",
        observed: form.observed.trim(),
        changed: form.changed.trim(),
        supportCount: 0,
        ibpResponse: null,
        createdAt: serverTimestamp(),
        publishedAt: null,
        authorUid: visitor.uid,
      })
      batch.set(doc(db, "submissionContacts", submissionRef.id), {
        email: form.email.trim(),
        submissionId: submissionRef.id,
        authorUid: visitor.uid,
        createdAt: serverTimestamp(),
      })
      await batch.commit()

      setSubmitted(true)
    } catch (error) {
      console.error("PULSE submission failed:", error)
      setSubmitError(
        "We could not record your account just now. Please check your connection and try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="cta" size="cta" />}>
        Share What You Know
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-[calc(100%-2.5rem)] gap-0 overflow-y-auto rounded-[16px] bg-white p-0 ring-0 sm:max-w-[540px]"
      >
        {/* Header — the institution speaking, so the surface goes navy. */}
        <div className="gradient-rule relative bg-navy-midnight px-7 pt-6 pb-5">
          <div className="mb-2.5 text-[10px] font-bold tracking-[0.2em] text-amber uppercase">
            PULSE Community
          </div>
          <DialogTitle className="font-heading text-[22px] leading-[1.2] font-semibold text-white">
            Share what you know
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13px] leading-[1.6] text-on-navy">
            Two questions. Two minutes. What you have seen, lived through, or
            documented belongs here.
          </DialogDescription>
          <DialogClose
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </DialogClose>
        </div>

        {submitted ? (
          <div className="px-7 py-10 text-center">
            <div className="mb-4 text-[44px]">📬</div>
            <div className="mb-3 font-heading text-2xl font-semibold text-ink">
              Received. Thank you.
            </div>
            <p className="mb-6 text-sm leading-[1.75] text-grey">
              We will review what you have shared and aim to publish it within
              48 hours. You will receive an email shortly to confirm.
              <br />
              <br />
              If your account is cited by IBP or referenced in future PULSE
              work, we will reach out personally.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-paper-3 px-4 py-2 text-xs font-bold text-grey">
              <span>●</span> Status: Under Review
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-7 pt-6 pb-7">
            <div className="mb-5 rounded-md border-[1.5px] border-line bg-paper-2 p-4">
              <div className="mb-2 text-[10px] font-bold tracking-[0.14em] text-grey-light uppercase">
                What we are asking for
              </div>
              <p className="text-[13px] leading-[1.65] text-grey">
                Tell us what you observed in the public finance chain: a
                breakdown, a gap, a moment where funds did not reach people.
                Tell us what changed it or could change it. We will review your
                account within 48 hours and publish it to the community.
              </p>
            </div>

            {/* Honeypot. A real person never fills a field they cannot see. */}
            <input
              ref={honeypot}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" htmlFor="f-name" error={errors.name}>
                <Input
                  id="f-name"
                  aria-invalid={Boolean(errors.name)}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Amina Okafor"
                />
              </Field>
              <Field label="Your email" htmlFor="f-email" error={errors.email}>
                <Input
                  id="f-email"
                  aria-invalid={Boolean(errors.email)}
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@organisation.org"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your role" htmlFor="f-role" error={errors.role}>
                <Input
                  id="f-role"
                  aria-invalid={Boolean(errors.role)}
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="e.g. Programme Officer"
                />
              </Field>
              <Field label="Organisation" htmlFor="f-org" error={errors.org}>
                <Input
                  id="f-org"
                  aria-invalid={Boolean(errors.org)}
                  value={form.org}
                  onChange={(e) => set("org", e.target.value)}
                  placeholder="e.g. IBP Nigeria"
                />
              </Field>
            </div>

            <Field
              label="Which sector does this relate to?"
              htmlFor="f-sector"
              error={errors.sector}
            >
              <Select
                items={SECTOR_ITEMS}
                value={form.sector}
                onValueChange={(value) => set("sector", value as Sector)}
              >
                <SelectTrigger id="f-sector" aria-invalid={Boolean(errors.sector)}>
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTOR_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="What did you observe?"
              qualifier="(max 400 characters)"
              htmlFor="f-observed"
              error={errors.observed}
              hint={
                'Example: "PHC drugs were approved in the 2024 Kano State budget and procured centrally, but 60% never arrived at facility level due to a breakdown in the last-mile distribution contract."'
              }
            >
              <Textarea
                id="f-observed"
                aria-invalid={Boolean(errors.observed)}
                maxLength={400}
                value={form.observed}
                onChange={(e) => set("observed", e.target.value)}
                placeholder="Describe the breakdown, gap, or failure in the public finance chain. Be specific: what sector, which level of government, what happened to the funds or services."
              />
            </Field>

            <Field
              label="What changed it or could change it?"
              qualifier="(max 400 characters)"
              htmlFor="f-changed"
              error={errors.changed}
              hint={
                'Example: "When the LGA health committee began publishing monthly distribution records publicly, the missing drugs dropped from 60% to 18% within two quarters."'
              }
            >
              <Textarea
                id="f-changed"
                aria-invalid={Boolean(errors.changed)}
                maxLength={400}
                value={form.changed}
                onChange={(e) => set("changed", e.target.value)}
                placeholder="What intervention, policy change, community action, or system fix made a difference, or what do you believe would."
              />
            </Field>

            <div className="mb-5 flex gap-2.5 rounded-lg bg-paper-3 px-3.5 py-3 text-xs leading-[1.6] text-grey">
              <span className="shrink-0 text-sm">🔒</span>
              <span>
                Your email is used to confirm your submission and notify you
                when it is published. It will not appear publicly. Your name,
                role, and organisation will be visible alongside your account.
              </span>
            </div>

            {submitError ? (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-paper-3 px-3.5 py-3 text-[12.5px] leading-[1.6] text-grey"
              >
                {submitError}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="cta"
              disabled={submitting}
              className="w-full py-3.5 text-xs"
            >
              {submitting ? "Sending…" : "Submit for Review"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  qualifier,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string
  qualifier?: string
  hint?: string
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <Label htmlFor={htmlFor} className="mb-[7px]">
        {label}
        {qualifier ? <span>{qualifier}</span> : null}
      </Label>
      {children}
      {/* The error takes the hint's slot rather than adding a row, so the form
          does not reflow as fields are validated. It sits in Deep Ink for
          weight — not red, which DESIGN.md reserves for the Health sector. */}
      {error ? (
        <p className="mt-[5px] text-[11.5px] leading-[1.5] font-semibold text-ink">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-[5px] text-[11.5px] leading-[1.5] text-grey-light">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
