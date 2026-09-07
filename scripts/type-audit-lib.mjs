import ts from 'typescript';

// Material declarations merge a class with a local *Properties interface.
// Imported base interfaces belong to their own class and are audited there.
export function parseDeclarations(text, file) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const classes = [], interfaces = new Map();
  const bases = node => (node.heritageClauses ?? []).flatMap(c => c.types.map(t => t.expression.getText(source)));
  function collect(node) {
    if (ts.isClassDeclaration(node) && node.name) classes.push(node);
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node);
    ts.forEachChild(node, collect);
  }
  collect(source);
  function interfaceNames(name, found = new Set()) {
    if (found.has(name)) return found;
    found.add(name);
    const node = interfaces.get(name);
    if (node) for (const base of bases(node)) interfaceNames(base, found);
    return found;
  }
  return classes.map(node => {
    const members = new Map();
    function add(member) {
      const mods = new Set((member.modifiers ?? []).map(m => m.kind));
      if (mods.has(ts.SyntaxKind.PrivateKeyword) || mods.has(ts.SyntaxKind.ProtectedKeyword)) return;
      const name = ts.isConstructorDeclaration(member) ? 'constructor' : member.name?.getText(source);
      if (!name || name.startsWith('_') || name.endsWith('_') || name.startsWith('#')) return;
      const key = (mods.has(ts.SyntaxKind.StaticKeyword) ? 'static ' : '') + name;
      const kind = ts.isConstructorDeclaration(member) ? 'constructor' : ts.isMethodDeclaration(member) || ts.isMethodSignature(member) ? 'method' : 'property';
      const record = members.get(key) ?? {
        key, name, kind, file,
        writable: kind === 'property' && !mods.has(ts.SyntaxKind.ReadonlyKeyword) && !ts.isGetAccessorDeclaration(member),
        deprecated: ts.getJSDocDeprecatedTag(member) !== undefined || /@deprecated\b/.test(source.text.slice(member.pos, member.getStart(source))),
        signatures: [], line: source.getLineAndCharacterOfPosition(member.getStart(source)).line + 1,
      };
      if (ts.isSetAccessorDeclaration(member)) record.writable = true;
      record.signatures.push(member.getText(source).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim());
      members.set(key, record);
    }
    node.members.forEach(add);
    const inherited = new Set(bases(node).flatMap(name => [...interfaceNames(name)]));
    for (const name of interfaceNames(node.name.text)) {
      if (!inherited.has(name)) interfaces.get(name)?.members.forEach(add);
    }
    return {name: node.name.text, file, abstract: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword) ?? false, bases: bases(node), members: [...members.values()]};
  });
}

// Inventory of the other exported contracts, separate from class-member counts.
export function parseModuleExports(text, file) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return source.statements.filter(node => node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).flatMap(node => {
    const kind = ts.isFunctionDeclaration(node) ? 'function' : ts.isVariableStatement(node) ? 'value' : ts.isInterfaceDeclaration(node) ? 'interface' : ts.isTypeAliasDeclaration(node) ? 'type' : ts.isModuleDeclaration(node) ? 'namespace' : null;
    if (!kind) return [];
    const names = ts.isVariableStatement(node) ? node.declarationList.declarations.map(d => d.name.getText(source)) : [node.name?.text];
    return names.filter(Boolean).map(name => ({name, kind, file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}));
  });
}

function expressionReferences(body) {
 const source = ts.createSourceFile('binding.js', `const binding = self => ${body}`, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
 const references = new Map();
 function visit(node) {
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'self') {
   const parent = node.parent;
   const invoked = ts.isCallExpression(parent) && parent.expression === node;
   const assigned = ts.isBinaryExpression(parent) && parent.left === node && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
   const returned = ts.isReturnStatement(parent) || (ts.isArrowFunction(parent) && parent.body === node);
   const snapshot = ts.isPropertyAccessExpression(parent) && ['slice','map'].includes(parent.name.text) && ts.isCallExpression(parent.parent) && parent.parent.expression === parent;
   const converted = ts.isCallExpression(parent) && parent.expression.getText(source) === 'Array.from';
   const name = node.name.text, kind = invoked || assigned || returned || snapshot || converted ? 'mapped' : 'partial';
   references.set(name, references.get(name) === 'mapped' ? 'mapped' : kind);
  }
  ts.forEachChild(node,visit);
 }
 visit(source);
 return references;
}

export function bindingCoverage(bindings) {
 const result=new Map();
 for(const binding of bindings) {
  const methods=result.get(binding.type)??new Map(); result.set(binding.type,methods);
  const add=(key,kind,name)=>{const old=methods.get(key);methods.set(key,{kind:old?.kind==='mapped'?'mapped':kind,bindings:[...new Set([...(old?.bindings??[]),name])]});};
  for (const factory of [...(binding.factory ? [binding.factory] : []), ...(binding.factories ?? [])]) add('constructor','mapped',factory.name);
  for(const method of binding.methods) {
   if(method.upstream) { for(const key of [].concat(method.upstream)) add(key,'mapped',method.name); continue; }
   if(method.identity)continue;
   if(method.js)add((method.static?'static ':'')+method.js,'mapped',method.name);
   if(method.expression) {
    for(const [name,kind] of expressionReferences(method.expression)) add(name,kind,method.name);
   }
  }
 }
 for (const binding of bindings.filter(b => b.facadeFor)) {
  const merged = result.get(binding.facadeFor) ?? new Map();
  for (const [key, entry] of result.get(binding.type)) {
   const old = merged.get(key);
   merged.set(key, {kind: old?.kind === 'mapped' ? 'mapped' : entry.kind, bindings: [...new Set([...(old?.bindings ?? []), ...entry.bindings.map(name => `${binding.type}::${name}`)])]});
  }
  result.set(binding.facadeFor, merged);
 }
 return result;
}

export function inheritConstructors(declarations) {
 const byName = new Map();
 for (const item of declarations) byName.set(item.name, [...(byName.get(item.name) ?? []), item]);
 function constructorFor(item, seen = new Set()) {
  if (seen.has(item)) return null;
  seen.add(item);
  const own = item.members.find(m => m.kind === 'constructor');
  if (own) return {member: own, owner: item.name};
  for (const name of item.bases) {
   const candidates = byName.get(name) ?? [];
   // Ambiguous class names require import resolution; do not guess.
   if (candidates.length === 1) {
    const inherited = constructorFor(candidates[0], seen);
    if (inherited) return inherited;
   }
  }
  return null;
 }
 return declarations.map(item => {
  if (item.abstract || item.members.some(m => m.kind === 'constructor')) return item;
  const inherited = constructorFor(item);
  return inherited ? {...item, members: [{...inherited.member, inheritedFrom: inherited.owner}, ...item.members]} : item;
 });
}
