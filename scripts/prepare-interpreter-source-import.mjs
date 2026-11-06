import fs from 'node:fs'
const [input,output]=process.argv.slice(2)
if(!input||!output) throw new Error('Usage: node scripts/prepare-interpreter-source-import.mjs input.json output.sql')
const records=JSON.parse(fs.readFileSync(input,'utf8'))
const json=JSON.stringify(records).replaceAll("'","''")
fs.writeFileSync(output,`begin;
insert into ichikara.interpreter_sources(source_key,sheet,row_number,candidate_name,raw_data)
select source_key,sheet,row_number,candidate_name,raw_data
from jsonb_to_recordset('${json}'::jsonb)
as x(source_key text,sheet text,row_number integer,candidate_name text,raw_data jsonb)
on conflict(source_key) do nothing;
commit;
`)
console.log(`Prepared ${records.length} source rows. No identity, completed work or current fee is inferred.`)
