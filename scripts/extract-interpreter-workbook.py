"""Read-only extraction: preserve source cells and formula caches for human review."""
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path
import openpyxl

source, output = map(Path, sys.argv[1:3])
digest = hashlib.sha256(source.read_bytes()).hexdigest()
formulas = openpyxl.load_workbook(source, read_only=True, data_only=False)
cached = openpyxl.load_workbook(source, read_only=True, data_only=True)
starts = {'Rate Customer- Int.Reguler': 5, 'Rate Int.': 4, 'Sales Rate Basic': 7,
          'Rate Paragon': 13, 'Rate Int. Project': 2, 'List Quotation 2026': 1, 'List Quotation 2025': 1}
def value(v):
    return v.isoformat() if isinstance(v, (datetime.date, datetime.time, datetime.datetime)) else v
records = []
for sheet, start in starts.items():
    current_name = ''
    current_company = ''
    for row_number, (row, cached_row) in enumerate(zip(formulas[sheet], cached[sheet]), 1):
        cells = {c.coordinate: ({'formula': c.value, 'cached': value(cc.value)} if c.data_type == 'f' else value(c.value))
                 for c, cc in zip(row, cached_row) if c.value is not None}
        if not cells or row_number < start:
            continue
        vals = {c.column_letter: c.value for c in row if c.value is not None}
        if sheet.startswith('List Quotation'):
            if not any('Q.' in str(v) for v in vals.values()):
                continue
        if sheet == 'Rate Paragon' and not isinstance(vals.get('C'), (int, float)):
            continue
        if sheet in ('Rate Int.', 'Rate Int. Project'):
            if vals.get('B'):
                current_name = re.sub(r'^\d+\.\s*', '', str(vals['B'])).strip(' :')
        elif sheet == 'Rate Customer- Int.Reguler':
            if vals.get('L'):
                current_name = str(vals['L']).strip()
        elif sheet == 'Sales Rate Basic':
            current_name = str(vals.get('U') or '')
        elif sheet == 'Rate Paragon':
            current_name = str(vals.get('R') or '')
        else:
            current_name = ''
        if sheet in ('Sales Rate Basic', 'Rate Customer- Int.Reguler') and vals.get('B'):
            current_company = str(vals['B'])
        if current_company:
            cells['_company_context'] = current_company
        records.append({'source_key': f'{digest}:{sheet}:{row_number}', 'sheet': sheet,
                        'row_number': row_number, 'candidate_name': current_name, 'raw_data': cells})
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'records': len(records), 'sha256': digest,
                  'sheets': {s: sum(r['sheet'] == s for r in records) for s in starts}}, ensure_ascii=False))
