# Manage and export

Open the **Annotations** activity bar (speech-bubble icon). Badge shows open count.

## Filter and group

- Status filter: Open · Stale · Resolved · All
- Group by: file · category · status
- Toggles: *Current file only* · *Include hunk*

## Bulk actions

Select annotations (or **Select all**), then:

- **Copy** — clipboard, in Markdown / JSON / CSV
- **Export** — save to `.annotate-for-agent/exports/`
- **Resolve** / **Reopen**
- **Delete**

## Stale detection

When the underlying code changes, annotations mark themselves stale. Click an annotation to review and either re-resolve, edit, or delete.

## What the agent sees

Markdown export per annotation:

````markdown
### path/to/file.ts:11-14
<snippet>

Feedback: <comment>
````

JSON / CSV variants available for tooling pipelines.
