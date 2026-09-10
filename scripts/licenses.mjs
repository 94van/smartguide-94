import fs from 'node:fs';
import path from 'node:path';
const pkg=JSON.parse(fs.readFileSync('package.json'));
const entries=[];
for(const name of Object.keys({...pkg.dependencies,...pkg.devDependencies}).sort()){
 const dir=fs.realpathSync(path.join('node_modules',name));const info=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
 const target=path.join('third-party',`${name.replaceAll('/','__')}@${info.version}`);fs.mkdirSync(target,{recursive:true});
 const licenses=fs.readdirSync(dir).filter(f=>/^(license|licence|notice|copyright)(\.|$)/i.test(f)&&fs.statSync(path.join(dir,f)).isFile());
 for(const file of licenses)fs.copyFileSync(path.join(dir,file),path.join(target,file));
 entries.push({name,version:info.version,license:info.license??'UNKNOWN',licenseFiles:licenses.map(f=>path.join(target,f)),repository:info.repository??null});
}
fs.writeFileSync('docs/dependency-licenses.json',JSON.stringify(entries,null,2)+'\n');
fs.writeFileSync('THIRD_PARTY_NOTICES.md',`# Third-party notices\n\nDirect dependencies and development tools retain their own licenses. This inventory records installed package metadata; it is not an exhaustive audit of transitive dependencies. Original license texts found in direct packages are preserved in third-party/. Packages without bundled license files must be reviewed at their upstream repository before redistributing bundled binaries. pnpm-lock.yaml records transitive versions; installation retains their package notices.\n\nScaffold-derived UI components under components/ui originate from shadcn and Base UI; their MIT notices are included under third-party/. The project license does not replace upstream terms.\n\n| Package | Version | Declared license | Bundled notices |\n|---|---|---|---|\n`+entries.map(e=>`| ${e.name} | ${e.version} | ${e.license} | ${e.licenseFiles.length ? e.licenseFiles.map(f=>`[${path.basename(f)}](${f})`).join(', ') : 'See upstream repository in docs/dependency-licenses.json'} |`).join('\n')+'\n');
console.log(`Recorded ${entries.length} direct dependency licenses.`);
