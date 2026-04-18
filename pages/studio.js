import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// ─── HEADER BEST TIMES (IST) ─────────────────────────────────────────────────
function HeaderTimes() {
  const BEST = [
    [9, 13, 20],  // Sun
    [7, 11, 19],  // Mon
    [6, 10, 20],  // Tue
    [7, 12, 19],  // Wed
    [8, 12, 18],  // Thu
    [7, 11, 20],  // Fri
    [9, 12, 19],  // Sat
  ];
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // IST = UTC+5:30
  const istMs = now.getTime() + (5 * 60 + 30) * 60000;
  const ist   = new Date(istMs);
  const todayIdx = ist.getUTCDay();
  const tmrIdx   = (todayIdx + 1) % 7;
  const curH     = ist.getUTCHours() + ist.getUTCMinutes() / 60;

  function fmt(h) {
    return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;
  }

  // Find next upcoming slot today, if any
  const nextToday = BEST[todayIdx].find(h => h > curH);

  return (
    <div className="hdr-times">
      {[todayIdx, tmrIdx].map((di, i) => {
        const isToday = i === 0;
        return (
          <div key={di} className="hdr-times-day">
            <span className="hdr-times-label">{isToday ? 'TODAY' : 'TMR'}</span>
            <span className="hdr-times-name">{DAY[di]}</span>
            <span className="hdr-times-sep">·</span>
            {BEST[di].map(h => {
              const isPast     = isToday && h <= curH;
              const isNext     = isToday && h === nextToday;
              return (
                <span
                  key={h}
                  className={
                    isNext    ? 'hdr-slot hdr-slot-next' :
                    isPast    ? 'hdr-slot hdr-slot-past' :
                    isToday   ? 'hdr-slot hdr-slot-upcoming' :
                                'hdr-slot hdr-slot-tmr'
                  }
                >
                  {fmt(h)}
                </span>
              );
            })}
          </div>
        );
      })}
      <span className="hdr-times-tz">IST</span>
    </div>
  );
}

// ─── BEST TIMES WIDGET ───────────────────────────────────────────────────────
function BestTimesWidget() {
  const BEST_TIMES = [
    { day: 'Sun', hours: [8, 14, 18] },
    { day: 'Mon', hours: [7, 11, 15] },
    { day: 'Tue', hours: [6, 10, 14] },
    { day: 'Wed', hours: [7, 11, 16] },
    { day: 'Thu', hours: [8, 12, 17] },
    { day: 'Fri', hours: [7, 11, 13] },
    { day: 'Sat', hours: [9, 12, 17] },
  ];

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const todayIdx = now.getDay();
  const curH = now.getHours() + now.getMinutes() / 60;

  function fmt(h) {
    return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;
  }

  // Find the very next best slot across days
  let nextSlot = null;
  for (let d = 0; d < 7; d++) {
    const di = (todayIdx + d) % 7;
    const upcoming = BEST_TIMES[di].hours.filter(h => d > 0 || h > curH);
    if (upcoming.length) { nextSlot = { dayIdx: di, hour: upcoming[0] }; break; }
  }

  function countdown(dayIdx, hour) {
    const target = new Date(now);
    const daysAhead = (dayIdx - todayIdx + 7) % 7;
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 7);
    const diff = target - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  const isNext     = (di, h) => nextSlot && nextSlot.dayIdx === di && nextSlot.hour === h;
  const isUpcoming = (di, h) => di === todayIdx && h > curH;
  const isPast     = (di, h) => di === todayIdx && h <= curH;

  const nextLabel = nextSlot
    ? (nextSlot.dayIdx === todayIdx ? '' : BEST_TIMES[nextSlot.dayIdx].day + ' ') +
      fmt(nextSlot.hour) + ' · in ' + countdown(nextSlot.dayIdx, nextSlot.hour)
    : null;

  return (
    <div className="best-times-wrap">
      {/* Header row */}
      <div className="bt-header">
        <span className="bt-title">📅 Best Times · Instagram Reels</span>
        {nextLabel && (
          <span className="bt-next">
            <span className="bt-next-pin">▶</span> {nextLabel}
          </span>
        )}
      </div>

      {/* Day columns */}
      <div className="bt-grid">
        {BEST_TIMES.map((dayObj, di) => (
          <div key={di} className={`bt-col${di === todayIdx ? ' bt-today' : ''}`}>
            <span className="bt-day-name">{dayObj.day}</span>
            {dayObj.hours.map(h => {
              const next     = isNext(di, h);
              const upcoming = isUpcoming(di, h);
              const past     = isPast(di, h);
              let cls = 'bt-slot';
              if (next)     cls += ' bt-slot-next';
              else if (upcoming) cls += ' bt-slot-upcoming';
              else if (past)     cls += ' bt-slot-past';
              else if (di !== todayIdx) cls += ' bt-slot-other';
              return (
                <div key={h} className={cls} title={next ? `Next best time · in ${countdown(di, h)}` : ''}>
                  {fmt(h)}
                  {next && <span className="bt-pulse" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="bt-footnote">Avg engagement data · Local timezone</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Studio() {
  const router = useRouter();
  const initialized = useRef(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingTpls, setLoadingTpls] = useState(false);
  const [tplMsg, setTplMsg] = useState('');

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const stateData = window.__getStudioState?.();
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName.trim(), state: stateData }),
      });
      if (res.ok) {
        setTplMsg('✓ Saved!');
        setTimeout(() => setTplMsg(''), 1800);
        setTemplateName('');
        setShowSaveModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTpls(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } finally {
      setLoadingTpls(false);
    }
  };

  const openLoadModal = () => {
    setShowLoadModal(true);
    fetchTemplates();
  };

  const applyTemplate = (tpl) => {
    window.__applyStudioState?.(tpl.state);
    setShowLoadModal(false);
  };

  const deleteTemplate = async (id, e) => {
    e.stopPropagation();
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // ─── ALL CANVAS CODE ───────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const W = 405, H = 720, FULL_W = 1080;
    const canvas = document.getElementById('preview');
    const canvasWrap = document.getElementById('canvasWrap');

    const FONTS = [
      { v:"'Playfair Display'",    l:"Playfair Display — Classic Serif",  w:700, italic:true  },
      { v:"'Playfair Display'",    l:"Playfair Display Italic — Elegant", w:900, italic:true  },
      { v:"'Bricolage Grotesque'", l:"Bricolage Grotesque — Editorial",   w:800, italic:false },
      { v:"'Bricolage Grotesque'", l:"Bricolage Grotesque Light",         w:200, italic:false },
      { v:"'Bebas Neue'",          l:"Bebas Neue — Bold Impact ✦",        w:400, italic:false },
      { v:"'Inter'",               l:"Inter — Clean Modern",              w:700, italic:false },
      { v:"'Inter'",               l:"Inter Light — Minimal",             w:300, italic:false },
      { v:"Helvetica",             l:"Helvetica — Timeless Classic ✦",    w:700, italic:false },
      { v:"Helvetica",             l:"Helvetica Light",                   w:300, italic:false },
    ];
    const FONT_DEFAULTS = { hookFont:"'Playfair Display'", midFont:"'Inter'", subFont:"'Inter'" };
    ['hookFont','midFont','subFont'].forEach(id => {
      const sel = document.getElementById(id);
      FONTS.forEach(f => {
        const o = document.createElement('option');
        o.value = f.v; o.textContent = f.l;
        if (f.v === FONT_DEFAULTS[id]) o.selected = true;
        sel.appendChild(o);
      });
    });
    function fontInfo(v) { return FONTS.find(f => f.v === v) || { w:400, italic:true }; }

    const PHOTOS = [
      { url:'https://images.unsplash.com/photo-1557683316-973673baf926?w=540&h=960&fit=crop&q=80', l:'Purple'  },
      { url:'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=540&h=960&fit=crop&q=80', l:'Galaxy'  },
      { url:'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=540&h=960&fit=crop&q=80', l:'Peak'    },
      { url:'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=540&h=960&fit=crop&q=80', l:'Forest'  },
      { url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=540&h=960&fit=crop&q=80', l:'City'    },
      { url:'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=540&h=960&fit=crop&q=80', l:'Ocean'   },
      { url:'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=540&h=960&fit=crop&q=80', l:'Cosmos'  },
      { url:'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=540&h=960&fit=crop&q=80', l:'Misty'   },
      { url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=540&h=960&fit=crop&q=80', l:'Abstract' },
      { url:'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=540&h=960&fit=crop&q=80', l:'Texture' },
      { url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=540&h=960&fit=crop&q=80', l:'Alps'    },
      { url:'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=540&h=960&fit=crop&q=80', l:'Aurora'  },
      { url:'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=540&h=960&fit=crop&q=80', l:'Jungle'  },
      { url:'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=540&h=960&fit=crop&q=80', l:'Volcano' },
      { url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=540&h=960&fit=crop&q=80', l:'Road'    },
      { url:'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=540&h=960&fit=crop&q=80', l:'Neon'    },
      { url:'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=540&h=960&fit=crop&q=80', l:'Rain'    },
      { url:'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=540&h=960&fit=crop&q=80', l:'Sunset'  },
      { url:'https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=540&h=960&fit=crop&q=80', l:'J1'      },
      { url:'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=540&h=960&fit=crop&q=80',   l:'J2'      },
      { url:'https://plus.unsplash.com/premium_vector-1729092934249-c3780caf3cfe?w=540&h=960&fit=crop&q=80', l:'India'  },
      { url:'https://images.unsplash.com/photo-1541873676-a18131494184?w=540&h=960&fit=crop&q=80',   l:'Space'   },
      { url:'https://plus.unsplash.com/premium_photo-1714618972836-3db58ce35416?w=540&h=960&fit=crop&q=80', l:'Alien'  },
      { url:'https://images.unsplash.com/photo-1559813251-063297683d0f?w=540&h=960&fit=crop&q=80',   l:'Alien2'  },
      { url:'https://plus.unsplash.com/premium_photo-1676648196830-0132b76fbae7?w=540&h=960&fit=crop&q=80', l:'V1'     },
      { url:'https://images.unsplash.com/photo-1633872908246-8525af262f76?w=540&h=960&fit=crop&q=80', l:'V2'     },
      { url:'https://plus.unsplash.com/premium_photo-1661893891854-20d9db959cd8?w=540&h=960&fit=crop&q=80', l:'Sea'   },
    ];
    const imgCache = {};
    function loadImg(url, cb) {
      if (imgCache[url]) { cb(imgCache[url]); return; }
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { imgCache[url] = img; cb(img); };
      img.onerror = () => cb(null);
      img.src = url;
    }
    const photoGrid = document.getElementById('bgPhotos');
    PHOTOS.forEach((p, i) => {
      const item = document.createElement('div'); item.className = 'bgp'; item.dataset.idx = i;
      const img = document.createElement('img'); img.src = p.url; img.alt = p.l; img.loading = 'lazy';
      const lbl = document.createElement('div'); lbl.className = 'bgp-lbl'; lbl.textContent = p.l;
      item.appendChild(img); item.appendChild(lbl); photoGrid.appendChild(item);
    });

    const BG_PALETTES = [
      { dark:'#0a0a0a', mid:'#1a1200', accent:[201,168,76]  },
      { dark:'#0d0620', mid:'#1e0a3c', accent:[160,80,220]  },
      { dark:'#001a14', mid:'#003828', accent:[40,180,120]   },
      { dark:'#1a0000', mid:'#3d0808', accent:[220,60,60]    },
      { dark:'#0d0d1a', mid:'#1a1a3d', accent:[80,80,200]    },
      { dark:'#1a100a', mid:'#3d2005', accent:[220,130,40]   },
      { dark:'#111',    mid:'#2a2a2a', accent:[150,150,150]  },
      { dark:'#050518', mid:'#0a0a30', accent:[40,100,220]   },
    ];

    const state = {
      handle:'@TheBrainTape', handleColor:'#c9a84c',
      hookEnabled:true, hook:'This changes everything.',
      hookFont:"'Playfair Display'", hookSize:88, hookStyle:'italic',
      hookColor:'#ffffff', hookAlign:'left', hookPos:40,
      hookOpacity:100, hookRotation:0, hookCurve:false, hookCurveRad:600,
      hookX:-1, hookY:-1,
      midEnabled:false, mid:'Here is why you need to see this →',
      midFont:"'Inter'", midSize:30, midStyle:'normal',
      midColor:'#e0e0e0', midAlign:'left', midPos:58,
      midRotation:0, midX:-1, midY:-1,
      subEnabled:true, sub:'You need to see this.',
      subFont:"'Inter'", subSize:15, subStyle:'normal',
      subColor:'rgba(255,255,255,0.5)', subAlign:'left', subPos:68,
      subRotation:0, subX:-1, subY:-1,
      bgIndex:0, bgImage:null, bgPhotoIdx:-1, bgBlur:0, glow:60,
      showRule:true, showGrain:true, showVig:true,
    };

    // ─── UNDO/REDO ───
    let history = [], historyIdx = -1, _skipSnapshot = false;
    const UNDO_MAX = 60;
    function snapshot() {
      if (_skipSnapshot) return;
      const snap = JSON.stringify(state, (k, v) => k === 'bgImage' ? '__img__' : v);
      history = history.slice(0, historyIdx + 1);
      history.push({ snap, bgImage: state.bgImage });
      if (history.length > UNDO_MAX) history.shift();
      historyIdx = history.length - 1;
      updateUndoUI();
    }
    function applySnapshot(entry) {
      _skipSnapshot = true;
      const s = JSON.parse(entry.snap);
      Object.assign(state, s);
      state.bgImage = entry.bgImage;
      syncUIFromState();
      go();
      _skipSnapshot = false;
    }
    function undo() { if (historyIdx <= 0) return; historyIdx--; applySnapshot(history[historyIdx]); updateUndoUI(); }
    function redo() { if (historyIdx >= history.length - 1) return; historyIdx++; applySnapshot(history[historyIdx]); updateUndoUI(); }
    function updateUndoUI() {
      document.getElementById('undoBtn').disabled = historyIdx <= 0;
      document.getElementById('redoBtn').disabled = historyIdx >= history.length - 1;
    }
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && (e.key==='y' || (e.key==='z'&&e.shiftKey))) { e.preventDefault(); redo(); }
    });

    // ─── SYNC UI FROM STATE ───
    function syncColorDots(id, color) {
      document.querySelectorAll(`#${id} .cdot`).forEach(x => x.classList.toggle('active', x.dataset.color === color));
    }
    function syncAlignBtns(id, align) {
      document.querySelectorAll(`#${id} .abtn`).forEach(b => b.classList.toggle('active', b.dataset.align === align));
    }
    function syncUIFromState() {
      document.getElementById('handleText').value = state.handle;
      syncColorDots('handleColors', state.handleColor);
      ['hook','mid','sub'].forEach(p => {
        const P = p.charAt(0).toUpperCase()+p.slice(1);
        const tEl = document.getElementById(`${p}Text`);
        if (tEl) tEl.value = state[p];
        document.getElementById(`${p}Font`).value = state[`${p}Font`];
        document.getElementById(`${p}Size`).value = state[`${p}Size`];
        document.getElementById(`${p}SizeVal`).textContent = state[`${p}Size`];
        document.getElementById(`${p}Style`).value = state[`${p}Style`];
        document.getElementById(`${p}Pos`).value = state[`${p}Pos`];
        document.getElementById(`${p}PosVal`).textContent = state[`${p}Pos`];
        syncColorDots(`${p}Colors`, state[`${p}Color`]);
        syncAlignBtns(`${p}AlignGroup`, state[`${p}Align`]);
        document.getElementById(`tog${P}`).classList.toggle('on', state[`${p}Enabled`]);
        document.getElementById(`${p}Body`).classList.toggle('disabled', !state[`${p}Enabled`]);
        const rotEl = document.getElementById(`${p}Rotation`);
        if (rotEl) { rotEl.value = state[`${p}Rotation`]; document.getElementById(`${p}RotationVal`).textContent = state[`${p}Rotation`]; }
      });
      document.getElementById('hookOpacity').value = state.hookOpacity;
      document.getElementById('hookOpacityVal').textContent = state.hookOpacity;
      document.getElementById('togHookCurve').classList.toggle('on', state.hookCurve);
      document.getElementById('hookCurveControls').classList.toggle('visible', state.hookCurve);
      document.getElementById('hookCurveHint').classList.toggle('visible', state.hookCurve);
      document.getElementById('hookCurveRad').value = state.hookCurveRad;
      document.getElementById('hookCurveRadVal').textContent = state.hookCurveRad;
      document.getElementById('glowSlider').value = state.glow;
      document.getElementById('glowVal').textContent = state.glow;
      document.getElementById('bgBlurSlider').value = state.bgBlur;
      document.getElementById('bgBlurVal').textContent = state.bgBlur;
      document.getElementById('bgBlurRow').classList.toggle('visible', !!state.bgImage);
      const map = { togRule:'showRule', togGrain:'showGrain', togVig:'showVig' };
      Object.entries(map).forEach(([id, key]) => document.getElementById(id).classList.toggle('on', state[key]));
      updateDragHandles();
    }

    // ─── GRAIN ───
    let grainCache = null;
    function makeGrain(w, h) {
      const gc = document.createElement('canvas'); gc.width = w; gc.height = h;
      const gx = gc.getContext('2d'); const id = gx.createImageData(w, h);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.random()*255|0;
        id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 18;
      }
      gx.putImageData(id, 0, 0); return gc;
    }

    // ─── BLUR ───
    let blurCanvas = null, blurCtx = null;
    function getBlurredImage(img, blurPx, cw, ch) {
      if (!blurCanvas) { blurCanvas = document.createElement('canvas'); blurCtx = blurCanvas.getContext('2d'); }
      blurCanvas.width = cw; blurCanvas.height = ch;
      const pad = blurPx * 2;
      blurCtx.filter = `blur(${blurPx}px)`;
      blurCtx.drawImage(img, -pad, -pad, cw + pad*2, ch + pad*2);
      blurCtx.filter = 'none';
      return blurCanvas;
    }

    // ─── TEXT WRAP ───
    function wrapText(cx, text, maxW) {
      const words = text.split(' '); const lines = []; let line = '';
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + ' ';
        if (cx.measureText(test).width > maxW && n > 0) { lines.push(line.trim()); line = words[n]+' '; }
        else { line = test; }
      }
      if (line.trim()) lines.push(line.trim());
      return lines.length ? lines : [''];
    }

    // ─── CURVED TEXT ───
    function drawCurvedText(cx, text, cx0, cy0, radius, size, color, opacity, glowCol, glowPwr, s) {
      cx.save();
      cx.globalAlpha = opacity / 100;
      cx.fillStyle = color;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      if (glowPwr > 0) { cx.shadowColor = glowCol; cx.shadowBlur = 38*s; }
      const charW = size * s * 0.7;
      const totalAngle = (text.length * charW) / radius;
      const startAngle = -Math.PI/2 - totalAngle/2;
      for (let i = 0; i < text.length; i++) {
        const a = startAngle + (i + 0.5) * (totalAngle / text.length);
        cx.save();
        cx.translate(cx0 + radius * Math.cos(a), cy0 + radius * Math.sin(a));
        cx.rotate(a + Math.PI/2);
        cx.fillText(text[i], 0, 0);
        cx.restore();
      }
      cx.restore();
    }

    // ─── DRAW BLOCK ───
    function drawBlock(cx, cw, ch, s, text, fontV, size, style, color, align, posY, glowCol, glowPwr, opacity, rotation, curved, curveRad, freeX, freeY) {
      if (!text.trim()) return;
      const fi = fontInfo(fontV);
      const sz = size * s;
      const useItalic = style === 'italic' && fi.italic;
      cx.font = `${useItalic?'italic':'normal'} ${fi.w} ${sz}px ${fontV}, sans-serif`;
      const safeT = 80*s, safeB = ch-80*s;
      const maxW = cw - 64*s;
      const lines = wrapText(cx, text, maxW);
      const lineH = sz * 1.15;
      const totalH = lines.length * lineH;
      let baseX, baseY;
      if (freeX >= 0 && freeY >= 0) {
        baseX = freeX * cw; baseY = freeY * ch;
      } else {
        baseY = safeT + (posY/100)*(safeB-safeT) - totalH/2;
        baseX = align==='center' ? cw/2 : align==='right' ? cw-32*s : 32*s;
      }
      if (curved) {
        drawCurvedText(cx, text, baseX, baseY, curveRad*s, size, color, opacity, glowCol, glowPwr, s);
        return;
      }
      cx.save();
      cx.fillStyle = color;
      cx.textAlign = freeX>=0 ? 'center' : align;
      cx.textBaseline = 'top';
      cx.globalAlpha = opacity/100;
      if (rotation !== 0) {
        const rcx = baseX, rcy = baseY + totalH/2;
        cx.translate(rcx, rcy); cx.rotate(rotation*Math.PI/180); cx.translate(-rcx, -rcy);
      }
      if (glowPwr > 0) { cx.shadowColor = glowCol; cx.shadowBlur = 38*s; }
      lines.forEach((l, i) => cx.fillText(l, baseX, baseY + i*lineH));
      cx.restore();
    }

    // ─── MAIN DRAW ───
    function drawCanvas(c, scale) {
      const cx = c.getContext('2d');
      const cw = W*scale, ch = H*scale; c.width = cw; c.height = ch; const s = scale;
      const pal = BG_PALETTES[state.bgIndex];
      const glow = state.glow/100;
      const [ar,ag,ab] = pal.accent;
      const aStr = `rgba(${ar},${ag},${ab},`;
      if (state.bgImage) {
        if (state.bgBlur > 0) {
          const blurred = getBlurredImage(state.bgImage, state.bgBlur * scale, cw, ch);
          cx.drawImage(blurred, 0, 0, cw, ch);
        } else { cx.drawImage(state.bgImage, 0, 0, cw, ch); }
        cx.fillStyle = 'rgba(0,0,0,0.44)'; cx.fillRect(0,0,cw,ch);
      } else {
        const g = cx.createLinearGradient(0,0,cw*.6,ch);
        g.addColorStop(0, pal.dark); g.addColorStop(.5, pal.mid); g.addColorStop(1, pal.dark);
        cx.fillStyle = g; cx.fillRect(0,0,cw,ch);
      }
      if (glow > 0) {
        const r1 = cx.createRadialGradient(cw*.3,ch*.35,0,cw*.3,ch*.35,cw*.7);
        r1.addColorStop(0,`${aStr}${glow*.18})`); r1.addColorStop(1,'transparent');
        cx.fillStyle=r1; cx.fillRect(0,0,cw,ch);
        const r2 = cx.createRadialGradient(cw*.75,ch*.72,0,cw*.75,ch*.72,cw*.5);
        r2.addColorStop(0,`${aStr}${glow*.1})`); r2.addColorStop(1,'transparent');
        cx.fillStyle=r2; cx.fillRect(0,0,cw,ch);
      }
      if (state.showVig) {
        const v = cx.createRadialGradient(cw/2,ch/2,ch*.2,cw/2,ch/2,ch*.85);
        v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.72)');
        cx.fillStyle=v; cx.fillRect(0,0,cw,ch);
      }
      if (state.showGrain) {
        if (!grainCache) grainCache = makeGrain(W,H);
        cx.drawImage(grainCache,0,0,cw,ch);
      }
      cx.strokeStyle=`${aStr}0.28)`; cx.lineWidth=1*s;
      cx.beginPath(); cx.moveTo(32*s,52*s); cx.lineTo(cw-32*s,52*s); cx.stroke();
      cx.font=`400 ${11*s}px 'Inter',sans-serif`; cx.letterSpacing=`${2.5*s}px`;
      cx.fillStyle=state.handleColor; cx.textAlign='left'; cx.textBaseline='middle';
      cx.fillText(state.handle,32*s,38*s); cx.letterSpacing='0px';
      const glowCol = `rgba(${ar},${ag},${ab},1)`;
      if (state.hookEnabled && state.hook)
        drawBlock(cx,cw,ch,s,state.hook,state.hookFont,state.hookSize,state.hookStyle,state.hookColor,state.hookAlign,state.hookPos,glowCol,glow*.75,state.hookOpacity,state.hookRotation,state.hookCurve,state.hookCurveRad,state.hookX,state.hookY);
      if (state.midEnabled && state.mid)
        drawBlock(cx,cw,ch,s,state.mid,state.midFont,state.midSize,state.midStyle,state.midColor,state.midAlign,state.midPos,glowCol,glow*.3,100,state.midRotation,false,600,state.midX,state.midY);
      if (state.subEnabled && state.sub)
        drawBlock(cx,cw,ch,s,state.sub,state.subFont,state.subSize,state.subStyle,state.subColor,state.subAlign,state.subPos,glowCol,0,100,state.subRotation,false,600,state.subX,state.subY);
      if (state.showRule) {
        const ry = ch-90*s;
        const rg = cx.createLinearGradient(32*s,0,cw-32*s,0);
        rg.addColorStop(0,'transparent'); rg.addColorStop(.3,`${aStr}.6)`);
        rg.addColorStop(.7,`${aStr}.6)`); rg.addColorStop(1,'transparent');
        cx.strokeStyle=rg; cx.lineWidth=.5*s;
        cx.beginPath(); cx.moveTo(32*s,ry); cx.lineTo(cw-32*s,ry); cx.stroke();
        cx.font=`500 ${12*s}px 'Inter',sans-serif`; cx.letterSpacing=`${3*s}px`;
        cx.fillStyle=state.handleColor; cx.textAlign='center'; cx.textBaseline='middle';
        cx.fillText(state.handle,cw/2,ch-52*s); cx.letterSpacing='0px';
      }
      cx.textBaseline='alphabetic'; cx.textAlign='left';
    }

    function render() { drawCanvas(canvas, 1); }
    let raf = null;
    function go() {
      if (raf) return;
      raf = requestAnimationFrame(() => { render(); raf = null; updateDragHandles(); });
    }

    // ─── DRAG HANDLES ───
    function getLayerCenter(p) {
      const safeT = 80, safeB = H - 80;
      if (state[`${p}X`]>=0 && state[`${p}Y`]>=0)
        return { x: state[`${p}X`]*W, y: state[`${p}Y`]*H };
      const posY = state[`${p}Pos`];
      const align = state[`${p}Align`];
      const x = align==='center' ? W/2 : align==='right' ? W-32 : 32;
      const y = safeT + (posY/100)*(safeB-safeT);
      return { x, y };
    }
    function updateDragHandles() {
      if (window.innerWidth <= 860) return;
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width / W, sy = rect.height / H;
      ['hook','mid','sub'].forEach(p => {
        const P = p.charAt(0).toUpperCase()+p.slice(1);
        const el = document.getElementById(`dh${P}`);
        const active = state[`${p}Enabled`] && state[p] && state[p].trim();
        el.classList.toggle('hidden', !active);
        if (!active) return;
        const { x, y } = getLayerCenter(p);
        el.style.left = (x*sx)+'px'; el.style.top = (y*sy)+'px';
      });
    }
    let dragging = null;
    canvasWrap.addEventListener('mousedown', e => {
      const h = e.target.closest('.drag-handle'); if (!h) return;
      e.preventDefault(); dragging = { layer: h.dataset.layer, el: h };
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX-rect.left)/rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY-rect.top)/rect.height));
      const p = dragging.layer;
      state[`${p}X`] = x; state[`${p}Y`] = y;
      const posVal = Math.round(((y*H - 80)/(H-160))*100);
      const ps = document.getElementById(`${p}Pos`);
      if (ps) { ps.value = Math.max(5,Math.min(90,posVal)); document.getElementById(`${p}PosVal`).textContent = ps.value; }
      go();
    });
    document.addEventListener('mouseup', () => { if (!dragging) return; dragging = null; snapshot(); });
    canvasWrap.addEventListener('dblclick', e => {
      const h = e.target.closest('.drag-handle'); if (!h) return;
      const p = h.dataset.layer; state[`${p}X`] = -1; state[`${p}Y`] = -1; go(); snapshot();
    });
    window.addEventListener('resize', updateDragHandles);

    // ─── WIRE LAYERS ───
    function wireLayer(p) {
      const snap = () => snapshot();
      const tEl = document.getElementById(`${p}Text`);
      if (tEl) {
        tEl.addEventListener('input', e => { state[p]=e.target.value; go(); });
        tEl.addEventListener('change', snap);
      }
      document.getElementById(`${p}Font`).addEventListener('change', e => { state[`${p}Font`]=e.target.value; go(); snap(); });
      document.getElementById(`${p}Style`).addEventListener('change', e => { state[`${p}Style`]=e.target.value; go(); snap(); });
      document.getElementById(`${p}Size`).addEventListener('input', e => {
        state[`${p}Size`]=+e.target.value; document.getElementById(`${p}SizeVal`).textContent=e.target.value; go();
      });
      document.getElementById(`${p}Size`).addEventListener('change', snap);
      document.getElementById(`${p}Pos`).addEventListener('input', e => {
        state[`${p}X`]=-1; state[`${p}Y`]=-1;
        state[`${p}Pos`]=+e.target.value; document.getElementById(`${p}PosVal`).textContent=e.target.value; go();
      });
      document.getElementById(`${p}Pos`).addEventListener('change', snap);
      document.getElementById(`${p}Colors`).addEventListener('click', e => {
        const d = e.target.closest('.cdot'); if (!d) return;
        document.querySelectorAll(`#${p}Colors .cdot`).forEach(x => x.classList.remove('active'));
        d.classList.add('active'); state[`${p}Color`]=d.dataset.color; go(); snap();
      });
      document.getElementById(`${p}ColorCustom`).addEventListener('input', e => {
        document.querySelectorAll(`#${p}Colors .cdot`).forEach(x => x.classList.remove('active'));
        state[`${p}Color`]=e.target.value; go();
      });
      document.getElementById(`${p}ColorCustom`).addEventListener('change', snap);
      document.getElementById(`${p}AlignGroup`).addEventListener('click', e => {
        const b = e.target.closest('.abtn'); if (!b) return;
        document.querySelectorAll(`#${p}AlignGroup .abtn`).forEach(x => x.classList.remove('active'));
        b.classList.add('active'); state[`${p}Align`]=b.dataset.align; go(); snap();
      });
      const rotEl = document.getElementById(`${p}Rotation`);
      if (rotEl) {
        rotEl.addEventListener('input', e => { state[`${p}Rotation`]=+e.target.value; document.getElementById(`${p}RotationVal`).textContent=e.target.value; go(); });
        rotEl.addEventListener('change', snap);
      }
    }
    wireLayer('hook'); wireLayer('mid'); wireLayer('sub');

    document.getElementById('hookOpacity').addEventListener('input', e => {
      state.hookOpacity=+e.target.value; document.getElementById('hookOpacityVal').textContent=e.target.value; go();
    });
    document.getElementById('hookOpacity').addEventListener('change', snapshot);
    document.getElementById('togHookCurve').addEventListener('click', function() {
      state.hookCurve = !state.hookCurve;
      this.classList.toggle('on', state.hookCurve);
      document.getElementById('hookCurveControls').classList.toggle('visible', state.hookCurve);
      document.getElementById('hookCurveHint').classList.toggle('visible', state.hookCurve);
      go(); snapshot();
    });
    document.getElementById('hookCurveRad').addEventListener('input', e => {
      state.hookCurveRad=+e.target.value; document.getElementById('hookCurveRadVal').textContent=e.target.value; go();
    });
    document.getElementById('hookCurveRad').addEventListener('change', snapshot);

    document.getElementById('handleText').addEventListener('input', e => { state.handle=e.target.value; go(); });
    document.getElementById('handleText').addEventListener('change', snapshot);
    document.getElementById('handleColors').addEventListener('click', e => {
      const d = e.target.closest('.cdot'); if (!d) return;
      document.querySelectorAll('#handleColors .cdot').forEach(x => x.classList.remove('active'));
      d.classList.add('active'); state.handleColor=d.dataset.color; go(); snapshot();
    });
    document.getElementById('handleColorCustom').addEventListener('input', e => {
      document.querySelectorAll('#handleColors .cdot').forEach(x => x.classList.remove('active'));
      state.handleColor=e.target.value; go();
    });
    document.getElementById('handleColorCustom').addEventListener('change', snapshot);

    function layerToggle(togId, bodyId, stateKey) {
      const tog = document.getElementById(togId), body = document.getElementById(bodyId);
      tog.addEventListener('click', () => {
        state[stateKey] = !state[stateKey];
        tog.classList.toggle('on', state[stateKey]);
        body.classList.toggle('disabled', !state[stateKey]);
        go(); snapshot();
      });
    }
    layerToggle('togHook','hookBody','hookEnabled');
    layerToggle('togMid', 'midBody', 'midEnabled');
    layerToggle('togSub', 'subBody', 'subEnabled');

    document.getElementById('bgSwatches').addEventListener('click', e => {
      const sw = e.target.closest('.swatch'); if (!sw) return;
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active'); state.bgIndex=+sw.dataset.bg; grainCache=null; go(); snapshot();
    });

    function setBlurRowVisible(v) { document.getElementById('bgBlurRow').classList.toggle('visible', v); }

    photoGrid.addEventListener('click', e => {
      const item = e.target.closest('.bgp'); if (!item) return;
      const idx = +item.dataset.idx;
      if (state.bgPhotoIdx === idx) {
        state.bgPhotoIdx=-1; state.bgImage=null;
        document.querySelectorAll('.bgp').forEach(i => i.classList.remove('active'));
        setBlurRowVisible(false); go(); snapshot(); return;
      }
      document.querySelectorAll('.bgp').forEach(i => i.classList.remove('active'));
      item.classList.add('active'); state.bgPhotoIdx=idx;
      const loader = document.createElement('div'); loader.className='loader'; loader.textContent='LOADING';
      item.appendChild(loader);
      loadImg(PHOTOS[idx].url, img => {
        loader.remove(); state.bgImage=img; setBlurRowVisible(true); go(); snapshot();
      });
    });

    document.getElementById('uploadBg').addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          state.bgImage=img; state.bgPhotoIdx=-2;
          document.querySelectorAll('.bgp').forEach(i => i.classList.remove('active'));
          setBlurRowVisible(true); go(); snapshot();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('bgBlurSlider').addEventListener('input', e => {
      state.bgBlur=+e.target.value; document.getElementById('bgBlurVal').textContent=e.target.value; go();
    });
    document.getElementById('bgBlurSlider').addEventListener('change', snapshot);

    document.getElementById('glowSlider').addEventListener('input', e => {
      state.glow=+e.target.value; document.getElementById('glowVal').textContent=e.target.value; go();
    });
    document.getElementById('glowSlider').addEventListener('change', snapshot);

    function effToggle(id, key) {
      document.getElementById(id).addEventListener('click', function() {
        state[key] = !state[key]; this.classList.toggle('on', state[key]); go(); snapshot();
      });
    }
    effToggle('togRule','showRule'); effToggle('togGrain','showGrain'); effToggle('togVig','showVig');

    document.getElementById('dlBtn').addEventListener('click', () => {
      const fc = document.createElement('canvas');
      drawCanvas(fc, FULL_W/W);
      const a = document.createElement('a');
      a.download = `reel-cover-${Date.now()}.png`; a.href = fc.toDataURL('image/png'); a.click();
    });

    // ─── TEMPLATE API ───
    window.__getStudioState = () => JSON.stringify(state, (k, v) => k === 'bgImage' ? null : v);

    window.__applyStudioState = (stateData) => {
      _skipSnapshot = true;
      const s = typeof stateData === 'string' ? JSON.parse(stateData) : stateData;
      Object.assign(state, s);
      state.bgImage = null;
      if (state.bgPhotoIdx >= 0 && PHOTOS[state.bgPhotoIdx]) {
        loadImg(PHOTOS[state.bgPhotoIdx].url, img => {
          state.bgImage = img;
          setBlurRowVisible(true);
          go();
        });
      } else {
        setBlurRowVisible(false);
      }
      syncUIFromState();
      go();
      _skipSnapshot = false;
      snapshot();
    };

    setTimeout(() => { render(); updateDragHandles(); snapshot(); }, 150);
    setTimeout(render, 900);
  }, []);

  return (
    <>
      <Head>
        <title>Reel Cover Studio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,400;12..96,600;12..96,800&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,600;0,14..32,700;1,14..32,400&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0a; --surface: #111; --surface2: #1a1a1a; --border: #2a2a2a;
          --accent: #c9a84c; --accent2: #e8d5a3; --text: #f0ece4; --muted: #555; --radius: 8px;
          --header-h: 52px;
        }

        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        /* ── LAYOUT SHELL ── */
        .app-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ── HEADER ── */
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          height: var(--header-h);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
          z-index: 30;
        }
        .logo { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1rem; letter-spacing: 0.08em; color: var(--accent); }
        .logo span { color: var(--text); }
        .badge { font-size: 0.58rem; background: var(--accent); color: #000; padding: 2px 8px; border-radius: 20px; font-weight: 700; letter-spacing: 0.12em; }

        /* ── HEADER BEST TIMES ── */
        .hdr-times {
          display: flex; align-items: center; gap: 6px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 7px;
          padding: 4px 10px;
          flex-shrink: 0;
        }
        .hdr-times-day { display: flex; align-items: center; gap: 4px; }
        .hdr-times-day + .hdr-times-day { border-left: 1px solid #222; padding-left: 6px; }
        .hdr-times-label {
          font-size: 0.48rem; letter-spacing: 0.14em; font-weight: 700;
          color: #444; text-transform: uppercase;
        }
        .hdr-times-name {
          font-size: 0.52rem; letter-spacing: 0.06em; font-weight: 600;
          color: var(--accent);
        }
        .hdr-times-sep { color: #2a2a2a; font-size: 0.5rem; }
        .hdr-slot {
          font-size: 0.6rem; font-weight: 600; letter-spacing: 0.03em;
          padding: 2px 5px; border-radius: 4px; white-space: nowrap;
        }
        .hdr-slot-next {
          background: var(--accent); color: #000;
          animation: hdrPulse 2s ease-in-out infinite;
        }
        @keyframes hdrPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
          50%      { box-shadow: 0 0 0 3px rgba(201,168,76,0.35); }
        }
        .hdr-slot-upcoming { color: #c9a84c; background: rgba(201,168,76,0.1); }
        .hdr-slot-past     { color: #333; background: transparent; }
        .hdr-slot-tmr      { color: #555; background: transparent; }
        .hdr-times-tz {
          font-size: 0.42rem; color: #333; letter-spacing: 0.12em;
          text-transform: uppercase; font-weight: 600; border-left: 1px solid #222; padding-left: 6px;
        }
        @media (max-width: 900px) { .hdr-times { display: none; } }
        .hdr-actions { display: flex; align-items: center; gap: 0.35rem; flex-wrap: nowrap; }
        .undo-btn {
          background: var(--surface2); border: 1px solid var(--border); color: #888;
          border-radius: 6px; padding: 4px 9px; font-size: 0.7rem; cursor: pointer;
          transition: all .18s; font-family: 'Inter', sans-serif; letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .undo-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .undo-btn:disabled { opacity: 0.28; cursor: not-allowed; }
        .tpl-btn {
          background: var(--surface2); border: 1px solid var(--border); color: #aaa;
          border-radius: 6px; padding: 4px 10px; font-size: 0.7rem; cursor: pointer;
          transition: all .18s; font-family: 'Inter', sans-serif; letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .tpl-btn:hover { border-color: var(--accent); color: var(--accent); }
        .tpl-btn.accent { background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.4); color: var(--accent); }
        .logout-btn {
          background: transparent; border: 1px solid #333; color: #555; border-radius: 6px;
          padding: 4px 9px; font-size: 0.7rem; cursor: pointer; transition: all .18s;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }
        .logout-btn:hover { border-color: #e86b6b; color: #e86b6b; }

        /* ── MAIN: TWO COLUMNS ── */
        .studio-body {
          display: grid;
          grid-template-columns: 1fr 390px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ── LEFT: PREVIEW ── */
        .preview-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          background: #060606;
          overflow: hidden;
          position: relative;
          min-width: 0;
        }
        .preview-area::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.15;
          pointer-events: none;
          animation: gPulse 7s ease-in-out infinite;
        }
        @keyframes gPulse { 0%,100%{opacity:.10} 50%{opacity:.22} }

        .preview-label {
          font-size: 0.56rem; letter-spacing: 0.2em; color: var(--muted);
          text-transform: uppercase; position: relative; z-index: 1;
        }

        .canvas-wrap {
          position: relative;
          z-index: 1;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 0 0 1px var(--border), 0 24px 60px rgba(0,0,0,.85), 0 0 48px rgba(201,168,76,.05);
          animation: floatIn .5s cubic-bezier(.16,1,.3,1) both;
          user-select: none;
          height: min(calc(100vh - var(--header-h) - 200px), 580px);
          aspect-ratio: 405 / 720;
          flex-shrink: 0;
        }
        @keyframes floatIn { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }

        canvas#preview {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* Drag handles */
        .drag-handle {
          position: absolute; width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid var(--accent); background: rgba(201,168,76,0.22);
          cursor: grab; transform: translate(-50%,-50%); z-index: 10;
          transition: background .15s, box-shadow .15s;
          display: flex; align-items: center; justify-content: center;
        }
        .drag-handle:hover { background: rgba(201,168,76,0.5); box-shadow: 0 0 0 5px rgba(201,168,76,.18); }
        .drag-handle:active { cursor: grabbing; background: rgba(201,168,76,0.7); }
        .drag-handle.hidden { display: none; }
        .drag-handle .dh-ico { font-size: 10px; color: var(--accent); pointer-events: none; }
        .drag-handle .dh-label {
          font-size: 0.4rem; color: var(--accent); letter-spacing: 0.06em;
          white-space: nowrap; position: absolute; top: 28px; left: 50%;
          transform: translateX(-50%); background: rgba(0,0,0,.8);
          padding: 2px 6px; border-radius: 3px; pointer-events: none;
          opacity: 0; transition: opacity .15s;
        }
        .drag-handle:hover .dh-label { opacity: 1; }

        .preview-meta {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          position: relative; z-index: 1;
        }
        .preview-dims { font-size: 0.54rem; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }
        .preview-hint { font-size: 0.48rem; color: #2e2e2e; letter-spacing: 0.04em; text-align: center; }

        /* ── BEST TIMES WIDGET ── */
        .best-times-wrap {
          position: relative; z-index: 1;
          width: 100%;
          max-width: 360px;
          background: rgba(13,13,13,0.95);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 10px;
          padding: 0.6rem 0.75rem 0.5rem;
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .bt-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;
        }
        .bt-title {
          font-size: 0.5rem; letter-spacing: 0.16em; color: #555;
          text-transform: uppercase; font-weight: 600; white-space: nowrap;
        }
        .bt-next {
          font-size: 0.55rem; color: var(--accent); font-weight: 700;
          letter-spacing: 0.04em; white-space: nowrap; display: flex; align-items: center; gap: 3px;
        }
        .bt-next-pin {
          font-size: 0.44rem; opacity: 0.7;
          animation: btPin 1.8s ease-in-out infinite;
        }
        @keyframes btPin { 0%,100%{opacity:.5} 50%{opacity:1} }
        .bt-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .bt-col {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .bt-day-name {
          font-size: 0.42rem; letter-spacing: 0.05em; text-transform: uppercase;
          color: #3a3a3a; font-weight: 400; margin-bottom: 1px; padding-bottom: 2px;
          border-bottom: 1px solid transparent; white-space: nowrap;
        }
        .bt-col.bt-today .bt-day-name {
          color: var(--accent); font-weight: 700;
          border-bottom-color: rgba(201,168,76,0.3);
        }
        .bt-slot {
          width: 100%; padding: 3px 1px; border-radius: 3px;
          text-align: center; font-size: 0.37rem;
          letter-spacing: 0.02em; white-space: nowrap;
          font-weight: 400; transition: all .25s; position: relative;
          background: #141414; color: #2e2e2e;
        }
        .bt-slot-other {
          background: #111; color: #2a2a2a;
        }
        .bt-slot-past {
          background: rgba(201,168,76,0.03); color: #2a2a2a; opacity: 0.4;
        }
        .bt-slot-upcoming {
          background: rgba(201,168,76,0.12); color: #a07830;
          border: 1px solid rgba(201,168,76,0.2);
        }
        .bt-slot-next {
          background: var(--accent); color: #000; font-weight: 700;
          box-shadow: 0 0 8px rgba(201,168,76,0.45);
          animation: btNext 2.2s ease-in-out infinite;
        }
        @keyframes btNext {
          0%,100% { box-shadow: 0 0 6px rgba(201,168,76,0.4); }
          50%      { box-shadow: 0 0 14px rgba(201,168,76,0.7); }
        }
        .bt-footnote {
          font-size: 0.38rem; color: #282828; letter-spacing: 0.05em;
          margin-top: 0.4rem; text-align: center;
        }

        /* ── RIGHT: CONTROLS ── */
        .controls {
          background: var(--surface);
          border-left: 1px solid var(--border);
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .controls::-webkit-scrollbar { width: 3px; }
        .controls::-webkit-scrollbar-track { background: transparent; }
        .controls::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        .controls::-webkit-scrollbar-thumb:hover { background: #444; }

        /* ── SECTION STYLES ── */
        .sec { padding: 0.9rem 1.15rem; border-bottom: 1px solid var(--border); }
        .sec:last-child { border-bottom: none; }
        .sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
        .sec-label { font-size: 0.58rem; letter-spacing: 0.18em; color: var(--muted); text-transform: uppercase; font-weight: 600; }
        .sec-note { font-size: 0.52rem; color: #3a3a3a; margin-left: 5px; letter-spacing: 0.04em; }
        .text-body { display: flex; flex-direction: column; gap: 0; }
        .text-body.disabled { opacity: 0.3; pointer-events: none; }
        .fg { margin-top: 0.55rem; }
        .fg:first-child { margin-top: 0; }
        label.lbl { display: block; font-size: 0.68rem; color: #777; margin-bottom: 0.22rem; font-weight: 400; }
        textarea, input[type="text"] {
          width: 100%; background: var(--surface2); border: 1px solid var(--border);
          border-radius: var(--radius); color: var(--text); font-family: 'Inter', sans-serif;
          font-size: 0.84rem; padding: 0.5rem 0.7rem; resize: none;
          transition: border-color .2s; outline: none;
        }
        textarea { min-height: 60px; line-height: 1.5; }
        textarea:focus, input[type="text"]:focus { border-color: var(--accent); }
        .row2 { display: flex; gap: 0.45rem; }
        .row2 > * { flex: 1; min-width: 0; }
        select {
          width: 100%; background: var(--surface2); border: 1px solid var(--border);
          border-radius: var(--radius); color: var(--text); font-family: 'Inter', sans-serif;
          font-size: 0.78rem; padding: 0.45rem 0.65rem; outline: none; cursor: pointer;
          transition: border-color .2s;
        }
        select:focus { border-color: var(--accent); }
        input[type="range"] { width: 100%; accent-color: var(--accent); height: 4px; cursor: pointer; }
        .range-row { display: flex; align-items: center; gap: 0.45rem; }
        .range-row input { flex: 1; }
        .rval { font-size: 0.72rem; color: var(--accent); min-width: 34px; text-align: right; font-weight: 600; }
        .color-row { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
        .cdot { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all .18s; flex-shrink: 0; }
        .cdot:hover { transform: scale(1.12); }
        .cdot.active { border-color: var(--accent); transform: scale(1.18); }
        input[type="color"] { width: 28px; height: 20px; border: 1px solid var(--border); background: var(--surface2); cursor: pointer; border-radius: 4px; padding: 0 2px; flex-shrink: 0; }
        .align-grp { display: flex; gap: 3px; }
        .abtn {
          flex: 1; padding: 0.28rem 0; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 5px; color: #666; cursor: pointer; font-size: 0.68rem;
          transition: all .18s; font-family: 'Inter', sans-serif; letter-spacing: 0.04em;
        }
        .abtn:hover { border-color: #555; color: #bbb; }
        .abtn.active { background: var(--accent); border-color: var(--accent); color: #000; font-weight: 700; }
        .tog {
          width: 30px; height: 16px; background: var(--surface2); border-radius: 8px;
          border: 1px solid var(--border); cursor: pointer; position: relative;
          transition: background .2s; flex-shrink: 0;
        }
        .tog.on { background: var(--accent); border-color: var(--accent); }
        .tog::after {
          content: ''; position: absolute; width: 10px; height: 10px; background: #fff;
          border-radius: 50%; top: 2px; left: 2px; transition: transform .2s;
        }
        .tog.on::after { transform: translateX(14px); }
        .tog-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .tog-row:last-child { margin-bottom: 0; }
        .tog-lbl { font-size: 0.76rem; color: #999; }
        .swatches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .swatch { height: 34px; border-radius: 5px; cursor: pointer; border: 2px solid transparent; transition: all .18s; }
        .swatch:hover { transform: scale(1.06); }
        .swatch.active { border-color: var(--accent); }
        .bg-photos { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-top: 0.55rem; }
        .bgp { aspect-ratio: 9/16; border-radius: 4px; cursor: pointer; border: 2px solid transparent; overflow: hidden; background: var(--surface2); transition: all .18s; position: relative; }
        .bgp:hover { transform: scale(1.06); }
        .bgp.active { border-color: var(--accent); }
        .bgp img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bgp-lbl { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,.7); font-size: 0.38rem; color: #bbb; text-align: center; padding: 1px 0; letter-spacing: .04em; }
        .upload-btn {
          display: block; width: 100%; padding: 0.4rem; background: var(--surface2);
          border: 1px dashed #2e2e2e; border-radius: var(--radius); color: #555;
          cursor: pointer; font-size: 0.7rem; text-align: center; margin-top: 0.4rem;
          transition: all .2s; font-family: 'Inter', sans-serif;
        }
        .upload-btn:hover { border-color: var(--accent); color: var(--accent); }
        .btn-dl {
          width: 100%; padding: 0.75rem; background: var(--accent); color: #000; border: none;
          border-radius: var(--radius); font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700; font-size: 0.84rem; letter-spacing: 0.1em; cursor: pointer;
          transition: all .2s; text-transform: uppercase;
        }
        .btn-dl:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,.3); }
        .bgp .loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.6); font-size: 0.45rem; color: var(--accent); letter-spacing: .08em; }
        .blur-row { display: none; }
        .blur-row.visible { display: block; }
        .curve-controls { display: none; margin-top: 0.35rem; }
        .curve-controls.visible { display: block; }
        .curve-hint { font-size: 0.58rem; color: #555; letter-spacing: 0.05em; margin-top: 0.15rem; display: none; }
        .curve-hint.visible { display: block; }

        /* ── MODALS ── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.78); z-index: 100;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px); padding: 1rem;
        }
        .modal {
          background: #111; border: 1px solid #2a2a2a; border-radius: 14px;
          padding: 1.5rem; width: 100%; max-width: 460px; max-height: 80vh;
          overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,.9);
        }
        .modal h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.06em; color: var(--accent); margin-bottom: 1rem; }
        .modal input[type="text"] {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 8px; color: var(--text); font-family: 'Inter', sans-serif;
          font-size: 0.88rem; padding: 0.6rem 0.85rem; outline: none;
          transition: border-color .2s; margin-bottom: 0.8rem;
        }
        .modal input[type="text"]:focus { border-color: var(--accent); }
        .modal-actions { display: flex; gap: 0.45rem; justify-content: flex-end; }
        .modal-btn {
          padding: 0.5rem 1.1rem; border-radius: 7px; font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700; font-size: 0.78rem; letter-spacing: 0.08em;
          cursor: pointer; transition: all .18s; border: none; text-transform: uppercase;
        }
        .modal-btn.primary { background: var(--accent); color: #000; }
        .modal-btn.primary:hover { background: var(--accent2); }
        .modal-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-btn.secondary { background: var(--surface2); border: 1px solid var(--border); color: #888; }
        .modal-btn.secondary:hover { border-color: #555; color: #ccc; }
        .tpl-grid { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.9rem; }
        .tpl-card {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          padding: 0.65rem 0.9rem; cursor: pointer; transition: all .18s;
          display: flex; align-items: center; justify-content: space-between;
        }
        .tpl-card:hover { border-color: var(--accent); background: rgba(201,168,76,0.05); }
        .tpl-card-name { font-size: 0.86rem; color: var(--text); font-weight: 600; }
        .tpl-card-date { font-size: 0.6rem; color: #555; margin-top: 2px; }
        .tpl-del { background: transparent; border: 1px solid #333; color: #555; border-radius: 5px; padding: 3px 7px; font-size: 0.62rem; cursor: pointer; transition: all .15s; flex-shrink: 0; }
        .tpl-del:hover { border-color: #e86b6b; color: #e86b6b; }
        .tpl-empty { text-align: center; color: #444; font-size: 0.78rem; padding: 1.75rem 0; }
        .tpl-loading { text-align: center; color: #555; font-size: 0.72rem; padding: 1.25rem 0; letter-spacing: 0.08em; }

        /* ── MOBILE (≤ 768px) ── */
        @media (max-width: 768px) {
          html, body { overflow: auto; height: auto; }

          .app-shell { height: auto; overflow: visible; }

          .studio-body {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            height: auto;
            overflow: visible;
          }

          .preview-area {
            position: sticky;
            top: 0;
            z-index: 20;
            background: #060606;
            padding: 0.6rem 0.75rem;
            border-bottom: 1px solid var(--border);
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 0.75rem;
          }
          .preview-label { writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: 0.15em; font-size: 0.45rem; flex-shrink: 0; }
          .canvas-wrap {
            height: auto;
            width: min(180px, 48vw);
            aspect-ratio: 405 / 720;
            border-radius: 10px;
            flex-shrink: 0;
          }
          .preview-meta { align-items: flex-start; gap: 1px; }
          .preview-dims { font-size: 0.48rem; }
          .preview-hint { font-size: 0.42rem; color: #2a2a2a; text-align: left; }

          /* Hide best times on mobile (not enough space in row layout) */
          .best-times-wrap { display: none; }

          .controls {
            height: auto;
            overflow-y: visible;
            overflow-x: visible;
            border-left: none;
            border-top: 1px solid var(--border);
          }

          header {
            position: sticky;
            top: 0;
            z-index: 50;
          }
          .badge { display: none; }
          .undo-btn, .tpl-btn, .logout-btn { padding: 3px 7px; font-size: 0.65rem; }
          .hdr-actions { gap: 0.25rem; }
          .drag-handle { display: none; }
        }

        /* ── TABLET (769px – 1100px) ── */
        @media (min-width: 769px) and (max-width: 1100px) {
          .studio-body { grid-template-columns: 1fr 340px; }
          .canvas-wrap { height: min(calc(100vh - var(--header-h) - 200px), 500px); }
        }
      `}</style>

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div className="modal">
            <h2>💾 Save as Template</h2>
            <input
              type="text"
              placeholder="Template name…"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveTemplate()}
              autoFocus
            />
            {tplMsg && <div style={{color:'#7ecf8e',fontSize:'0.72rem',marginBottom:'0.65rem'}}>{tplMsg}</div>}
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={saveTemplate} disabled={saving || !templateName.trim()}>
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOAD MODAL */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowLoadModal(false); }}>
          <div className="modal">
            <h2>📂 Saved Templates</h2>
            {loadingTpls ? (
              <div className="tpl-loading">LOADING TEMPLATES…</div>
            ) : templates.length === 0 ? (
              <div className="tpl-empty">No saved templates yet. Create one with Save.</div>
            ) : (
              <div className="tpl-grid">
                {templates.map(t => (
                  <div key={t.id} className="tpl-card" onClick={() => applyTemplate(t)}>
                    <div>
                      <div className="tpl-card-name">{t.name}</div>
                      <div className="tpl-card-date">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <button className="tpl-del" onClick={e => deleteTemplate(t.id, e)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowLoadModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-shell">
        <header>
          <div className="logo">REEL <span>COVER</span></div>
          <HeaderTimes />
          <div className="hdr-actions">
            <button className="undo-btn" id="undoBtn" disabled title="Undo (Ctrl+Z)">↩ Undo</button>
            <button className="undo-btn" id="redoBtn" disabled title="Redo (Ctrl+Y)">↪ Redo</button>
            <button className="tpl-btn accent" onClick={() => setShowSaveModal(true)}>💾 Save</button>
            <button className="tpl-btn" onClick={openLoadModal}>📂 Templates</button>
            <button className="logout-btn" onClick={logout}>Logout</button>
            <span className="badge">STUDIO</span>
          </div>
        </header>

        <div className="studio-body">
          {/* ── PREVIEW ── */}
          <div className="preview-area">
            <p className="preview-label">Live Preview · 9:16</p>
            <div className="canvas-wrap" id="canvasWrap">
              <canvas id="preview" width="405" height="720"></canvas>
              <div className="drag-handle hidden" id="dhHook" data-layer="hook"><span className="dh-ico">✥</span><span className="dh-label">HOOK — drag</span></div>
              <div className="drag-handle hidden" id="dhMid"  data-layer="mid"><span className="dh-ico">✥</span><span className="dh-label">BODY — drag</span></div>
              <div className="drag-handle hidden" id="dhSub"  data-layer="sub"><span className="dh-ico">✥</span><span className="dh-label">SUB — drag</span></div>
            </div>
            <div className="preview-meta">
              <p className="preview-dims">1080 × 1920 px</p>
              <p className="preview-hint">Drag ✥ to move · Dbl-click to reset</p>
            </div>

            {/* ── BEST TIMES WIDGET ── */}
            <BestTimesWidget />
          </div>

          {/* ── CONTROLS (scrollable) ── */}
          <div className="controls">

            {/* HANDLE */}
            <div className="sec">
              <div className="sec-head"><p className="sec-label">Handle</p></div>
              <input type="text" id="handleText" defaultValue="@TheBrainTape" placeholder="@yourhandle" />
              <div className="fg">
                <label className="lbl">Color</label>
                <div className="color-row" id="handleColors">
                  <div className="cdot active" style={{background:'#c9a84c'}} data-color="#c9a84c"></div>
                  <div className="cdot" style={{background:'#fff'}} data-color="#ffffff"></div>
                  <div className="cdot" style={{background:'#aaa'}} data-color="#aaaaaa"></div>
                  <div className="cdot" style={{background:'#f5c6c6'}} data-color="#f5c6c6"></div>
                  <div className="cdot" style={{background:'#a8d8ea'}} data-color="#a8d8ea"></div>
                  <div className="cdot" style={{background:'#b5e8c8'}} data-color="#b5e8c8"></div>
                  <div className="cdot" style={{background:'#ffeb3b'}} data-color="#ffeb3b"></div>
                  <div className="cdot" style={{background:'#ff6b6b'}} data-color="#ff6b6b"></div>
                  <div className="cdot" style={{background:'#000'}} data-color="#000000"></div>
                  <input type="color" id="handleColorCustom" defaultValue="#c9a84c" title="Custom color" />
                </div>
              </div>
            </div>

            {/* HOOK LINE */}
            <div className="sec">
              <div className="sec-head">
                <p className="sec-label">Hook Line <span className="sec-note">BIGGEST TEXT</span></p>
                <div className="tog on" id="togHook"></div>
              </div>
              <div className="text-body" id="hookBody">
                <div className="fg"><textarea id="hookText" placeholder="Your attention-grabbing headline...">This changes everything.</textarea></div>
                <div className="fg"><label className="lbl">Font</label><select id="hookFont"></select></div>
                <div className="row2 fg">
                  <div>
                    <label className="lbl">Size</label>
                    <div className="range-row"><input type="range" id="hookSize" min="40" max="130" defaultValue="88" /><span className="rval" id="hookSizeVal">88</span></div>
                  </div>
                  <div>
                    <label className="lbl">Style</label>
                    <select id="hookStyle"><option value="normal">Normal</option><option value="italic" defaultValue>Italic</option></select>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Alignment</label>
                  <div className="align-grp" id="hookAlignGroup">
                    <button className="abtn active" data-align="left">Left</button>
                    <button className="abtn" data-align="center">Center</button>
                    <button className="abtn" data-align="right">Right</button>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Color</label>
                  <div className="color-row" id="hookColors">
                    <div className="cdot active" style={{background:'#fff'}} data-color="#ffffff"></div>
                    <div className="cdot" style={{background:'#c9a84c'}} data-color="#c9a84c"></div>
                    <div className="cdot" style={{background:'#f5c6c6'}} data-color="#f5c6c6"></div>
                    <div className="cdot" style={{background:'#a8d8ea'}} data-color="#a8d8ea"></div>
                    <div className="cdot" style={{background:'#b5e8c8'}} data-color="#b5e8c8"></div>
                    <div className="cdot" style={{background:'#e8c4f0'}} data-color="#e8c4f0"></div>
                    <div className="cdot" style={{background:'#ffeb3b'}} data-color="#ffeb3b"></div>
                    <div className="cdot" style={{background:'#ff6b6b'}} data-color="#ff6b6b"></div>
                    <div className="cdot" style={{background:'#000'}} data-color="#000000"></div>
                    <input type="color" id="hookColorCustom" defaultValue="#ffffff" title="Custom color" />
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Opacity: <span id="hookOpacityVal">100</span>%</label>
                  <input type="range" id="hookOpacity" min="0" max="100" defaultValue="100" />
                </div>
                <div className="fg">
                  <label className="lbl">Rotation: <span id="hookRotationVal">0</span>°</label>
                  <input type="range" id="hookRotation" min="-30" max="30" defaultValue="0" />
                </div>
                <div className="fg">
                  <div className="tog-row" style={{marginBottom:'0.25rem'}}>
                    <span className="tog-lbl" style={{fontSize:'0.7rem'}}>Curved Text Arc</span>
                    <div className="tog" id="togHookCurve"></div>
                  </div>
                  <p className="curve-hint" id="hookCurveHint">Lower radius = tighter curve. Best with single-line hook.</p>
                  <div className="curve-controls" id="hookCurveControls">
                    <label className="lbl">Arc Radius: <span id="hookCurveRadVal">600</span></label>
                    <input type="range" id="hookCurveRad" min="150" max="1200" defaultValue="600" />
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Vertical Position: <span id="hookPosVal">40</span>%</label>
                  <input type="range" id="hookPos" min="5" max="90" defaultValue="40" />
                </div>
              </div>
            </div>

            {/* MID TEXT */}
            <div className="sec">
              <div className="sec-head">
                <p className="sec-label">Body Text <span className="sec-note">MEDIUM</span></p>
                <div className="tog" id="togMid"></div>
              </div>
              <div className="text-body disabled" id="midBody">
                <div className="fg"><input type="text" id="midText" defaultValue="Here is why you need to see this →" placeholder="Body / mid text..." /></div>
                <div className="fg"><label className="lbl">Font</label><select id="midFont"></select></div>
                <div className="row2 fg">
                  <div>
                    <label className="lbl">Size</label>
                    <div className="range-row"><input type="range" id="midSize" min="16" max="72" defaultValue="30" /><span className="rval" id="midSizeVal">30</span></div>
                  </div>
                  <div>
                    <label className="lbl">Style</label>
                    <select id="midStyle"><option value="normal" defaultValue>Normal</option><option value="italic">Italic</option></select>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Alignment</label>
                  <div className="align-grp" id="midAlignGroup">
                    <button className="abtn active" data-align="left">Left</button>
                    <button className="abtn" data-align="center">Center</button>
                    <button className="abtn" data-align="right">Right</button>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Color</label>
                  <div className="color-row" id="midColors">
                    <div className="cdot" style={{background:'#fff'}} data-color="#ffffff"></div>
                    <div className="cdot active" style={{background:'#e0e0e0'}} data-color="#e0e0e0"></div>
                    <div className="cdot" style={{background:'#c9a84c'}} data-color="#c9a84c"></div>
                    <div className="cdot" style={{background:'#f5c6c6'}} data-color="#f5c6c6"></div>
                    <div className="cdot" style={{background:'#a8d8ea'}} data-color="#a8d8ea"></div>
                    <div className="cdot" style={{background:'#b5e8c8'}} data-color="#b5e8c8"></div>
                    <div className="cdot" style={{background:'#ffeb3b'}} data-color="#ffeb3b"></div>
                    <div className="cdot" style={{background:'#ff6b6b'}} data-color="#ff6b6b"></div>
                    <div className="cdot" style={{background:'#000'}} data-color="#000000"></div>
                    <input type="color" id="midColorCustom" defaultValue="#e0e0e0" title="Custom color" />
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Rotation: <span id="midRotationVal">0</span>°</label>
                  <input type="range" id="midRotation" min="-30" max="30" defaultValue="0" />
                </div>
                <div className="fg">
                  <label className="lbl">Vertical Position: <span id="midPosVal">58</span>%</label>
                  <input type="range" id="midPos" min="5" max="90" defaultValue="58" />
                </div>
              </div>
            </div>

            {/* SUPPORTING LINE */}
            <div className="sec">
              <div className="sec-head">
                <p className="sec-label">Supporting Line <span className="sec-note">SMALLEST</span></p>
                <div className="tog on" id="togSub"></div>
              </div>
              <div className="text-body" id="subBody">
                <div className="fg"><input type="text" id="subText" defaultValue="You need to see this." placeholder="Supporting / caption line..." /></div>
                <div className="fg"><label className="lbl">Font</label><select id="subFont"></select></div>
                <div className="row2 fg">
                  <div>
                    <label className="lbl">Size</label>
                    <div className="range-row"><input type="range" id="subSize" min="8" max="36" defaultValue="15" /><span className="rval" id="subSizeVal">15</span></div>
                  </div>
                  <div>
                    <label className="lbl">Style</label>
                    <select id="subStyle"><option value="normal" defaultValue>Normal</option><option value="italic">Italic</option></select>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Alignment</label>
                  <div className="align-grp" id="subAlignGroup">
                    <button className="abtn active" data-align="left">Left</button>
                    <button className="abtn" data-align="center">Center</button>
                    <button className="abtn" data-align="right">Right</button>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Color</label>
                  <div className="color-row" id="subColors">
                    <div className="cdot" style={{background:'#fff'}} data-color="#ffffff"></div>
                    <div className="cdot" style={{background:'#c9a84c'}} data-color="#c9a84c"></div>
                    <div className="cdot" style={{background:'#aaa'}} data-color="#aaaaaa"></div>
                    <div className="cdot active" style={{background:'rgba(255,255,255,0.5)',border:'1px solid #444'}} data-color="rgba(255,255,255,0.5)"></div>
                    <div className="cdot" style={{background:'#f5c6c6'}} data-color="#f5c6c6"></div>
                    <div className="cdot" style={{background:'#a8d8ea'}} data-color="#a8d8ea"></div>
                    <div className="cdot" style={{background:'#ffeb3b'}} data-color="#ffeb3b"></div>
                    <div className="cdot" style={{background:'#ff6b6b'}} data-color="#ff6b6b"></div>
                    <div className="cdot" style={{background:'#000'}} data-color="#000000"></div>
                    <input type="color" id="subColorCustom" defaultValue="#ffffff" title="Custom color" />
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl">Rotation: <span id="subRotationVal">0</span>°</label>
                  <input type="range" id="subRotation" min="-30" max="30" defaultValue="0" />
                </div>
                <div className="fg">
                  <label className="lbl">Vertical Position: <span id="subPosVal">68</span>%</label>
                  <input type="range" id="subPos" min="5" max="90" defaultValue="68" />
                </div>
              </div>
            </div>

            {/* BACKGROUND */}
            <div className="sec">
              <div className="sec-head"><p className="sec-label">Background</p></div>
              <label className="lbl">Gradient Preset <span style={{color:'#333',fontSize:'0.56rem'}}>(sets glow accent)</span></label>
              <div className="swatches" id="bgSwatches">
                <div className="swatch active" data-bg="0" style={{background:'linear-gradient(160deg,#0a0a0a,#1a1200,#0d0d0d)'}}></div>
                <div className="swatch" data-bg="1" style={{background:'linear-gradient(160deg,#0d0620,#1e0a3c,#080415)'}}></div>
                <div className="swatch" data-bg="2" style={{background:'linear-gradient(160deg,#001a14,#003828,#000e0a)'}}></div>
                <div className="swatch" data-bg="3" style={{background:'linear-gradient(160deg,#1a0000,#3d0808,#0d0000)'}}></div>
                <div className="swatch" data-bg="4" style={{background:'linear-gradient(160deg,#0d0d1a,#1a1a3d,#080812)'}}></div>
                <div className="swatch" data-bg="5" style={{background:'linear-gradient(160deg,#1a100a,#3d2005,#120a00)'}}></div>
                <div className="swatch" data-bg="6" style={{background:'linear-gradient(160deg,#111,#2a2a2a)'}}></div>
                <div className="swatch" data-bg="7" style={{background:'linear-gradient(160deg,#050518,#0a0a30,#030310)'}}></div>
              </div>
              <label className="lbl" style={{marginTop:'0.65rem'}}>Photo Backgrounds <span style={{color:'#333',fontSize:'0.56rem'}}>(click to toggle)</span></label>
              <div className="bg-photos" id="bgPhotos"></div>
              <label className="upload-btn" htmlFor="uploadBg">＋ Upload Your Own Image</label>
              <input type="file" id="uploadBg" accept="image/*" style={{display:'none'}} />
              <div className="fg blur-row" id="bgBlurRow">
                <label className="lbl">Background Blur: <span id="bgBlurVal">0</span>px</label>
                <input type="range" id="bgBlurSlider" min="0" max="30" defaultValue="0" />
              </div>
              <div className="fg" style={{marginTop:'0.65rem'}}>
                <label className="lbl">Accent Glow Intensity</label>
                <div className="range-row">
                  <input type="range" id="glowSlider" min="0" max="100" defaultValue="60" />
                  <span className="rval" id="glowVal">60</span>
                </div>
              </div>
            </div>

            {/* EFFECTS */}
            <div className="sec">
              <div className="sec-head"><p className="sec-label">Effects</p></div>
              <div className="tog-row"><span className="tog-lbl">Horizontal Rule</span><div className="tog on" id="togRule"></div></div>
              <div className="tog-row"><span className="tog-lbl">Film Grain</span><div className="tog on" id="togGrain"></div></div>
              <div className="tog-row"><span className="tog-lbl">Vignette</span><div className="tog on" id="togVig"></div></div>
            </div>

            {/* DOWNLOAD */}
            <div className="sec">
              <button className="btn-dl" id="dlBtn">⬇ Download 1080 × 1920 PNG</button>
            </div>

          </div>{/* end .controls */}
        </div>{/* end .studio-body */}
      </div>{/* end .app-shell */}
    </>
  );
}
