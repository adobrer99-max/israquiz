# Validation round — what to send testers

Fifteen to twenty people who already know who they are voting for. §4.7 exists to
answer one question: does the instrument find the party a decided voter has
already chosen? If it does not, that is worth knowing before anyone else sees it.

**Recruit against the gaps.** Run the report once with whatever you have and read
the *Columns no tester validated* section. Sixteen parties and fifteen testers
means most columns get nobody, and the columns hardest to recruit for are the
ones carrying the most risk — Together has no published platform, Unity is 67%
unstated, the Haredi Public Party rests on press reporting. One tester for a
high-risk column is worth five for Likud.

The single most valuable reply in the round would be someone who declares **the
Haredi Public Party**. It is confirmed on the ballot, it is the newest and
thinnest column in the bank, twelve of its fifteen coded cells are inferred
rather than stated, and the whole column rests on one reading — that a reform
faction *within* ultra-Orthodox society disagrees with the haredi parties about
integration into the state and not about halakha. One member of that community
answering the religion-and-state block would test twelve cells at once. Nothing
else available comes close.

---

## The message to send

> I've built an English-language election compass for October and I need people
> who have already decided how they're voting to test whether it works.
>
> It takes about eight minutes: 48 statements, then five sliders. It asks who you
> plan to vote for **first**, so the result can't quietly talk you into agreeing
> with it.
>
> **Link:** https://adobrer99-max.github.io/israquiz/?validate=1
>
> At the end, open **"Your raw answers, as data"**, press **Copy to clipboard**,
> and send me what it copies. It has your initials on it and nothing else that
> identifies you — no name, no email, no IP address.
>
> The most useful thing you can send back is not the score. Near the bottom you
> will see **"Where you break with [your party]"** — the statements where your
> answer is the opposite of what I've recorded as your party's position. **If any
> of those look wrong to you, tell me.** That means I've miscoded your party, and
> you are the only person who can catch it.
>
> Say anything else you want about the wording. If a statement felt unanswerable,
> loaded, or like it was asking two things at once, that is a finding.

---

## Handling what comes back

Save each reply as its own `.json` file in this directory, named however you
like — `ys.json`, `01.json`. Then:

```bash
npx vite-node scripts/validation-report.ts validation/
```

The report is written to `validation/REPORT.md`.

**Everything in here except this file is gitignored, and must stay that way.** A
reply joins a named person to a declared vote and a complete answer vector.
That is exactly the join §6.5.1 keeps apart everywhere else in this project, and
it is special-category data under GDPR. Do not commit it, do not paste it into an
issue, do not put the report in the repository.

## Reading the report

**Recovery rate** is the headline and the least interesting number. A compass
that recovered everybody would mostly be telling you that decided voters know
their own minds.

**Cells to re-check** is the point. When several testers who declared the same
party all disagree with that party's coded position on one statement, the coding
is probably wrong. Cells marked **‡** were already flagged in the editorial notes
as doubtful — an independent hit on one of those is as close to proof as this
exercise gets, and should be acted on before the September revision rather than
after it.

**A tester whose party was suppressed** for low coverage is not a failure. The
coverage floor declining to rank a thinly-coded column is the floor working, and
the report counts those separately for that reason.
