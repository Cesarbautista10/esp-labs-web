import type { Rich } from "@/domain/lesson";
import { type Block, type FileAnalysis, ownerOf, type Statement } from "./analyze";
import { lineText } from "./tokenize";

// Tap a line, read what it does. Rules look at the statement a line belongs to and say it in
// plain words; the glossary then explains each C++ word or library call on the line. Rules are
// ordered from specific to general, and every line gets *something*, so nothing stays a mystery.

/** Where a function or type is defined in the lab, so a call can point at it. */
export interface Definition {
  readonly path: string;
  readonly line: number;
  readonly kind: Block["kind"];
}

export interface ExplainContext {
  readonly file: FileAnalysis;
  /** Functions and types defined anywhere in the lab, by name. */
  readonly defined: ReadonlyMap<string, Definition>;
  /** Short known meanings for calls and headers (from the glossary), by call or header name. */
  readonly known?: (name: string) => Rich | undefined;
}

export interface LineExplanation {
  readonly text: Rich;
  /** Set for a line that continues a statement started earlier (0-based line). */
  readonly continues?: number;
  /** A function or type defined in the lab that this line uses (for "go to definition"). */
  readonly jump?: { readonly name: string } & Definition;
}

const MAX = 48;
/** Objects that come with the framework: a method call on them never means one of our functions. */
const FRAMEWORK_OBJECTS = new Set([
  "Serial",
  "WiFi",
  "SPI",
  "Wire",
  "ESP",
  "MDNS",
  "NimBLEDevice",
  "Update",
  "LittleFS",
  "std",
]);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** Inline code, shortened so a sentence stays readable. */
export const code = (s: string) => {
  const t = s.trim();
  return `<code>${esc(t.length > MAX ? `${t.slice(0, MAX - 1)}…` : t)}</code>`;
};

const SPECIAL_FUNCTIONS: Readonly<Record<string, Rich>> = {
  setup: `Starts ${code("setup()")}: it runs <b>once</b>, right after the board powers up or resets. Getting things ready goes here.`,
  loop: `Starts ${code("loop()")}: after setup, the board runs it <b>again and again, forever</b>. Everything the program keeps doing lives here.`,
  main: `Starts ${code("main()")}: where the program begins.`,
};

const CLOSE: Partial<Record<Block["kind"], (b: Block) => Rich>> = {
  function: (b) =>
    b.name === "setup" && b.depth === 0
      ? `End of ${code("setup()")}: next, the board starts running ${code("loop()")}.`
      : b.name === "loop" && b.depth === 0
        ? `End of ${code("loop()")}: the board jumps straight back to the top of ${code("loop()")} and runs it again.`
        : `End of ${code(`${b.name}()`)}: when the board gets here, it goes back to whoever called it.`,
  namespace: (b) =>
    b.name
      ? `End of the ${code(b.name)} group of names.`
      : "End of the private section of this file.",
  class: (b) => `End of the ${code(b.name)} class.`,
  struct: (b) => `End of the ${code(b.name)} description.`,
  enum: (b) => `End of the list of ${code(b.name)} values.`,
  if: () => "End of the lines that run only when the check above was true.",
  else: () => `End of the ${code("else")} part.`,
  for: () => "End of the loop: go back up for the next round.",
  while: () => "End of the loop: go back up and check the condition again.",
  do: () => "End of the loop body.",
  switch: () => `End of the ${code("switch")}.`,
  case: () => "End of this case.",
  lambda: () => "End of the small inline function.",
  try: () => "End of the protected block.",
};

/** "a, b" → readable list of a function's parameters. */
function describeParams(params: string): string {
  const p = params.trim();
  if (!p || p === "void") return "takes nothing";
  const parts = splitTop(p);
  return parts.length === 1
    ? `takes ${code(parts[0] ?? "")}`
    : `takes ${parts.length} things: ${parts.map(code).join(", ")}`;
}

/** Splits on commas that are not inside (), <>, [] or {}. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if ("([<{".includes(ch)) depth++;
    if (")]>}".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The text between the first "(" and its matching ")". */
function insideParens(s: string, from = s.indexOf("(")): string {
  if (from < 0) return "";
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    if (s[i] === "(") depth++;
    if (s[i] === ")" && --depth === 0) return s.slice(from + 1, i);
  }
  return s.slice(from + 1);
}

function describeType(t: string): string {
  const type = t
    .replace(
      /\b(?:static|inline|constexpr|const|volatile|extern|IRAM_ATTR|virtual|explicit)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (/^void$/.test(type)) return "nothing";
  if (/^const char ?\*$|^char ?\*$/.test(type.replace(/\s/g, " ")) || /char\s*\*/.test(type))
    return "a piece of text";
  if (/^bool$/.test(type)) return "true or false";
  if (/^u?int\d+_t$|^(?:unsigned |signed )?(?:int|long|short|long long)$|^size_t$/.test(type))
    return "a whole number";
  if (/^(?:float|double)$/.test(type)) return "a decimal number";
  if (/^char$/.test(type)) return "a single character";
  if (/^String$/.test(type)) return "text";
  if (/^auto$/.test(type)) return "a value whose type the compiler works out";
  return code(type);
}

function functionHeader(stmt: Statement, b: Block): Rich {
  const special = SPECIAL_FUNCTIONS[b.name];
  if (special && b.depth === 0) return special;
  const header = b.header;
  const nameAt = header.indexOf(`${b.name.split("::").at(-1) ?? b.name}(`);
  const before =
    nameAt > 0
      ? header
          .slice(0, nameAt)
          .replace(/\w+::$/, "")
          .trim()
      : "";
  const params = describeParams(
    insideParens(header, nameAt + (b.name.split("::").at(-1)?.length ?? 0)),
  );
  const after = header.slice(header.lastIndexOf(")") + 1);
  const notes: string[] = [];
  if (/\bconst\b/.test(after)) notes.push("only reads the object, never changes it");
  if (/\bstatic\b/.test(before)) notes.push("belongs to the type itself, not to one object");
  if (/IRAM_ATTR/.test(before))
    notes.push("kept in fast internal RAM so an interrupt can run it instantly");
  if (/\boverride\b/.test(after)) notes.push("replaces a function the parent class declared");
  const extra = notes.length ? ` (it ${notes.join("; it ")})` : "";
  const short = b.name.split("::").at(-1) ?? b.name;
  if (/~\s*$/.test(before)) {
    return `The destructor of ${code(short)}: runs automatically when a ${code(short)} is thrown away, to tidy up after it.`;
  }
  if (
    !before ||
    /^(?:explicit|constexpr|inline)?$/.test(before) ||
    before.split(" ").at(-1) === short
  ) {
    const init = /\)\s*:/.test(header)
      ? ", and fills its members from the values after the colon"
      : "";
    return `The constructor of ${code(short)}: runs when a new ${code(short)} is made; it ${params}${init}.`;
  }
  const returns = describeType(before);
  void stmt;
  return `Defines the function ${code(`${short}()`)}: it ${params} and gives back ${returns}${extra}.`;
}

function blockHeader(stmt: Statement, b: Block, file: FileAnalysis): Rich {
  const cond = insideParens(b.header);
  switch (b.kind) {
    case "function":
      return functionHeader(stmt, b);
    case "if":
      return b.header.startsWith("else")
        ? `Otherwise, checks ${code(cond)}: the lines inside run only if it is true.`
        : `Checks ${code(cond)}: the lines inside run only if it is true.`;
    case "else":
      return "Otherwise (when the check above was false), runs these lines instead.";
    case "for": {
      if (/^\s*;\s*;\s*$/.test(cond))
        return "Repeats the lines inside forever (until something breaks out).";
      const range = /^(.*?)\s:\s(.+)$/.exec(cond);
      if (range && !cond.includes(";")) {
        const name =
          range[1]
            ?.trim()
            .split(/[\s*&]+/)
            .at(-1) ?? "item";
        return `Repeats the lines inside once for every item in ${code(range[2] ?? "")}, calling the current one ${code(name)}.`;
      }
      const [init, test, step] = cond.split(";").map((p) => p.trim());
      return `A counting loop: starts with ${code(init ?? "")}, keeps going while ${code(test ?? "")}, and does ${code(step ?? "")} after each round.`;
    }
    case "while":
      return /^(?:true|1)$/.test(cond.trim())
        ? "Repeats the lines inside forever (until something breaks out)."
        : `Repeats the lines inside as long as ${code(cond)} stays true.`;
    case "do":
      return "Runs the lines inside once, then repeats them while the check at the end holds.";
    case "switch":
      return `Picks which ${code("case")} below to run, depending on the value of ${code(cond)}.`;
    case "namespace":
      return b.name
        ? `Groups the names below under ${code(`${b.name}::`)} so they don't clash with others.`
        : "Opens a private section: what is defined until its closing brace can only be used inside this file.";
    case "struct": {
      const members = /\{(.*)\}/.exec(lineText(file.lines[b.open] ?? []))?.[1];
      return members
        ? `Describes ${code(b.name)}, a bundle of values: ${code(members)}.`
        : `Describes a new kind of value, ${code(b.name)}: a bundle of variables (its members) kept together.`;
    }
    case "class": {
      const base = /:\s*(?:public|private|protected)?\s*([\w:<>]+)/.exec(b.header)?.[1];
      return base
        ? `Defines the class ${code(b.name)}, built on ${code(base)}: it gets everything ${code(base)} has, plus what is added here.`
        : `Defines the class ${code(b.name)}: some data plus the functions that work on it, packed together.`;
    }
    case "enum": {
      const list = /\{([^}]*)\}/.exec(lineText(file.lines[b.open] ?? []))?.[1];
      return list
        ? `Lists every possible ${code(b.name)}: ${code(list.trim())}. A ${code(b.name)} can only ever be one of these.`
        : `Starts the list of every possible ${code(b.name)} value.`;
    }
    case "union":
      return `Defines ${code(b.name)}: several views of the same bytes in memory.`;
    case "try":
      return "Runs the lines inside and catches errors they throw.";
    case "case":
      return describeCase(b.header);
    default:
      return "Opens a block: the lines until the matching closing brace belong together.";
  }
}

function describeCase(text: string): Rich {
  if (/^default\b/.test(text)) return `When none of the cases match, start here.`;
  const value = /^case\s+(.+?)\s*:$/.exec(text.trim())?.[1] ?? text;
  return `When the value is ${code(value)}, start here.`;
}

/** "a[i + 1] |= x" → target, compound operator ("|", "" for plain "="), value; null if no top-level "=". */
function splitAssignment(s: string): { target: string; op: string; value: string } | null {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] ?? "";
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (ch === "?" && depth === 0) return null;
    else if (ch === "=" && depth === 0) {
      if (s[i + 1] === "=" || s[i - 1] === "=") return null;
      const op = /(<<|>>|[+\-*/%|&^])$/.exec(s.slice(0, i))?.[1] ?? "";
      if (!op && /[!<>]$/.test(s.slice(0, i))) return null;
      const target = s.slice(0, i - op.length).trim();
      // A declaration ("int x = 1") is handled elsewhere; a target is one expression.
      if (!target || /^[\w:<>]+\s+[*&]*\w+$/.test(target) || /\(\s*$/.test(target)) return null;
      return { target, op, value: s.slice(i + 1).trim() };
    }
  }
  return null;
}

/** Adds a call's arguments to a known meaning: "Pauses the program… Here: <code>1500</code>." */
const withArgs = (known: Rich, args: string) =>
  args.trim() ? `${known} Here: ${code(args)}.` : known;

/** "Stops here…" → "stops here…", to continue a sentence. */
const lowerFirst = (text: Rich) =>
  /^[A-Z][a-z]/.test(text) ? text[0]?.toLowerCase() + text.slice(1) : text;

/** Statements that are not block headers. */
function plainStatement(text: string, ctx: ExplainContext, within?: Block): LineExplanation {
  const s = text.replace(/;$/, "").trim();
  if (within?.kind === "enum") {
    return {
      text: `The possible ${code(within.name)} values: ${code(s.replace(/,$/, ""))}. Each name stands for a number the compiler picks.`,
    };
  }
  const callOf = (name: string): LineExplanation | undefined => {
    const def = ctx.defined.get(name);
    if (def) return { text: "", jump: { name, ...def } };
    return undefined;
  };

  // Preprocessor
  let m = /^#\s*include\s*([<"])([^>"]+)[>"]/.exec(s);
  if (m) {
    const known = ctx.known?.(m[2] ?? "");
    if (m[1] === '"') {
      const base = m[2]?.split("/").at(-1) ?? "";
      const def = ctx.defined.get(`file:${base}`);
      return {
        text: `Pastes in our own file ${code(m[2] ?? "")}, so this file can use what it defines.${known ? ` ${known}` : ""}`,
        ...(def ? { jump: { name: base, ...def } } : {}),
      };
    }
    return {
      text: `Brings in ${code(m[2] ?? "")}${known ? `: ${known}` : ", a library that comes with the tools, so this file can use what it declares."}`,
    };
  }
  if (/^#\s*pragma\s+once/.test(s))
    return {
      text: "Makes sure this file is pasted in only once per build, even if several files include it.",
    };
  m = /^#\s*define\s+(\w+)(\([^)]*\))?\s*(.*)$/.exec(s);
  if (m) {
    return m[2]
      ? {
          text: `Defines the macro ${code(`${m[1]}${m[2]}`)}: before compiling, each use is replaced by ${code(m[3] ?? "")}.`,
        }
      : {
          text: `Gives ${code(m[3] || "nothing")} the name ${code(m[1] ?? "")}: before compiling, every ${code(m[1] ?? "")} is swapped for it.`,
        };
  }
  m = /^#\s*(ifdef|ifndef|if|elif)\s+(.*)$/.exec(s);
  if (m) {
    const cond =
      m[1] === "ifdef"
        ? `${m[2]} is defined`
        : m[1] === "ifndef"
          ? `${m[2]} is not defined`
          : (m[2] ?? "");
    return {
      text: `${m[1] === "elif" ? "Otherwise, the" : "The"} lines up to the next ${code("#else")} / ${code("#endif")} are compiled only if ${code(cond)}.`,
    };
  }
  if (/^#\s*else/.test(s)) return { text: "Otherwise, these lines are compiled instead." };
  if (/^#\s*endif/.test(s)) return { text: `Ends the ${code("#if")} section above.` };
  if (/^#\s*(?:error|warning)/.test(s))
    return {
      text: "Stops the build with this message if this line is reached (a guard against a wrong setting).",
    };
  if (/^#/.test(s))
    return {
      text: "An instruction for the preprocessor, which edits the code before it is compiled.",
    };

  // One-line control statements without braces: "if (x) return;", "for (...) total += v;"
  m = /^(if|while|for)\s*\(/.exec(s);
  if (m) {
    const cond = insideParens(s);
    const body = s.slice(s.indexOf(cond) + cond.length + 1).trim();
    if (body) {
      const then = lowerFirst(plainStatement(body, ctx).text);
      if (m[1] === "if") return { text: `If ${code(cond)} is true, it ${then}` };
      if (m[1] === "while") return { text: `While ${code(cond)} is true, it keeps going: ${then}` };
      return { text: `Repeats (${code(cond)}): each round, it ${then}` };
    }
  }
  m = /^else\s+(.+)$/.exec(s);
  if (m) {
    const rest = plainStatement(m[1] ?? "", ctx).text;
    return {
      text: m[1]?.startsWith("if")
        ? `Otherwise, ${lowerFirst(rest)}`
        : `Otherwise, it ${lowerFirst(rest)}`,
    };
  }

  // Simple jumps
  if (s === "break") return { text: `Leaves the current loop or ${code("switch")} right away.` };
  if (s === "continue")
    return { text: "Skips the rest of this round and moves on to the next one." };
  if (s === "return")
    return { text: "Stops this function here and goes back to whoever called it." };
  m = /^return\s+(.+)$/.exec(s);
  if (m) {
    const value = m[1] ?? "";
    const call = /^(\w+)\s*\(/.exec(value)?.[1];
    const jump = call ? callOf(call)?.jump : undefined;
    if (/\?/.test(value) && /:/.test(value))
      return {
        text: `Gives back one of two values, depending on the check before the ${code("?")}: ${code(value)}.`,
        ...(jump ? { jump } : {}),
      };
    return { text: `Stops here and gives back ${code(value)}.`, ...(jump ? { jump } : {}) };
  }
  if (/^(?:public|private|protected)\s*:$/.test(s)) {
    return s.startsWith("public")
      ? { text: "Everything below can be used from outside the class." }
      : { text: "Everything below is internal: only the class's own functions can touch it." };
  }
  if (/^(?:case\b|default\s*:)/.test(s)) return { text: describeCase(s) };
  m = /^using\s+namespace\s+([\w:]+)/.exec(s);
  if (m)
    return {
      text: `Lets this file use names from ${code(m[1] ?? "")} without writing ${code(`${m[1]}::`)} each time.`,
    };
  m = /^using\s+(\w+)\s*=\s*(.+)$/.exec(s);
  if (m) return { text: `Gives ${code(m[2] ?? "")} a shorter name: ${code(m[1] ?? "")}.` };
  if (/^typedef\b/.test(s)) return { text: "Gives an existing type a new name." };
  if (/^template\s*</.test(s))
    return { text: "Starts a template: the code that follows works for any type filled in later." };
  if (/^static_assert\b/.test(s))
    return {
      text: "A check done while compiling: the build fails with the message if it is false.",
    };
  m = /^(?:enum\s+(?:class\s+)?|struct\s+|class\s+)(\w+)$/.exec(s);
  if (m)
    return { text: `Announces that ${code(m[1] ?? "")} exists; it is fully described elsewhere.` };
  if (/^delete\b/.test(s))
    return { text: "Frees memory that was taken earlier with <code>new</code>." };

  // Several variables at once: "float x, y, z", "int16_t a[320], b[320]".
  m =
    /^((?:(?:static|const|volatile)\s+)*)([\w:]+(?:\s*[*&])?)\s+(\w+\s*(?:\[[^\]]*\])?\s*(?:,\s*\*?\w+\s*(?:\[[^\]]*\])?\s*)+)$/.exec(
      s,
    );
  if (m && !/^(?:return|else|delete)$/.test(m[2] ?? "")) {
    const names = (m[3] ?? "").split(",").map((n) => n.trim());
    const arrays = names.some((n) => n.includes("["));
    const what = describeType(m[2] ?? "");
    return {
      text: `Makes ${names.length} variables, ${names.map((n) => code(n)).join(", ")}: each ${arrays ? `a list of values of type ${code(m[2] ?? "")}` : `is ${what}`}.`,
    };
  }

  // Declarations: [qualifiers] Type name[...] [= value | {value} | (args)]
  const decl =
    /^((?:(?:static|const|constexpr|constinit|inline|volatile|extern|thread_local|mutable)\s+)*)((?:[\w:]+(?:\s*<[^;=]*?>)?)(?:\s+const)?(?:\s*[*&]+\s*|\s+))(\w+)\s*(\[[^\]]*\])?\s*(=\s*([\s\S]+)|\{([\s\S]*)\}|\(([\s\S]*)\))?$/.exec(
      s,
    );
  const startsLikeType =
    decl && !/^(?:return|delete|new|throw|else|case|goto)$/.test(decl[2]?.trim() ?? "");
  if (decl && startsLikeType && !/[+\-*/%|&^]=|==/.test(decl[2] ?? "")) {
    const quals = decl[1] ?? "";
    const type = (decl[2] ?? "").trim();
    const name = decl[3] ?? "";
    const array = decl[4];
    const value = decl[6] ?? decl[7] ?? decl[8];
    const typeWord = describeType(type);
    const what = array
      ? `a list (array) of ${typeWord === code(type) ? code(type) : `${typeWord}s`}`
      : typeWord;
    const typeJump = ctx.defined.get(type.replace(/[*&\s]|const/g, ""));
    const jump = typeJump ? { jump: { name: type, ...typeJump } } : {};
    const member =
      within && (within.kind === "struct" || within.kind === "class") ? within : undefined;
    if (/constexpr/.test(quals)) {
      if (member)
        return {
          text: `A fixed setting of ${code(member.name)}: ${code(name)} = ${code(value ?? "")}, worked out when compiling.`,
          ...jump,
        };
      return {
        text: `A fixed value, ${code(name)} = ${code(value ?? "")}, worked out when compiling: it can never change while the board runs.`,
        ...jump,
      };
    }
    const staticNote = /static/.test(quals)
      ? " Because it is <code>static</code>, it keeps its value between calls (and lives as long as the program)."
      : "";
    // "const char *p": the characters are read-only, the pointer itself can still change.
    const pointerToConst = /\*/.test(type) && !/\*\s*const/.test(type);
    if (member && value === undefined) {
      return {
        text: `Every ${code(member.name)} carries its own ${code(name)}: ${what}.`,
        ...jump,
      };
    }
    if (/const/.test(quals + type) && !(pointerToConst && !/const/.test(quals))) {
      return {
        text: `${code(name)}: ${what} that never changes after this line${value ? `, set to ${code(value)}` : ""}.${staticNote}`,
        ...jump,
      };
    }
    if (value === undefined) return { text: `Makes ${code(name)}, ${what}.${staticNote}`, ...jump };
    if (decl[8] !== undefined || decl[7] !== undefined)
      return {
        text: `Makes ${code(name)}, ${what}, built from ${code(value || "nothing")}.${staticNote}`,
        ...jump,
      };
    return {
      text: `Makes a variable ${code(name)} (${what}) and puts ${code(value)} in it.${staticNote}`,
      ...jump,
    };
  }

  // Assignment and arithmetic shortcuts
  const assign = splitAssignment(s);
  if (assign) {
    const { target, op, value } = assign;
    const verb: Record<string, string> = {
      "+": `Adds ${code(value)} to ${code(target)}.`,
      "-": `Takes ${code(value)} away from ${code(target)}.`,
      "*": `Multiplies ${code(target)} by ${code(value)}.`,
      "/": `Divides ${code(target)} by ${code(value)}.`,
      "%": `Keeps only the remainder of ${code(target)} divided by ${code(value)}.`,
      "|": `Switches on, in ${code(target)}, the bits that are on in ${code(value)}.`,
      "&": `Keeps, in ${code(target)}, only the bits that are also on in ${code(value)}.`,
      "^": `Flips, in ${code(target)}, the bits that are on in ${code(value)}.`,
      "<<": `Shifts the bits of ${code(target)} left by ${code(value)}.`,
      ">>": `Shifts the bits of ${code(target)} right by ${code(value)}.`,
    };
    const call = /^(\w+)\s*\(/.exec(value)?.[1];
    const jump = call ? callOf(call)?.jump : undefined;
    return {
      text: op
        ? (verb[op] ?? `Updates ${code(target)}.`)
        : `Stores ${code(value)} in ${code(target)}.`,
      ...(jump ? { jump } : {}),
    };
  }
  m = /^(?:\+\+|--)\s*([\w.\->[\]]+)$|^([\w.\->[\]]+)\s*(?:\+\+|--)$/.exec(s);
  if (m)
    return {
      text: `${s.includes("++") ? "Adds 1 to" : "Takes 1 away from"} ${code(m[1] ?? m[2] ?? "")}.`,
    };

  // Calls: obj.method(...), ns::fn(...), fn(...)
  m =
    /^([\w]+)((?:\s*(?:\.|->|::)\s*\w+(?:\([^)]*\))?)*?)\s*(?:\.|->|::)?\s*(\w+)?\s*\(([\s\S]*)\)$/.exec(
      s,
    );
  if (m) {
    const qualified = /^([\w]+)\s*(\.|->|::)\s*(\w+)\s*\(/.exec(s);
    const plain = /^(\w+)\s*\(/.exec(s);
    const args = insideParens(s);
    const argText = args.trim() ? ` with ${code(args)}` : "";
    if (qualified) {
      const [, obj, sep, method] = qualified;
      const known =
        ctx.known?.(`${obj}${sep === "::" ? "::" : "."}${method}`) ?? ctx.known?.(method ?? "");
      if (known) return { text: withArgs(known, args) };
      const def = FRAMEWORK_OBJECTS.has(obj ?? "") ? undefined : ctx.defined.get(method ?? "");
      return {
        text: `Asks ${code(obj ?? "")} to do ${code(`${method}()`)}${argText}.`,
        ...(def ? { jump: { name: method ?? "", ...def } } : {}),
      };
    }
    if (plain) {
      const name = plain[1] ?? "";
      const def = ctx.defined.get(name);
      if (def && def.kind === "function")
        return {
          text: `Runs our own function ${code(`${name}()`)}${argText}.`,
          jump: { name, ...def },
        };
      const known = ctx.known?.(name);
      if (known) return { text: withArgs(known, args) };
      return { text: `Calls ${code(`${name}()`)}${argText}.` };
    }
  }
  if (/^\}?\s*\w*\s*;?$/.test(s) && s.length < 3) return { text: "" };
  return {
    text: `Does the work written here: ${code(s)}. Tap the highlighted words to learn them.`,
  };
}

/** Explains one line (0-based). Blank lines get an empty text. */
export function explainLine(ctx: ExplainContext, line: number): LineExplanation {
  const first = explainFirst(ctx, line);
  if (first.continues !== undefined || !first.text) return first;
  // More statements starting on the same line ("case X: return 1;", "} else {" is one idea).
  const { file } = ctx;
  const index = file.statementOf[line] ?? -1;
  const extra: Rich[] = [];
  for (let k = index + 1; k < file.statements.length && extra.length < 2; k++) {
    const next = file.statements[k];
    if (!next || next.start !== line) break;
    const prev = file.statements[k - 1];
    if (prev?.closes && next.opens && prev.start === line && k - 1 === index) continue;
    if (next.closes || /^[}{;]?$/.test(next.text)) continue;
    if (prev?.closes && /^\w+(?:\[[^\]]*\])?;?$/.test(next.text)) continue;
    // "enum class Mode { Off, On };": the header already listed the values.
    if (ownerOf(file, line)?.kind === "enum" || prev?.opens?.kind === "enum") continue;
    const said = next.opens
      ? blockHeader(next, next.opens, file)
      : plainStatement(next.text, ctx).text;
    if (said) extra.push(lowerFirst(said));
  }
  return extra.length
    ? { ...first, text: `${first.text} Then it ${extra.join(" Then it ")}` }
    : first;
}

function explainFirst(ctx: ExplainContext, line: number): LineExplanation {
  const { file } = ctx;
  const kind = file.kinds[line];
  if (kind === "blank" || kind === undefined) return { text: "" };
  if (kind === "comment") {
    const chapter = file.chapters.get(line);
    if (chapter)
      return { text: `A heading for the next part of the file: <b>${esc(chapter)}</b>.` };
    return {
      text: "A note for people reading the code. The compiler skips it, so it changes nothing on the board.",
    };
  }
  const index = file.statementOf[line] ?? -1;
  const stmt = file.statements[index];
  if (!stmt) return { text: "" };
  if (stmt.start < line && !stmt.closes) {
    return {
      text: `Continues the statement that starts on line ${stmt.start + 1}.`,
      continues: stmt.start,
    };
  }
  if (stmt.closes) {
    const b = stmt.closes;
    // "} else {" and "} while (x);" close one block and open the next.
    const next = file.statements[index + 1];
    if (next && next.start === line && next.opens)
      return { text: blockHeader(next, next.opens, file) };
    const closeText = CLOSE[b.kind]?.(b);
    const variable =
      next && next.start === line && /^\w+(?:\[[^\]]*\])?;?$/.test(next.text)
        ? next.text.replace(/;$/, "")
        : null;
    if (variable && (b.kind === "struct" || b.kind === "class" || b.kind === "enum")) {
      return {
        text: `${closeText ?? ""} And it makes ${code(variable)}, a variable of this new type, right here.`,
      };
    }
    if (b.kind === "do" && next?.start === line)
      return { text: `End of the loop body: repeat while ${code(insideParens(next.text))}.` };
    return { text: closeText ?? "Closes the block opened above." };
  }
  if (stmt.opens) return { text: blockHeader(stmt, stmt.opens, file), ...jumpFor(stmt.opens, ctx) };
  const explained = plainStatement(stmt.text, ctx, ownerOf(file, line));
  if (!explained.text && explained.jump)
    return { ...explained, text: `Runs our own function ${code(`${explained.jump.name}()`)}.` };
  return explained;
}

function jumpFor(b: Block, ctx: ExplainContext): Pick<LineExplanation, "jump"> {
  if (b.kind !== "function" || !b.name.includes("::")) return {};
  const type = b.name.split("::")[0] ?? "";
  const def = ctx.defined.get(type);
  return def ? { jump: { name: type, ...def } } : {};
}

/** Every function and type defined in a set of analysed files, by name (first one wins). */
export function definitionsOf(
  files: readonly { path: string; analysis: FileAnalysis }[],
): Map<string, Definition> {
  const defined = new Map<string, Definition>();
  for (const { path, analysis } of files) {
    defined.set(`file:${path.split("/").at(-1) ?? path}`, { path, line: 0, kind: "block" });
    for (const b of analysis.blocks) {
      const named =
        b.kind === "function" || b.kind === "struct" || b.kind === "class" || b.kind === "enum";
      const short = b.name.split("::").at(-1) ?? "";
      if (named && short && !defined.has(short))
        defined.set(short, { path, line: b.start, kind: b.kind });
    }
  }
  return defined;
}
