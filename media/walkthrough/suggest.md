# Suggest exact code changes

For action-oriented categories (Bug / Refactor / Nit / Suggestion), the comment editor shows an **Insert suggestion** chip next to the label.

Click it. A fenced `suggestion` block is inserted at your cursor, prefilled with the captured snippet:

````markdown
```suggestion
<your snippet here, edit it>
```
````

The agent receives your exact patch alongside your comment.

## Cross-file references

Type `@` anywhere in the comment. VS Code's QuickPick opens with workspace files. Pick one — the relative path is inserted at the cursor. Agents like Claude Code read `@path` as native context.
