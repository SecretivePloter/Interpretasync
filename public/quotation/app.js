/* ============================================================
   ICHIKARA QUOTATION GENERATOR
   Exact match layout: Q.099.FIBM.INT.9.VI.2026
   ============================================================ */
'use strict';

// ── State ─────────────────────────────────────────────────────
const S = {
  days:    [],   // { date, month, type, labelJP, labelID, activity }
  logoSrc: 'logo.png',
};

// ── Preset Price Items ─────────────────────────────────────────
const PRESETS = [
  {
    key:'standard',
    jp:'特別料金8時間',
    id:'Hari kerja biasa',
    defBase:3000000, defPph:2, defQ1:1, defS1:'times', defQ2:1, defS2:'person'
  },
  {
    key:'transport',
    jp:'日当たりの交通費',
    id:'Biaya transportasi per kedatangan',
    defBase:300000, defPph:2, defQ1:1, defS1:'times', defQ2:1, defS2:'person'
  },
  {
    key:'transmit',
    jp:'通訳ツールの支払い（送信機）',
    id:'Transmitter',
    defBase:200000, defPph:2, defQ1:1, defS1:'times', defQ2:2, defS2:'pcs'
  },
  {
    key:'receive',
    jp:'通訳ツールの支払い（受信機）',
    id:'Receiver',
    defBase:200000, defPph:2, defQ1:1, defS1:'times', defQ2:8, defS2:'pcs'
  },
  {
    key:'holiday',
    jp:'祝日料金（国民の祝日）',
    id:'Tanggal Merah Nasional',
    defBase:4500000, defPph:2, defQ1:1, defS1:'times', defQ2:1, defS2:'person'
  },
  {
    key:'overtime',
    jp:'残業（時間外労働）',
    id:'Lembur / Overtime',
    defBase:300000, defPph:2, defQ1:1, defS1:'jam', defQ2:1, defS2:'person'
  },
];

// ── Constants ─────────────────────────────────────────────────
const MON_ID = ['','Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];
const MON_JP = ['','1月','2月','3月','4月','5月','6月',
                '7月','8月','9月','10月','11月','12月'];
const DAY_JP = ['日','月','火','水','木','金','土'];
const DAY_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const TYPE_DEFAULT = {
  special:  { jp:'特別料金8時間', id:'Hari kerja biasa (special)' },
  standard: { jp:'標準料金8時間', id:'Hari kerja biasa'           },
  halfday:  { jp:'半日料金',      id:'Hari kerja biasa (half day)'},
  overtime: { jp:'残業',          id:'Overtime / Lembur'          },
};

// ── Tab navigation ─────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`pane-${idx}`).classList.add('active');
  });
});

// ── Build Preset UI ────────────────────────────────────────────
function buildPresetUI() {
  const container = document.getElementById('preset-container');
  if (!container) return;
  container.innerHTML = PRESETS.map(p => `
    <div class="preset-row">
      <label class="preset-label">
        <input type="checkbox" id="pc_${p.key}"
          onchange="togglePreset('${p.key}')"/>
        <div>
          <span class="pl-jp">${escH(p.jp)}</span>
          <span class="pl-id">${escH(p.id)}</span>
        </div>
      </label>
      <div class="preset-fields" id="pf_${p.key}" style="display:none">
        <div class="pf-grid">
          <div>
            <span class="mini-lbl">Harga Dasar (Rp)</span>
            <input id="pbase_${p.key}" type="number" value="${p.defBase}"/>
          </div>
          <div>
            <span class="mini-lbl">PPH %</span>
            <input id="ppph_${p.key}" type="number" value="${p.defPph}" step="0.1" style="width:55px"/>
          </div>
        </div>
        <div class="pf-grid">
          <div>
            <span class="mini-lbl">Qty 1</span>
            <input id="pq1_${p.key}" type="number" value="${p.defQ1}" min="0" style="width:55px"/>
          </div>
          <div>
            <span class="mini-lbl">Satuan 1</span>
            <input id="ps1_${p.key}" type="text" value="${p.defS1}" style="width:65px"/>
          </div>
          <div>
            <span class="mini-lbl">Qty 2</span>
            <input id="pq2_${p.key}" type="number" value="${p.defQ2}" min="0" style="width:55px"/>
          </div>
          <div>
            <span class="mini-lbl">Satuan 2</span>
            <input id="ps2_${p.key}" type="text" value="${p.defS2}" style="width:65px"/>
          </div>
        </div>
      </div>
    </div>`).join('');
}

function togglePreset(key) {
  const cb     = document.getElementById(`pc_${key}`);
  const fields = document.getElementById(`pf_${key}`);
  if (cb && fields) {
    fields.style.display = cb.checked ? 'block' : 'none';
  }
  renderQuotation();
}

// ── Helpers ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const v = id => ($( id) ? $(id).value : '');

function fmtRp(n) {
  const r = Math.round(n);
  return 'Rp ' + r.toLocaleString('id-ID');
}

function parseDateID(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${MON_ID[d.getMonth()+1]} ${d.getFullYear()}`;
}

function parseDateJP(iso, city) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const c = city || 'チカラン';
  return `${c}、${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function cityToKatakana(city) {
  const map = {
    'cikarang':'チカラン', 'jakarta':'ジャカルタ', 'bekasi':'ベカシ',
    'karawang':'カラワン','purwakarta':'プルワカルタ','bandung':'バンドゥン',
    'surabaya':'スラバヤ','semarang':'スマラン','medan':'メダン',
  };
  return map[(city||'').toLowerCase()] || 'チカラン';
}

function dayOfWeek(date, month, year) {
  return new Date(year, month-1, date).getDay(); // 0=Sun
}

// Circled number ①②… seperti pada quotation asli (1–50)
function circled(n) {
  if (n >= 1  && n <= 20) return String.fromCharCode(0x2460 + n - 1);   // ①–⑳
  if (n >= 21 && n <= 35) return String.fromCharCode(0x3251 + n - 21);  // ㉑–㉟
  if (n >= 36 && n <= 50) return String.fromCharCode(0x32B1 + n - 36);  // ㊱–㊿
  return String(n);
}

function schYear()  { return parseInt(v('sch_year'))  || new Date().getFullYear(); }
function schMonth() { return parseInt(v('sch_month')) || (new Date().getMonth()+1); }

// ── Day management ─────────────────────────────────────────────
function dayKey(m, d) { return `${m}-${d}`; }

function addDay() {
  const date  = parseInt(v('ad_date'));
  const month = parseInt(v('ad_month')) || schMonth();
  const type  = v('ad_type');
  const labelJP = v('ad_jp').trim() || TYPE_DEFAULT[type].jp;
  const labelID = TYPE_DEFAULT[type].id;
  const activity = v('ad_act').trim();

  if (!date || date < 1 || date > 31) { alert('Tanggal tidak valid'); return; }

  const existing = S.days.findIndex(d => d.date === date && d.month === month);
  if (existing >= 0) {
    if (!confirm(`Tanggal ${date} ${MON_ID[month]} sudah ada. Ganti?`)) return;
    S.days[existing] = { date, month, type, labelJP, labelID, activity };
  } else {
    S.days.push({ date, month, type, labelJP, labelID, activity });
    S.days.sort((a,b) => (a.month*100 + a.date) - (b.month*100 + b.date));
  }
  $('ad_date').value = '';
  $('ad_act').value  = '';
  $('ad_jp').value   = '';
  renderDayList(); renderQuotation();
}

function removeDay(month, date) {
  S.days = S.days.filter(d => !(d.date === date && d.month === month));
  renderDayList(); renderQuotation();
}

function renderDayList() {
  const el = $('day-list');
  if (!S.days.length) { el.innerHTML='<p style="font-size:10px;color:#aaa;text-align:center;margin-top:6px">Belum ada hari kerja</p>'; return; }
  el.innerHTML = S.days.map(d => `
    <div class="day-item">
      <div class="di-main">
        <span class="di-date">${d.date} ${MON_ID[d.month] || ''}</span>
        <span class="di-meta"> — ${d.labelJP} / ${d.labelID}${d.activity?' · '+d.activity:''}</span>
      </div>
      <button class="btn-del" onclick="removeDay(${d.month},${d.date})" title="Hapus">✕</button>
    </div>`).join('');
}

// ── Price helpers ──────────────────────────────────────────────
function calcPrice(item) {
  const hpu   = item.base * (1 + item.pph / 100);
  const total = hpu * item.q1 * item.q2;
  return { hpu, total };
}

function getActivePresets() {
  return PRESETS.filter(p => {
    const cb = document.getElementById(`pc_${p.key}`);
    return cb && cb.checked;
  }).map(p => ({
    jp:   p.jp,
    id:   p.id,
    base: parseFloat(v(`pbase_${p.key}`)) || p.defBase,
    pph:  parseFloat(v(`ppph_${p.key}`))  || p.defPph,
    q1:   parseFloat(v(`pq1_${p.key}`))   || 0,
    s1:   v(`ps1_${p.key}`)               || p.defS1,
    q2:   parseFloat(v(`pq2_${p.key}`))   || 0,
    s2:   v(`ps2_${p.key}`)               || p.defS2,
  }));
}

function updateSidebarTotal() {
  let grand = 0;
  getActivePresets().forEach(p => { grand += calcPrice(p).total; });
  const el = $('sb-total');
  if (el) el.textContent = fmtRp(grand);
}

// ── Calendar data (shared HTML + Excel) ────────────────────────
// Rentang kalender: Senin pada minggu tanggal kerja pertama s.d.
// Minggu pada minggu tanggal kerja terakhir (minggu penuh).
function buildCalendarData() {
  if (!S.days.length) return null;
  const year = schYear();
  const defM = schMonth();

  // Normalisasi: data lama tanpa bulan → pakai bulan jadwal global
  S.days.forEach(d => { if (!d.month) d.month = defM; });

  const sel = {};
  S.days.forEach(d => { sel[dayKey(d.month, d.date)] = d; });

  const ds = S.days
    .map(d => new Date(year, d.month - 1, d.date))
    .sort((a, b) => a - b);

  const start = new Date(ds[0]);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));     // mundur ke Senin
  const end = new Date(ds[ds.length - 1]);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));           // maju ke Minggu

  const cols = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    cols.push({
      date:  d.getDate(),
      month: d.getMonth() + 1,
      dow:   d.getDay(),
      key:   dayKey(d.getMonth() + 1, d.getDate()),
    });
  }

  // Span bulan untuk baris header
  const spans = [];
  cols.forEach(c => {
    const last = spans[spans.length - 1];
    if (last && last.month === c.month) last.count++;
    else spans.push({ month: c.month, count: 1 });
  });

  // Grup baris per label
  const groups = [];
  S.days.forEach(d => {
    const key = d.labelJP + '|' + d.labelID;
    let g = groups.find(x => x.key === key);
    if (!g) {
      g = { key, labelJP: d.labelJP, labelID: d.labelID, activity: d.activity, keys: new Set() };
      groups.push(g);
    }
    g.keys.add(dayKey(d.month, d.date));
    if (!g.activity && d.activity) g.activity = d.activity;
  });

  return { year, cols, spans, groups, sel };
}

// ── Build Schedule (calendar) Table HTML ───────────────────────
function buildScheduleTable() {
  const cal = buildCalendarData();
  if (!cal) {
    return '<p style="font-size:7.3pt;color:#999;text-align:center;padding:2mm">Belum ada jadwal</p>';
  }
  const tempat = v('sch_tempat');
  const N = cal.cols.length;

  // Baris 1: Bulan + span nama bulan + Total (rowspan 3)
  const monthCells = cal.spans.map(s =>
    `<th colspan="${s.count}" class="cal-month">${MON_ID[s.month]} / <span class="data-jp">${MON_JP[s.month]}</span></th>`
  ).join('');

  // Baris 2: Tanggal
  const dateCells = cal.cols.map(c => {
    const wk  = (c.dow === 0 || c.dow === 6);
    const seld = cal.sel[c.key];
    const txt = seld ? `<span class="cal-sel">${circled(c.date)}</span>` : c.date;
    return `<td class="${wk ? 'wkend wkend-txt' : ''}">${txt}</td>`;
  }).join('');

  // Baris 3: Hari
  const dayCells = cal.cols.map(c => {
    const wk = (c.dow === 0 || c.dow === 6);
    return `<td class="${wk ? 'wkend wkend-txt' : ''}"><span class="data-jp">${DAY_JP[c.dow]}</span><br/><span class="cal-dayid">${DAY_ID[c.dow]}</span></td>`;
  }).join('');

  // Baris data per grup
  const dataRows = cal.groups.map(g => {
    const cells = cal.cols.map(c => {
      const wk = (c.dow === 0 || c.dow === 6);
      return `<td class="${wk ? 'wkend' : ''}">${g.keys.has(c.key) ? '1' : ''}</td>`;
    }).join('');
    return `<tr>
      <td class="lbl-col"><span class="data-jp">${escH(g.labelJP)}</span><br/>${escH(g.labelID)}${g.activity ? ' ('+escH(g.activity)+')' : ''}</td>
      ${cells}
      <td class="total-col">${g.keys.size}</td>
    </tr>`;
  }).join('');

  return `<table class="q-sch-table">
    <colgroup>
      <col style="width:30mm"/>
      ${cal.cols.map(() => '<col/>').join('')}
      <col style="width:10mm"/>
    </colgroup>
    <tbody>
      <tr class="hdr-row">
        <th class="lbl-col">Bulan / <span class="data-jp">月</span></th>
        ${monthCells}
        <th rowspan="3" class="total-col">Total<br/><span class="data-jp">合計</span></th>
      </tr>
      <tr class="hdr-row">
        <th class="lbl-col" style="text-align:left">Tanggal</th>
        ${dateCells}
      </tr>
      <tr class="sub-row">
        <td class="lbl-col">Hari / <span class="data-jp">曜日</span></td>
        ${dayCells}
      </tr>
      ${dataRows}
      <tr>
        <td colspan="${N + 2}" class="tempat-row" style="text-align:left">
          Tempat : ${escH(tempat)}
        </td>
      </tr>
    </tbody>
  </table>`;
}

// ── Build Price Table HTML ─────────────────────────────────────
function buildPriceTable() {
  const items = getActivePresets();
  if (!items.length) {
    return '<p style="font-size:7.3pt;color:#999;text-align:center;padding:2mm">Belum ada item harga dipilih</p>';
  }
  let grand = 0;
  const rows = items.map(p => {
    const { hpu, total } = calcPrice(p);
    grand += total;
    return `<tr>
      <td class="desc-cell">
        <span class="dj">${escH(p.jp)}</span>${p.jp && p.id ? '<br/>' : ''}${escH(p.id)}
      </td>
      <td class="num-cell">${fmtRp(hpu)}</td>
      <td class="keb-cell">${p.q1} ${escH(p.s1)}<br/>${p.q2} ${escH(p.s2)}</td>
      <td class="num-cell"><strong>${fmtRp(total)}</strong></td>
    </tr>`;
  }).join('');

  return `<table class="q-price-table">
    <colgroup>
      <col class="col-desc"/><col class="col-harga"/>
      <col class="col-keb"/><col class="col-total"/>
    </colgroup>
    <thead>
      <tr>
        <th class="ph-jp"><span class="jp">内容</span></th>
        <th class="ph-jp"><span class="jp">単価</span></th>
        <th class="ph-jp"><span class="jp">必要数</span></th>
        <th class="ph-jp"><span class="jp">合計</span></th>
      </tr>
      <tr>
        <th class="ph-id">konten</th>
        <th class="ph-id">harga per unit</th>
        <th class="ph-id">kebutuhan</th>
        <th class="ph-id">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align:right"><span class="jp">合計</span> / Total</td>
        <td class="total-val">${fmtRp(grand)}</td>
      </tr>
    </tfoot>
  </table>`;
}

// ── Build Service Table HTML ───────────────────────────────────
function buildServiceTable() {
  const code    = v('cl_code')   || 'Client';
  const svcJP   = v('svc_jp')   || '通訳';
  const svcID   = v('svc_id')   || 'Interpreter';
  const pic     = v('svc_pic')  || '';
  const act     = v('svc_activity') || '';
  const interp  = v('svc_interp')   || '';
  const periode = v('svc_periode')  || '';

  return `<table class="q-svc-table">
    <colgroup>
      <col style="width:18%"/>
      <col style="width:22%"/>
      <col style="width:22%"/>
      <col style="width:24%"/>
      <col style="width:14%"/>
    </colgroup>
    <tbody>
      <tr>
        <th class="th-jp"><span class="jp">サービス</span></th>
        <th class="th-jp"><span class="jp">${escH(code)} 御中</span></th>
        <th class="th-jp"><span class="jp">活動</span></th>
        <th class="th-jp"><span class="jp">通訳者</span></th>
        <th class="th-jp"><span class="jp">期間</span></th>
      </tr>
      <tr>
        <th class="th-id">Layanan</th>
        <th class="th-id">${escH(code)} PIC</th>
        <th class="th-id">Aktivitas</th>
        <th class="th-id">Interpreter</th>
        <th class="th-id">Periode</th>
      </tr>
      <tr>
        <td><span class="jp">${escH(svcJP)}</span><br/>${escH(svcID)}</td>
        <td>${escH(pic)}</td>
        <td>${escH(act)}</td>
        <td>${escH(interp)}</td>
        <td>${escH(periode)}</td>
      </tr>
    </tbody>
  </table>`;
}

// ── HTML escape ────────────────────────────────────────────────
function escH(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Main render ────────────────────────────────────────────────
function renderQuotation() {
  const iso    = v('q_date');
  const city   = v('q_city') || 'Cikarang';
  const cityJP = cityToKatakana(city);
  const dateID = parseDateID(iso);
  const dateJP = parseDateJP(iso, cityJP);

  const qNo      = v('q_no')   || 'No. _____';
  const clShort  = v('cl_short') || '________________';
  const clPT     = v('cl_pt')    || '________________';
  const clAttn   = v('cl_attn');
  const clTTD    = v('cl_ttd') || clPT;
  const signer   = 'Risma N.';
  const payTerm  = v('oth_payment') || '1 minggu';

  // Grand total for sidebar
  updateSidebarTotal();

  const html = `
<div class="q-doc">

  <!-- ═══ HEADER ═══ -->
  <div class="q-header">
    <div class="q-logo-block">
      <img src="${S.logoSrc}" alt="PT Ichikara"
        onerror="this.outerHTML='<span class=logo-fallback>PT Ichikara</span>'"/>
    </div>
    <div class="q-company-block">
      <div class="co-name">PT. Ichikara</div>
      <div class="co-addr">Ruko Melawai Blok A No.31</div>
      <div class="co-addr">Lembah Hijau - Lippo Cikarang 17550 Bekasi</div>
      <div class="co-addr">Telp: 021-8990-6912</div>
      <div class="co-addr">Website: www.ichikara.co.id</div>
    </div>
  </div>

  <hr class="q-hrule"/>

  <!-- ═══ META (Kepada + No/Date) ═══ -->
  <div class="q-meta">
    <div class="q-to">
      <div class="q-to-label">Kepada Yth.</div>
      <div class="q-to-client">${escH(clShort)}　<span class="jp">御中</span></div>
      <div class="q-to-client">${escH(clPT)}</div>
      ${clAttn ? `<div class="q-to-attn">Attn : ${escH(clAttn)}</div>` : ''}
    </div>
    <div class="q-no-block">
      <div class="qno">No. ${escH(qNo)}</div>
      ${dateJP ? `<div class="qdate jp">${escH(dateJP)}</div>` : ''}
      ${dateID ? `<div class="qdate">${escH(city)},${dateID}</div>` : ''}
    </div>
  </div>

  <!-- ═══ TITLE ═══ -->
  <div class="q-title">
    <span class="t-jp jp">お見積書</span>
    <span class="t-id">QUOTATION</span>
  </div>

  <!-- ═══ GREETING ═══ -->
  <div class="q-greeting">
    <div class="gr-jp jp">拝啓　上記の通り、通訳費用のお見積もりを申し上げます。</div>
    <div class="gr-id">Dengan Hormat,</div>
    <div class="gr-id">Bersama ini kami kirimkan surat penawaran harga untuk rencana penggunaan Jasa Interpreter sesuai dengan permintaan.</div>
  </div>

  <!-- ═══ BOX UTAMA: LAYANAN + JADWAL + HARGA ═══ -->
  <table class="q-main">
    <colgroup>
      <col style="width:20mm"/>
      <col/>
    </colgroup>
    <tbody>
      <tr>
        <td class="outer-lbl"><span class="jp">サービス</span><br/>Layanan</td>
        <td class="outer-cell">${buildServiceTable()}</td>
      </tr>
      <tr>
        <td class="outer-lbl"><span class="jp">スケジュール</span><br/>Jadwal</td>
        <td class="outer-cell"><div class="q-sch-wrap">${buildScheduleTable()}</div></td>
      </tr>
      <tr>
        <td class="outer-lbl"><span class="jp">フィー</span><br/>Price</td>
        <td class="outer-cell">${buildPriceTable()}</td>
      </tr>
    </tbody>
  </table>

  <!-- ═══ NOTES ═══ -->
  <div class="q-notes">
    <span class="nb-label">Nb.</span>
    <ul>
      <li>
        <span class="nj jp">２パーセントの税23の費用は上記の値（に含まれております。</span><br/>
        Pph23 sebesar 2% sudah termasuk di dalam biaya di atas.
      </li>
      <li>
        <span class="nj jp">インボイスは、業務終了日にお渡しします。</span><br/>
        Invoice diserahkan pada hari akhir bertugas.
      </li>
      <li>
        <span class="nj jp">支払いはBCA銀行 Lippo Cikarang支店 PT. Ichikara名義口座 No.522 031 5080 にお振り込みください。支払いはインボイス受領後${escH(payTerm)}以内となっております。</span><br/>
        Untuk pembayarannya via transfer ke bank BCA Cab.Lippo Cikarang a/n PT. Ichikara No.Rek.522 031 5080 paling lambat ${escH(payTerm)} sejak invoice diterima.
      </li>
    </ul>
  </div>

  <!-- ═══ CLOSING ═══ -->
  <div class="q-closing">
    <div class="cj jp">上記の通り、何卒ご用命の程お願い申し上げます。</div>
    <div class="cj jp">敬具</div>
    <div>Demikian penawaran ini, kiranya kami dapat bekerja sama dengan perusahaan Bapak/Ibu kembali.</div>
    <div>Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</div>
  </div>

  <!-- ═══ SIGNATURES ═══ -->
  <div class="q-sigs">
    <!-- LEFT: Ichikara -->
    <div class="q-sig">
      <div>Hormat kami,</div>
      <div class="sg-label jp">いちから株式会社</div>
      <div class="sg-id">PT Ichikara</div>
      <div class="sg-ttd">
        <img src="ttd.png" alt="Stempel &amp; TTD" style="max-height:20mm;max-width:40mm;display:block;margin-left:-6mm"
          onerror="this.style.display='none'"/>
      </div>
      <div class="sg-name">${escH(signer)}</div>
    </div>

    <!-- RIGHT: Client -->
    <div class="q-sig" style="text-align:center; padding-top:10mm">
      <div><span class="jp">承認　</span>Disetujui</div>
      <div class="sg-co">${escH(clTTD)}</div>
      <div style="margin-top:12mm">(                                              )</div>
    </div>
  </div>

</div><!-- /q-doc -->`;

  $('quotation').innerHTML = html;
}

// ── Image upload ───────────────────────────────────────────────
function uploadImg(type) {
  const input = $(type === 'logo' ? 'upload_logo' : 'upload_ttd');
  const file  = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (type === 'logo') S.logoSrc = e.target.result;
    else                 S.ttdSrc  = e.target.result;
    renderQuotation();
  };
  reader.readAsDataURL(file);
}

// ── Reset ──────────────────────────────────────────────────────
function resetAll() {
  if (!confirm('Reset semua data?')) return;
  document.querySelectorAll('input[type=text],input[type=number],input[type=date]').forEach(el => {
    el.value = el.defaultValue || '';
  });
  document.querySelectorAll('select').forEach(el => { el.selectedIndex = 0; });
  S.days = [];
  S.logoSrc = 'logo.png';
  // Uncheck all preset items
  PRESETS.forEach(p => {
    const cb = $(`pc_${p.key}`);
    const pf = $(`pf_${p.key}`);
    if (cb) cb.checked = false;
    if (pf) pf.style.display = 'none';
    // Reset fields to defaults
    if ($(`pbase_${p.key}`)) $(`pbase_${p.key}`).value = p.defBase;
    if ($(`ppph_${p.key}`))  $(`ppph_${p.key}`).value  = p.defPph;
    if ($(`pq1_${p.key}`))   $(`pq1_${p.key}`).value   = p.defQ1;
    if ($(`ps1_${p.key}`))   $(`ps1_${p.key}`).value   = p.defS1;
    if ($(`pq2_${p.key}`))   $(`pq2_${p.key}`).value   = p.defQ2;
    if ($(`ps2_${p.key}`))   $(`ps2_${p.key}`).value   = p.defS2;
  });
  renderDayList(); renderQuotation();
}

// ── Load Sample (FIBM) ────────────────────────────────────────
function loadSample() {
  $('q_no').value        = 'Q.099.FIBM.INT.9.VI.2026';
  $('q_date').value      = '2026-06-09';
  $('q_city').value      = 'Cikarang';
  $('cl_short').value    = 'Furukawa Indomobil Battery Manufacturing';
  $('cl_pt').value       = 'PT. Furukawa Indomobil Battery Manufacturing';
  $('cl_code').value     = 'FIBM';
  $('cl_attn').value     = 'Ibu Indira Kinanthi';
  $('cl_ttd').value      = 'PT. Furukawa Indomobil Battery Manufacturing';
  $('svc_jp').value      = '通訳';
  $('svc_id').value      = 'Interpreter';
  $('svc_pic').value     = 'Ibu Indira Kinanthi';
  $('svc_activity').value= 'Quality Audit';
  $('svc_interp').value  = 'Bp. Arief S.';
  $('svc_periode').value = '22 Juni 2026';
  $('sch_month').value   = '6';
  $('sch_year').value    = '2026';
  if ($('ad_month')) $('ad_month').value = '6';
  $('sch_tempat').value  = 'PT. Furukawa Indomobil  - Purwakarta';
  $('oth_payment').value = '1 minggu';

  S.days = [
    { date:22, month:6, type:'standard', labelJP:'特別料金8時間', labelID:'Hari kerja biasa', activity:'Quality Audit' },
  ];

  // Reset all presets first, then check the ones used in this sample
  PRESETS.forEach(p => {
    const cb = $(`pc_${p.key}`);
    const pf = $(`pf_${p.key}`);
    if (cb) cb.checked = false;
    if (pf) pf.style.display = 'none';
  });
  ['standard','transport','transmit','receive'].forEach(key => {
    const cb = $(`pc_${key}`);
    const pf = $(`pf_${key}`);
    if (cb) { cb.checked = true; }
    if (pf) { pf.style.display = 'block'; }
  });
  // Set specific quantities for equipment
  if ($('pq2_transmit')) $('pq2_transmit').value = '2';
  if ($('pq2_receive'))  $('pq2_receive').value  = '8';

  renderDayList(); renderQuotation();
}

// ── Export PDF (html2canvas + jsPDF — identik dengan preview) ──
async function exportPDF() {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('Library PDF belum dimuat. Pastikan ada koneksi internet saat pertama kali membuka halaman ini.');
    return;
  }
  const el = document.querySelector('.q-doc');
  if (!el) { alert('Dokumen belum dirender.'); return; }

  const qNo  = v('q_no') || 'Quotation';
  const safe = qNo.replace(/[/\\?%*:|"<>]/g, '-');

  const btn = document.querySelector('[onclick="exportPDF()"]');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳ Memproses...'; btn.disabled = true; }

  // Render dari klon di posisi (0,0) agar bebas dari offset scroll container
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;left:0;top:0;background:#fff;z-index:-9999;pointer-events:none;';
  const clone = el.cloneNode(true);
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf  = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
    const pw   = 210, ph = 297;
    const imgH = canvas.height * pw / canvas.width;
    const img  = canvas.toDataURL('image/jpeg', 0.97);

    if (imgH <= ph + 1) {
      pdf.addImage(img, 'JPEG', 0, 0, pw, imgH);
    } else {
      // Multi-halaman: geser gambar ke atas per halaman
      let remaining = imgH, pos = 0, first = true;
      while (remaining > 0.5) {
        if (!first) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, -pos, pw, imgH);
        remaining -= ph;
        pos += ph;
        first = false;
      }
    }
    pdf.save(`${safe}.pdf`);
  } catch (err) {
    console.error('Export PDF gagal:', err);
    alert('Export PDF gagal: ' + err.message);
  } finally {
    wrap.remove();
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  }
}

// ── Export Excel (layout identik dengan preview/PDF, siap print) ──
async function imgArrayBuffer(src) {
  try {
    if (src.startsWith('data:')) {
      const b64 = src.split(',')[1];
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    }
    const r = await fetch(src);
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch (e) { return null; }
}

async function exportExcel() {
  if (typeof ExcelJS === 'undefined') {
    alert('Library ExcelJS belum dimuat. Pastikan ada koneksi internet saat pertama kali membuka halaman ini.');
    return;
  }
  try {

  // ── Collect values ────────────────────────────────────────────
  const iso     = v('q_date');
  const city    = v('q_city')    || 'Cikarang';
  const cityJP  = cityToKatakana(city);
  const dateID  = parseDateID(iso);
  const dateJP  = parseDateJP(iso, cityJP);
  const qNo     = v('q_no')         || 'Quotation';
  const clShort = v('cl_short')     || '';
  const clPT    = v('cl_pt')        || '';
  const clAttn  = v('cl_attn')      || '';
  const clTTD   = v('cl_ttd')       || clPT;
  const payTerm = v('oth_payment')  || '1 minggu';
  const code    = v('cl_code')      || 'Client';
  const svcJP   = v('svc_jp')       || '通訳';
  const svcID   = v('svc_id')       || 'Interpreter';
  const pic     = v('svc_pic')      || '';
  const act     = v('svc_activity') || '';
  const interp  = v('svc_interp')   || '';
  const periode = v('svc_periode')  || '';
  const tempat  = v('sch_tempat')   || '';
  const items   = getActivePresets();
  const cal     = buildCalendarData();

  // ── Grid model ────────────────────────────────────────────────
  // col 1 = label luar (サービス/スケジュール/フィー)
  // col 2 = label dalam jadwal, col 3..(2+N) = tanggal, col terakhir = Total
  const N = cal ? cal.cols.length : 7;
  const T = 2 + N + 1;              // total kolom grid

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PT Ichikara Quotation Generator';
  const ws = wb.addWorksheet('Quotation', {
    pageSetup: {
      paperSize: 9, orientation: 'portrait',
      fitToPage: true, fitToWidth: 1, fitToHeight: 1,
      horizontalCentered: true,
      margins: { left:0.3, right:0.3, top:0.35, bottom:0.35, header:0.1, footer:0.1 },
    },
  });

  const colDefs = [{ width: 11 }, { width: 17 }];
  for (let i = 0; i < N; i++) colDefs.push({ width: 4.2 });
  colDefs.push({ width: 9 });
  ws.columns = colDefs;

  // ── Style helpers ─────────────────────────────────────────────
  const fnt = (size, bold, color, name) =>
    ({ name: name || 'Arial', size: size || 8, bold: !!bold, color: { argb: color || 'FF000000' } });
  const FNT_JP  = 'MS PGothic';
  const FNT_TNR = 'Times New Roman';
  const RED     = 'FFC00000';
  const GRAY    = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFD9D9D9' } };
  const THIN    = { style:'thin',   color:{ argb:'FF000000' } };
  const MED     = { style:'medium', color:{ argb:'FF000000' } };

  let R = 1; // row pointer

  // tulis 1 sel logis (boleh merge), border thin keliling
  function cellBox(r1, c1, r2, c2, value, opt = {}) {
    if (r2 > r1 || c2 > c1) ws.mergeCells(r1, c1, r2, c2);
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const cl = ws.getCell(r, c);
      if (opt.border !== false)
        cl.border = { top: THIN, left: THIN, bottom: THIN, right: THIN };
      if (opt.fill) cl.fill = opt.fill;
    }
    const cell = ws.getCell(r1, c1);
    cell.value = value;
    cell.font  = opt.font || fnt(8);
    cell.alignment = opt.align || { horizontal:'center', vertical:'middle', wrapText:true };
    return cell;
  }

  // teks bebas tanpa border
  function freeText(r, c1, c2, value, opt = {}) {
    if (c2 > c1) ws.mergeCells(r, c1, r, c2);
    const cell = ws.getCell(r, c1);
    cell.value = value;
    cell.font  = opt.font || fnt(8);
    cell.alignment = opt.align || { horizontal:'left', vertical:'middle', wrapText:true };
    return cell;
  }

  // garis luar tebal untuk rentang
  function outline(r1, c1, r2, c2) {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const cl = ws.getCell(r, c);
      const b = Object.assign({}, cl.border || {});
      if (r === r1) b.top    = MED;
      if (r === r2) b.bottom = MED;
      if (c === c1) b.left   = MED;
      if (c === c2) b.right  = MED;
      cl.border = b;
    }
  }

  // bagi kolom 2..T menjadi n segmen
  function splitCols(parts) {
    const startCol = 2, total = T - startCol + 1, res = [];
    let s = startCol;
    for (let i = 0; i < parts; i++) {
      const size = Math.floor(total * (i + 1) / parts) - Math.floor(total * i / parts);
      res.push([s, s + size - 1]);
      s += size;
    }
    return res;
  }

  // ── HEADER perusahaan ─────────────────────────────────────────
  const logoBuf = await imgArrayBuffer(S.logoSrc);
  if (logoBuf) {
    const imgId = wb.addImage({ buffer: logoBuf, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 200, height: 70 } });
  } else {
    freeText(R, 1, 3, 'PT Ichikara', { font: fnt(16, true, 'FF1A56A0', FNT_TNR) });
  }
  const mid = Math.ceil(T / 2);
  freeText(R, mid, T, 'PT. Ichikara', { font: fnt(12, true, null, FNT_TNR), align:{ horizontal:'center', vertical:'middle' } });
  ws.getRow(R).height = 16; R++;
  ['Ruko Melawai Blok A No.31',
   'Lembah Hijau - Lippo Cikarang 17550 Bekasi',
   'Telp: 021-8990-6912',
   'Website: www.ichikara.co.id'].forEach(txt => {
    freeText(R, mid, T, txt, { font: fnt(10, false, null, FNT_TNR), align:{ horizontal:'center', vertical:'middle' } });
    ws.getRow(R).height = 13; R++;
  });

  // garis tebal (hrule)
  for (let c = 1; c <= T; c++) ws.getCell(R, c).border = { bottom: { style:'thick', color:{ argb:'FF000000' } } };
  ws.getRow(R).height = 4; R++;

  // ── META: Kepada + No/Tanggal ─────────────────────────────────
  freeText(R, 1, mid - 1, 'Kepada Yth.', { font: fnt(8) });
  freeText(R, mid, T, `No. ${qNo}`, { font: fnt(8), align:{ horizontal:'right', vertical:'middle' } });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, mid - 1, `${clShort}　御中`, { font: fnt(8, false, null, FNT_JP) });
  freeText(R, mid, T, dateJP, { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'right', vertical:'middle' } });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, mid - 1, clPT, { font: fnt(8) });
  freeText(R, mid, T, dateID ? `${city},${dateID}` : '', { font: fnt(8), align:{ horizontal:'right', vertical:'middle' } });
  ws.getRow(R).height = 12; R++;
  if (clAttn) {
    freeText(R, 1, mid - 1, `Attn : ${clAttn}`, { font: fnt(8) });
    ws.getRow(R).height = 12; R++;
  }

  // ── TITLE ─────────────────────────────────────────────────────
  freeText(R, 1, T, 'お見積書', { font: fnt(10, true, null, FNT_JP), align:{ horizontal:'center', vertical:'middle' } });
  ws.getRow(R).height = 14; R++;
  freeText(R, 1, T, 'Q U O T A T I O N', { font: fnt(9, true), align:{ horizontal:'center', vertical:'middle' } });
  ws.getRow(R).height = 13; R++;

  // ── GREETING ──────────────────────────────────────────────────
  freeText(R, 1, T, '拝啓　上記の通り、通訳費用のお見積もりを申し上げます。', { font: fnt(8, false, null, FNT_JP) });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, T, 'Dengan Hormat,', { font: fnt(8) });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, T, 'Bersama ini kami kirimkan surat penawaran harga untuk rencana penggunaan Jasa Interpreter sesuai dengan permintaan.', { font: fnt(8) });
  ws.getRow(R).height = 12; R++;

  ws.getRow(R).height = 4; R++; // spacer

  const boxTop = R;

  // ══ SECTION 1: LAYANAN ════════════════════════════════════════
  const svcTop = R;
  const seg5 = splitCols(5);
  const svcHdrJP = ['サービス', `${code} 御中`, '活動', '通訳者', '期間'];
  const svcHdrID = ['Layanan', `${code} PIC`, 'Aktivitas', 'Interpreter', 'Periode'];
  const svcData  = [`${svcJP}\n${svcID}`, pic, act, interp, periode];

  svcHdrJP.forEach((t, i) => cellBox(R, seg5[i][0], R, seg5[i][1], t, { font: fnt(8, true, null, FNT_JP) }));
  ws.getRow(R).height = 13; R++;
  svcHdrID.forEach((t, i) => cellBox(R, seg5[i][0], R, seg5[i][1], t, { font: fnt(8, false, null, FNT_JP) }));
  ws.getRow(R).height = 13; R++;
  svcData.forEach((t, i) => cellBox(R, seg5[i][0], R, seg5[i][1], t, { font: fnt(8, false, null, FNT_JP) }));
  ws.getRow(R).height = 24; R++;
  // label luar
  cellBox(svcTop, 1, R - 1, 1, 'サービス\nLayanan', { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'left', vertical:'top', wrapText:true } });

  // ══ SECTION 2: JADWAL (kalender) ══════════════════════════════
  const schTop = R;
  if (cal) {
    const cDate0 = 3; // kolom tanggal pertama
    // Baris 1: Bulan + span bulan + Total (rowspan 3)
    cellBox(R, 2, R, 2, 'Bulan / 月', { font: fnt(8, true, null, FNT_JP), align:{ horizontal:'left', vertical:'middle', wrapText:true } });
    let cc = cDate0;
    cal.spans.forEach(s => {
      cellBox(R, cc, R, cc + s.count - 1, `${MON_ID[s.month]} / ${MON_JP[s.month]}`, { font: fnt(8, true, null, FNT_JP) });
      cc += s.count;
    });
    cellBox(R, T, R + 2, T, 'Total\n合計', { font: fnt(8, true, null, FNT_JP) });
    ws.getRow(R).height = 13; R++;

    // Baris 2: Tanggal
    cellBox(R, 2, R, 2, 'Tanggal', { font: fnt(8), align:{ horizontal:'left', vertical:'middle' } });
    cal.cols.forEach((c, i) => {
      const wk   = (c.dow === 0 || c.dow === 6);
      const seld = !!cal.sel[c.key];
      cellBox(R, cDate0 + i, R, cDate0 + i, seld ? circled(c.date) : c.date, {
        font: fnt(seld ? 9 : 8, seld, wk ? RED : null, FNT_JP),
        fill: wk ? GRAY : null,
      });
    });
    ws.getRow(R).height = 13; R++;

    // Baris 3: Hari
    cellBox(R, 2, R, 2, 'Hari / 曜日', { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'left', vertical:'middle' } });
    cal.cols.forEach((c, i) => {
      const wk = (c.dow === 0 || c.dow === 6);
      cellBox(R, cDate0 + i, R, cDate0 + i, `${DAY_JP[c.dow]}\n${DAY_ID[c.dow]}`, {
        font: fnt(7, false, wk ? RED : null, FNT_JP),
        fill: wk ? GRAY : null,
      });
    });
    ws.getRow(R).height = 20; R++;

    // Baris data per grup
    cal.groups.forEach(g => {
      cellBox(R, 2, R, 2, `${g.labelJP}\n${g.labelID}${g.activity ? ' ('+g.activity+')' : ''}`, {
        font: fnt(7, false, null, FNT_JP),
        align:{ horizontal:'left', vertical:'middle', wrapText:true },
      });
      cal.cols.forEach((c, i) => {
        const wk = (c.dow === 0 || c.dow === 6);
        cellBox(R, cDate0 + i, R, cDate0 + i, g.keys.has(c.key) ? 1 : '', {
          font: fnt(8), fill: wk ? GRAY : null,
        });
      });
      cellBox(R, T, R, T, g.keys.size, { font: fnt(8, true) });
      ws.getRow(R).height = 22; R++;
    });

    // Tempat
    cellBox(R, 2, R, T, `Tempat : ${tempat}`, { font: fnt(8), align:{ horizontal:'left', vertical:'middle' } });
    ws.getRow(R).height = 13; R++;
  } else {
    cellBox(R, 2, R, T, '(Belum ada jadwal)', { font: { name:'Arial', size:8, italic:true, color:{ argb:'FF999999' } } });
    ws.getRow(R).height = 13; R++;
  }
  cellBox(schTop, 1, R - 1, 1, 'スケジュール\nJadwal', { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'left', vertical:'top', wrapText:true } });

  // ══ SECTION 3: HARGA ══════════════════════════════════════════
  const prcTop = R;
  // 4 segmen proporsional ~ 42/21/22/15 %
  const avail = T - 1; // kolom 2..T
  const w1 = Math.max(1, Math.round(avail * 0.42));
  const w2 = Math.max(1, Math.round(avail * 0.21));
  const w3 = Math.max(1, Math.round(avail * 0.22));
  const seg4 = [
    [2, 1 + w1],
    [2 + w1, 1 + w1 + w2],
    [2 + w1 + w2, 1 + w1 + w2 + w3],
    [2 + w1 + w2 + w3, T],
  ];

  const phJP = ['内容', '単価', '必要数', '合計'];
  const phID = ['konten', 'harga per unit', 'kebutuhan', 'Total'];
  phJP.forEach((t, i) => cellBox(R, seg4[i][0], R, seg4[i][1], t, { font: fnt(8, true, null, FNT_JP) }));
  ws.getRow(R).height = 12; R++;
  phID.forEach((t, i) => cellBox(R, seg4[i][0], R, seg4[i][1], t, { font: fnt(7) }));
  ws.getRow(R).height = 12; R++;

  let grand = 0;
  if (items.length) {
    items.forEach(p => {
      const { hpu, total } = calcPrice(p);
      grand += total;
      cellBox(R, seg4[0][0], R, seg4[0][1], `${p.jp}\n${p.id}`, {
        font: fnt(7, false, null, FNT_JP),
        align:{ horizontal:'left', vertical:'middle', wrapText:true },
      });
      cellBox(R, seg4[1][0], R, seg4[1][1], fmtRp(hpu), { font: fnt(8), align:{ horizontal:'right', vertical:'middle' } });
      cellBox(R, seg4[2][0], R, seg4[2][1], `${p.q1} ${p.s1}\n${p.q2} ${p.s2}`, { font: fnt(7) });
      cellBox(R, seg4[3][0], R, seg4[3][1], fmtRp(total), { font: fnt(8, true), align:{ horizontal:'right', vertical:'middle' } });
      ws.getRow(R).height = 22; R++;
    });
  } else {
    cellBox(R, 2, R, T, '(Tidak ada item harga dipilih)', { font: { name:'Arial', size:8, italic:true, color:{ argb:'FF999999' } } });
    ws.getRow(R).height = 13; R++;
  }
  // Total row
  cellBox(R, seg4[0][0], R, seg4[2][1], '合計 / Total', { font: fnt(8, true, null, FNT_JP), align:{ horizontal:'right', vertical:'middle' } });
  cellBox(R, seg4[3][0], R, seg4[3][1], fmtRp(grand), { font: fnt(8, true), align:{ horizontal:'right', vertical:'middle' } });
  ws.getRow(R).height = 14; R++;
  cellBox(prcTop, 1, R - 1, 1, 'フィー\nPrice', { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'left', vertical:'top', wrapText:true } });

  // garis luar box utama
  outline(boxTop, 1, R - 1, T);

  ws.getRow(R).height = 5; R++; // spacer

  // ── NOTES ─────────────────────────────────────────────────────
  freeText(R, 1, T, 'Nb.', { font: fnt(8) });
  ws.getRow(R).height = 11; R++;
  const notes = [
    ['２パーセントの税23の費用は上記の値（に含まれております。',
     'Pph23 sebesar 2% sudah termasuk di dalam biaya di atas.'],
    ['インボイスは、業務終了日にお渡しします。',
     'Invoice diserahkan pada hari akhir bertugas.'],
    [`支払いはBCA銀行 Lippo Cikarang支店 PT. Ichikara名義口座 No.522 031 5080 にお振り込みください。支払いはインボイス受領後${payTerm}以内となっております。`,
     `Untuk pembayarannya via transfer ke bank BCA Cab.Lippo Cikarang a/n PT. Ichikara No.Rek.522 031 5080 paling lambat ${payTerm} sejak invoice diterima.`],
  ];
  notes.forEach(([jp, id], i) => {
    freeText(R, 1, T, `● ${jp}\n   ${id}`, {
      font: fnt(8, false, null, FNT_JP),
      align:{ horizontal:'left', vertical:'top', wrapText:true, indent:1 },
    });
    ws.getRow(R).height = i === 2 ? 40 : 26;
    R++;
  });

  // ── CLOSING ───────────────────────────────────────────────────
  [
    ['上記の通り、何卒ご用命の程お願い申し上げます。', FNT_JP],
    ['敬具', FNT_JP],
    ['Demikian penawaran ini, kiranya kami dapat bekerja sama dengan perusahaan Bapak/Ibu kembali.', 'Arial'],
    ['Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.', 'Arial'],
  ].forEach(([txt, fn]) => {
    freeText(R, 1, T, txt, { font: fnt(8, false, null, fn) });
    ws.getRow(R).height = 11; R++;
  });

  ws.getRow(R).height = 5; R++; // spacer

  // ── SIGNATURES ────────────────────────────────────────────────
  const sigTop = R;
  freeText(R, 1, mid - 1, 'Hormat kami,', { font: fnt(8) });
  freeText(R, mid, T, '承認　Disetujui', { font: fnt(8, false, null, FNT_JP), align:{ horizontal:'center', vertical:'middle' } });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, mid - 1, 'いちから株式会社', { font: fnt(8, false, null, FNT_JP) });
  freeText(R, mid, T, clTTD, { font: fnt(8), align:{ horizontal:'center', vertical:'middle' } });
  ws.getRow(R).height = 12; R++;
  freeText(R, 1, mid - 1, 'PT Ichikara', { font: fnt(8) });
  ws.getRow(R).height = 12; R++;

  // ruang TTD + stempel
  const ttdBuf = await imgArrayBuffer(S.ttdSrc || 'ttd.png');
  if (ttdBuf) {
    const ttdId = wb.addImage({ buffer: ttdBuf, extension: 'png' });
    ws.addImage(ttdId, { tl: { col: 0.1, row: R - 1 + 0.1 }, ext: { width: 130, height: 70 } });
  }
  ws.getRow(R).height = 30; R++;
  ws.getRow(R).height = 30;
  freeText(R, mid, T, '(                                              )', { font: fnt(8), align:{ horizontal:'center', vertical:'bottom' } });
  R++;
  freeText(R, 1, mid - 1, 'Risma N.', { font: fnt(8, true) });
  ws.getRow(R).height = 12; R++;

  // ── Download ──────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${qNo.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Export Excel gagal:', err);
    alert('Export Excel gagal: ' + err.message);
  }
}

// ── Live update ────────────────────────────────────────────────
document.addEventListener('input',  renderQuotation);
document.addEventListener('change', renderQuotation);

// ── Default date = today ───────────────────────────────────────
(function init() {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  if (!$('q_date').value) $('q_date').value = iso;
  $('sch_year').value = t.getFullYear();
  $('sch_month').value = String(t.getMonth()+1);
  if ($('ad_month')) $('ad_month').value = String(t.getMonth()+1);
  buildPresetUI();
  renderDayList(); renderQuotation();
})();

// ── Expose globals ─────────────────────────────────────────────
window.addDay       = addDay;
window.removeDay    = removeDay;
window.togglePreset = togglePreset;
window.uploadImg    = uploadImg;
window.resetAll     = resetAll;
window.loadSample   = loadSample;
window.exportPDF    = exportPDF;
window.exportExcel  = exportExcel;
