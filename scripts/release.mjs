import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const roots = ['app','components','hooks','lib','miniapp','public','scripts','server','shared','tests','docs','third-party','.github'];
const files = ['.gitignore','.dockerignore','.oxfmtrc.json','.oxlintrc.json','LICENSE','NOTICE','DISCLAIMER.md','SECURITY.md','CONTRIBUTING.md','THIRD_PARTY_NOTICES.md','README.md','Dockerfile','compose.yaml','components.json','next.config.ts','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','start.command','tsconfig.json','vite.config.ts','.openai/hosting.json'];
function walk(dir) { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if (e.isSymbolicLink()) throw Error(`Symlink in source: ${p}`); if(e.isDirectory())walk(p);else if(!/project\.private\.config\.json$|\.DS_Store$/.test(p))files.push(p); } }
for(const dir of roots)walk(dir);
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{40,}/,/sk-(?:proj-)?[A-Za-z0-9_-]{40,}/,/AKIA[0-9A-Z]{16}/,/\/Users\/[A-Za-z0-9_.-]+\//];
for(const file of files){const contents=fs.readFileSync(file,'utf8');if(patterns.some(p=>p.test(contents)))throw Error(`Potential secret or personal path: ${file}`);}
const pkg=JSON.parse(fs.readFileSync('package.json'));if(pkg.license!=='AGPL-3.0-only')throw Error('Unexpected project license');
if(!fs.readFileSync('LICENSE','utf8').includes('GNU AFFERO GENERAL PUBLIC LICENSE'))throw Error('Missing full license');
console.log(`Release checks passed: ${files.length} allowlisted files; no common secret patterns or personal home paths detected. This is not an exhaustive security audit.`);
if(process.argv.includes('--pack')){
 const dest='release/smartguide-94-source';fs.mkdirSync(dest,{recursive:true});
 // Only the generated staging directory is replaced.
 fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
 const manifest={origin:'94-smartguide-jiusi-2026',version:pkg.version,files:{}};
 for(const f of files.sort()){fs.mkdirSync(path.dirname(path.join(dest,f)),{recursive:true});fs.copyFileSync(f,path.join(dest,f));manifest.files[f]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');}
 fs.writeFileSync(path.join(dest,'SOURCE_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
 const archive='smartguide-94-source.tar.gz';execFileSync('tar',['-czf',archive,'smartguide-94-source'],{cwd:'release'});
 fs.writeFileSync(`release/${archive}.sha256`,crypto.createHash('sha256').update(fs.readFileSync(`release/${archive}`)).digest('hex')+`  ${archive}\n`);
 console.log(`Created release/${archive} with SHA-256 file inventory and archive checksum.`);
}
