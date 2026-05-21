import { parse } from "@babel/parser";
import type {
  ArrayExpression,
  CallExpression,
  Expression,
  ImportDeclaration,
  MemberExpression,
  Node,
  ObjectExpression,
  Program,
  StringLiteral,
} from "@babel/types";

import { DEFAULT_THEME_KEYS } from "./default-theme";
import type {
  JsValue,
  MigrationNote,
  NormalizedConfig,
  PluginRef,
} from "./types";

type ResolvedBinding =
  | { kind: "value"; value: JsValue }
  | { kind: "colors-default" }
  | { kind: "default-theme" }
  | { kind: "plugin-fn" }
  | { kind: "unresolved"; source: string };

interface ParseCtx {
  source: string;
  bindings: Map<string, ResolvedBinding>;
  notes: MigrationNote[];
}

export function parseConfig(source: string): NormalizedConfig {
  const empty: NormalizedConfig = {
    themeRoot: {},
    themeExtend: {},
    plugins: [],
    presets: [],
    parseNotes: [],
  };

  if (!source.trim()) return empty;

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: "module",
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      plugins: ["typescript"],
    });
  } catch (err) {
    empty.parseNotes.push({
      level: "warning",
      message: `Could not parse tailwind.config: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    return empty;
  }

  const ctx: ParseCtx = { source, bindings: new Map(), notes: [] };

  collectBindings(ast.program, ctx);
  const exported = findExportedConfig(ast.program, ctx);

  if (!exported || exported.kind !== "object") {
    ctx.notes.push({
      level: "warning",
      message:
        "Could not find an exported config object. Expected `module.exports = { ... }` or `export default { ... }`.",
    });
    return { ...empty, parseNotes: ctx.notes };
  }

  return buildNormalizedConfig(exported, ctx);
}

function collectBindings(program: Program, ctx: ParseCtx) {
  for (const node of program.body) {
    if (node.type === "ImportDeclaration") {
      handleImport(node, ctx);
      continue;
    }
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.id.type !== "Identifier" || !decl.init) continue;
        ctx.bindings.set(decl.id.name, resolveBinding(decl.init, ctx));
      }
    }
  }
}

function handleImport(node: ImportDeclaration, ctx: ParseCtx) {
  const src = node.source.value;
  for (const spec of node.specifiers) {
    if (
      spec.type === "ImportDefaultSpecifier" ||
      spec.type === "ImportNamespaceSpecifier"
    ) {
      if (src === "tailwindcss/colors") {
        ctx.bindings.set(spec.local.name, { kind: "colors-default" });
      } else if (src === "tailwindcss/defaultTheme") {
        ctx.bindings.set(spec.local.name, { kind: "default-theme" });
      } else if (src === "tailwindcss/plugin") {
        ctx.bindings.set(spec.local.name, { kind: "plugin-fn" });
      } else {
        ctx.bindings.set(spec.local.name, {
          kind: "unresolved",
          source: `import ${spec.local.name} from "${src}"`,
        });
      }
    }
  }
}

function resolveBinding(expr: Expression, ctx: ParseCtx): ResolvedBinding {
  const unwrapped = unwrap(expr);
  if (
    unwrapped.type === "CallExpression" &&
    unwrapped.callee.type === "Identifier" &&
    unwrapped.callee.name === "require" &&
    unwrapped.arguments.length === 1 &&
    unwrapped.arguments[0].type === "StringLiteral"
  ) {
    const arg = (unwrapped.arguments[0] as StringLiteral).value;
    if (arg === "tailwindcss/colors") return { kind: "colors-default" };
    if (arg === "tailwindcss/defaultTheme") return { kind: "default-theme" };
    if (arg === "tailwindcss/plugin") return { kind: "plugin-fn" };
    return { kind: "unresolved", source: snippet(unwrapped, ctx.source) };
  }
  return { kind: "value", value: exprToJs(unwrapped, ctx) };
}

function findExportedConfig(program: Program, ctx: ParseCtx): JsValue | null {
  for (const node of program.body) {
    if (node.type === "ExportDefaultDeclaration") {
      const decl = unwrap(node.declaration as Expression);
      return exprToJs(decl, ctx);
    }
    if (node.type === "ExpressionStatement") {
      const expr = node.expression;
      if (
        expr.type === "AssignmentExpression" &&
        isModuleExports(expr.left) &&
        expr.right
      ) {
        return exprToJs(unwrap(expr.right), ctx);
      }
    }
  }
  return null;
}

function isModuleExports(node: Node): boolean {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "module" &&
    node.property.type === "Identifier" &&
    node.property.name === "exports"
  );
}

function buildNormalizedConfig(obj: JsValue, ctx: ParseCtx): NormalizedConfig {
  const out: NormalizedConfig = {
    themeRoot: {},
    themeExtend: {},
    plugins: [],
    presets: [],
    parseNotes: ctx.notes,
  };
  if (obj.kind !== "object") return out;

  for (const [key, value] of Object.entries(obj.entries)) {
    switch (key) {
      case "theme": {
        if (value.kind !== "object") break;
        for (const [subKey, subValue] of Object.entries(value.entries)) {
          if (subKey === "extend" && subValue.kind === "object") {
            for (const [k, v] of Object.entries(subValue.entries)) {
              out.themeExtend[k] = v;
            }
          } else {
            out.themeRoot[subKey] = subValue;
          }
        }
        break;
      }
      case "darkMode":
        out.darkMode = value;
        break;
      case "content":
        out.content = value;
        break;
      case "prefix":
        if (value.kind === "string") out.prefix = value.value;
        break;
      case "important":
        if (value.kind === "boolean") out.important = value.value;
        else if (value.kind === "string") out.important = value.value;
        break;
      case "safelist": {
        if (value.kind !== "array") break;
        const list: string[] = [];
        for (const item of value.items) {
          if (item.kind === "string") list.push(item.value);
          else if (item.kind === "object" && item.entries.pattern?.kind === "string") {
            list.push(item.entries.pattern.value);
          }
        }
        out.safelist = list;
        break;
      }
      case "corePlugins":
        out.corePlugins = value;
        break;
      case "plugins": {
        if (value.kind !== "array") break;
        // We need the raw AST array for plugin extraction so we get
        // `require("x")` vs `plugin(function(){})` distinctions. Re-find it.
        const arrAst = findPluginsArrayInAst(ctx, key);
        out.plugins = arrAst ? extractPlugins(arrAst, ctx) : extractPluginsFromJsValue(value);
        break;
      }
      case "presets":
        if (value.kind === "array") out.presets = value.items;
        break;
      default:
        ctx.notes.push({
          level: "info",
          message: `Skipped unknown config key "${key}".`,
        });
    }
  }

  return out;
}

/**
 * Re-walk the AST to find the original `plugins: [...]` array — we need it
 * because the JsValue layer flattens require()/plugin() calls into "unknown"
 * and we want to recognize them precisely.
 */
function findPluginsArrayInAst(ctx: ParseCtx, key: string): ArrayExpression | null {
  let result: ArrayExpression | null = null;
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(ctx.source, {
      sourceType: "module",
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      plugins: ["typescript"],
    });
  } catch {
    return null;
  }
  const visit = (obj: ObjectExpression) => {
    for (const prop of obj.properties) {
      if (prop.type !== "ObjectProperty") continue;
      const k = propKeyName(prop.key);
      if (k === key) {
        const v = unwrap(prop.value as Expression);
        if (v.type === "ArrayExpression") {
          result = v;
          return;
        }
      }
    }
  };
  for (const node of ast.program.body) {
    if (result) break;
    if (node.type === "ExportDefaultDeclaration") {
      const d = unwrap(node.declaration as Expression);
      if (d.type === "ObjectExpression") visit(d);
      if (d.type === "Identifier") {
        const bound = ctx.bindings.get(d.name);
        // skip — value already flattened
        void bound;
      }
    } else if (node.type === "ExpressionStatement") {
      const e = node.expression;
      if (e.type === "AssignmentExpression" && isModuleExports(e.left)) {
        const r = unwrap(e.right);
        if (r.type === "ObjectExpression") visit(r);
      }
    } else if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (!decl.init) continue;
        const init = unwrap(decl.init);
        if (init.type === "ObjectExpression") visit(init);
      }
    }
  }
  return result;
}

function extractPlugins(arr: ArrayExpression, ctx: ParseCtx): PluginRef[] {
  const out: PluginRef[] = [];
  for (const el of arr.elements) {
    if (!el) continue;
    const expr = unwrap(el as Expression);
    if (expr.type === "CallExpression") {
      const callee = expr.callee;
      if (
        callee.type === "Identifier" &&
        callee.name === "require" &&
        expr.arguments[0]?.type === "StringLiteral"
      ) {
        out.push({ kind: "npm", name: (expr.arguments[0] as StringLiteral).value });
        continue;
      }
      if (callee.type === "Identifier") {
        const bound = ctx.bindings.get(callee.name);
        if (bound?.kind === "plugin-fn") {
          out.push({ kind: "inline", source: snippet(expr, ctx.source) });
          continue;
        }
      }
    }
    if (expr.type === "Identifier") {
      const bound = ctx.bindings.get(expr.name);
      if (bound?.kind === "unresolved") {
        const match = bound.source.match(/from "([^"]+)"/);
        if (match) {
          out.push({ kind: "npm", name: match[1] });
          continue;
        }
      }
    }
    out.push({ kind: "unknown", source: snippet(expr, ctx.source) });
  }
  return out;
}

function extractPluginsFromJsValue(value: JsValue): PluginRef[] {
  if (value.kind !== "array") return [];
  return value.items.map<PluginRef>((item) => {
    if (item.kind === "unknown") return { kind: "unknown", source: item.source };
    return { kind: "unknown", source: JSON.stringify(item) };
  });
}

function unwrap(expr: Expression): Expression {
  let cur: Expression = expr;
  while (
    cur.type === "TSAsExpression" ||
    cur.type === "TSSatisfiesExpression" ||
    cur.type === "TSNonNullExpression" ||
    cur.type === "TSTypeAssertion" ||
    cur.type === "ParenthesizedExpression"
  ) {
    cur = (cur as { expression: Expression }).expression;
  }
  return cur;
}

function propKeyName(key: Node): string | null {
  if (key.type === "Identifier") return key.name;
  if (key.type === "StringLiteral") return key.value;
  if (key.type === "NumericLiteral") return String(key.value);
  return null;
}

function snippet(node: Node, source: string): string {
  if (node.start != null && node.end != null) {
    return source.slice(node.start, node.end);
  }
  return "<unresolved>";
}

function exprToJs(expr: Expression, ctx: ParseCtx): JsValue {
  const node = unwrap(expr);
  switch (node.type) {
    case "StringLiteral":
      return { kind: "string", value: node.value };
    case "NumericLiteral":
      return { kind: "number", value: node.value };
    case "BooleanLiteral":
      return { kind: "boolean", value: node.value };
    case "NullLiteral":
      return { kind: "null" };
    case "UnaryExpression": {
      if (node.operator === "-" && node.argument.type === "NumericLiteral") {
        return { kind: "number", value: -node.argument.value };
      }
      return { kind: "unknown", source: snippet(node, ctx.source) };
    }
    case "TemplateLiteral": {
      if (node.expressions.length === 0 && node.quasis.length === 1) {
        return { kind: "string", value: node.quasis[0].value.cooked ?? "" };
      }
      return { kind: "unknown", source: snippet(node, ctx.source) };
    }
    case "ArrayExpression": {
      const items: JsValue[] = [];
      for (const el of node.elements) {
        if (!el) continue;
        if (el.type === "SpreadElement") {
          items.push({ kind: "unknown", source: snippet(el, ctx.source) });
          continue;
        }
        items.push(exprToJs(el as Expression, ctx));
      }
      return { kind: "array", items };
    }
    case "ObjectExpression": {
      const entries: Record<string, JsValue> = {};
      for (const prop of node.properties) {
        if (prop.type === "SpreadElement") {
          const spread = exprToJs(prop.argument, ctx);
          if (spread.kind === "object") {
            Object.assign(entries, spread.entries);
          } else if (
            spread.kind === "colors-default" ||
            spread.kind === "default-theme"
          ) {
            // v4 already includes these defaults — safe to drop the spread.
          } else {
            ctx.notes.push({
              level: "info",
              message: `Could not statically expand spread: ${snippet(prop, ctx.source)}`,
            });
          }
          continue;
        }
        if (prop.type !== "ObjectProperty") continue;
        const k = propKeyName(prop.key);
        if (!k) continue;
        entries[k] = exprToJs(unwrap(prop.value as Expression), ctx);
      }
      return { kind: "object", entries };
    }
    case "Identifier": {
      const bound = ctx.bindings.get(node.name);
      if (!bound) return { kind: "unknown", source: node.name };
      if (bound.kind === "value") return bound.value;
      if (bound.kind === "colors-default") return { kind: "colors-default" };
      if (bound.kind === "default-theme") return { kind: "default-theme" };
      return { kind: "unknown", source: bound.kind === "unresolved" ? bound.source : node.name };
    }
    case "MemberExpression":
      return resolveMember(node, ctx);
    case "CallExpression":
      return resolveCall(node, ctx);
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return { kind: "function", source: snippet(node, ctx.source) };
    default:
      return { kind: "unknown", source: snippet(node, ctx.source) };
  }
}

function resolveMember(node: MemberExpression, ctx: ParseCtx): JsValue {
  const path: string[] = [];
  let cur: Expression = node;
  while (cur.type === "MemberExpression") {
    const prop = cur.property;
    let key: string | null = null;
    if (!cur.computed && prop.type === "Identifier") key = prop.name;
    else if (prop.type === "StringLiteral") key = prop.value;
    else if (prop.type === "NumericLiteral") key = String(prop.value);
    if (key == null) return { kind: "unknown", source: snippet(node, ctx.source) };
    path.unshift(key);
    cur = cur.object as Expression;
  }
  const root = cur;

  if (root.type === "Identifier") {
    const bound = ctx.bindings.get(root.name);
    if (bound?.kind === "colors-default") {
      const [color, shade] = path;
      return shade ? { kind: "color-ref", color, shade } : { kind: "color-ref", color };
    }
    if (bound?.kind === "default-theme") {
      if (path[0] && DEFAULT_THEME_KEYS.has(path[0])) {
        return { kind: "default-theme-key", path };
      }
      return { kind: "unknown", source: snippet(node, ctx.source) };
    }
    if (bound?.kind === "value") {
      let v: JsValue = bound.value;
      for (const seg of path) {
        if (v.kind !== "object" || !(seg in v.entries)) {
          return { kind: "unknown", source: snippet(node, ctx.source) };
        }
        v = v.entries[seg];
      }
      return v;
    }
  }

  if (root.type === "CallExpression") {
    const callValue = resolveCall(root as CallExpression, ctx);
    if (callValue.kind === "colors-default") {
      const [color, shade] = path;
      return shade ? { kind: "color-ref", color, shade } : { kind: "color-ref", color };
    }
    if (callValue.kind === "default-theme") {
      return { kind: "default-theme-key", path };
    }
  }

  return { kind: "unknown", source: snippet(node, ctx.source) };
}

function resolveCall(node: CallExpression, ctx: ParseCtx): JsValue {
  const callee = node.callee;
  if (
    callee.type === "Identifier" &&
    callee.name === "require" &&
    node.arguments.length === 1
  ) {
    const arg = node.arguments[0];
    if (arg.type === "StringLiteral") {
      if (arg.value === "tailwindcss/colors") return { kind: "colors-default" };
      if (arg.value === "tailwindcss/defaultTheme") return { kind: "default-theme" };
    }
  }
  return { kind: "unknown", source: snippet(node, ctx.source) };
}
