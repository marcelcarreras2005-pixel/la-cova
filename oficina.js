// L'oficina
function oficina() {
  const cv = $('gl'), hq = $('hq');
  const vert = hq.clientWidth / hq.clientHeight < .8;
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
  const barreja = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  const rend = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  rend.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  rend.outputEncoding = THREE.sRGBEncoding; rend.toneMapping = THREE.ACESFilmicToneMapping; rend.toneMappingExposure = 1.3;
  rend.shadowMap.enabled = true; rend.shadowMap.type = THREE.PCFSoftShadowMap; rend.shadowMap.autoUpdate = false;
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#05070D');
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 300);
  const OFS = new THREE.Vector3(30, 27, 30); cam.position.copy(OFS); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const R = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), U = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  const K1 = Math.SQRT1_2, K2 = (27 / Math.hypot(30, 27, 30)) * K1;
  const mon = new THREE.Group(); sc.add(mon);
  sc.add(new THREE.HemisphereLight(lin('#AEC4FF'), lin('#0A0E18'), .62));
  const sol = new THREE.DirectionalLight(lin('#FFF4E6'), 1.05); sol.position.set(-16, 34, 22); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 100 }); sol.shadow.camera.updateProjectionMatrix(); sol.shadow.bias = -.0005; sc.add(sol);

  const MC = {}, GB = {};
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (MC[k]) return MC[k]; const m = new THREE.MeshStandardMaterial({ roughness: .68, metalness: .04, ...o }); m.color = lin(c); if (o.emissive) m.emissive = lin(o.emissive); return (MC[k] = m); };
  const neo = (c, o = {}) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.color = lin(c); return m; };
  const gb = (w, h, d) => GB[`${w}_${h}_${d}`] || (GB[`${w}_${h}_${d}`] = new THREE.BoxGeometry(w, h, d));
  const caixa = (w, h, d, m, x, y, z, ombra = true) => { const b = new THREE.Mesh(gb(w, h, d), m); b.position.set(x, y, z); b.castShadow = ombra; b.receiveShadow = true; mon.add(b); return b; };
  const cili = (r1, r2, h, m, x, y, z, seg = 16) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; mon.add(b); return b; };
  const inst = (geo, m, l, ombra = true) => { const im = new THREE.InstancedMesh(geo, m, l.length), o = new THREE.Object3D(); l.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = ombra; im.receiveShadow = true; mon.add(im); return im; };
  const textura = (c) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = rend.capabilities.getMaxAnisotropy(); return t; };

  const terra = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat('#0B101C', { roughness: .8, metalness: .2 })); terra.rotation.x = -Math.PI / 2; terra.receiveShadow = true; mon.add(terra);
  const grid = new THREE.GridHelper(110, 55, 0x1E2C48, 0x141E33); grid.position.y = .012; grid.material.transparent = true; grid.material.opacity = .55; mon.add(grid);

  // Llum suau
  const tc = document.createElement('canvas'); tc.width = tc.height = 128; const tx = tc.getContext('2d'), gr = tx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.28, 'rgba(255,255,255,.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); tx.fillStyle = gr; tx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(tc);
  const llum = (c, s, op = 1) => { const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); m.color = lin(c); const sp = new THREE.Sprite(m); sp.scale.set(s, s, 1); return sp; };

  // El Cervell
  const cerv = new THREE.Group(); mon.add(cerv);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.25, .32, 72), mat('#101828', { metalness: .55, roughness: .42 })); disc.position.y = .16; disc.receiveShadow = disc.castShadow = true; cerv.add(disc);
  const hc = document.createElement('canvas'); hc.width = hc.height = 1024; const hx = hc.getContext('2d'); hx.translate(512, 512); hx.strokeStyle = '#fff';
  [[150, 3], [262, 4], [372, 3], [492, 5]].forEach(([r, w]) => { hx.lineWidth = w; hx.beginPath(); hx.arc(0, 0, r, 0, 6.283); hx.stroke(); });
  for (let i = 0; i < 120; i++) { const a = i / 120 * 6.283, r0 = i % 5 ? 472 : 456; hx.lineWidth = i % 5 ? 2 : 4; hx.beginPath(); hx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); hx.lineTo(Math.cos(a) * 484, Math.sin(a) * 484); hx.stroke(); }
  hx.setLineDash([26, 18]); hx.lineWidth = 3; hx.beginPath(); hx.arc(0, 0, 318, 0, 6.283); hx.stroke(); hx.setLineDash([]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .3; hx.lineWidth = 9; hx.beginPath(); hx.arc(0, 0, 424, a, a + .46); hx.stroke(); }
  const hud = new THREE.Mesh(new THREE.CircleGeometry(3.95, 96), neo('#6FA0FF', { map: new THREE.CanvasTexture(hc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .9 })); hud.rotation.x = -Math.PI / 2; hud.position.y = .335; cerv.add(hud);
  const pc = document.createElement('canvas'); pc.width = 8; pc.height = 256; const px = pc.getContext('2d'), pg = px.createLinearGradient(0, 0, 0, 256); pg.addColorStop(0, 'rgba(255,255,255,0)'); pg.addColorStop(.55, 'rgba(255,255,255,.3)'); pg.addColorStop(1, 'rgba(255,255,255,.95)'); px.fillStyle = pg; px.fillRect(0, 0, 8, 256);
  const raig = new THREE.Mesh(new THREE.CylinderGeometry(.75, 1.5, 6.8, 40, 1, true), neo('#5C98FF', { map: new THREE.CanvasTexture(pc), transparent: true, opacity: .34, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); raig.position.y = 3.72; cerv.add(raig);
  const nucli = new THREE.Mesh(new THREE.SphereGeometry(.92, 32, 24), neo('#DCE9FF')); nucli.position.y = 3.9; cerv.add(nucli);
  const closca = new THREE.Mesh(new THREE.IcosahedronGeometry(1.34, 1), neo('#9CC0FF', { wireframe: true, transparent: true, opacity: .55 })); closca.position.y = 3.9; cerv.add(closca);
  const orbites = [0, 1].map((i) => { const a = new THREE.Mesh(new THREE.TorusGeometry(1.78 + i * .3, .018, 8, 96), neo('#BFD8FF')); a.position.y = 3.9; a.rotation.x = 1.15 + i * .7; a.rotation.y = i * .9; cerv.add(a); return a; });
  const halo = llum('#4F8DFF', 9.5, .9); halo.position.y = 3.9; cerv.add(halo);
  const pl = new THREE.PointLight(lin('#6FA0FF'), 1.6, 26, 2); pl.position.y = 3.6; cerv.add(pl);
  const orbs = [...Array(30)].map((_, i) => { const s = llum('#9CC0FF', .26 + (i % 3) * .1, .9); s.userData = { r: 1.5 + (i % 6) * .4, a: i * .9, v: .15 + (i % 4) * .07, y: (i * .37) % 6 }; cerv.add(s); return s; });
  const pickC = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 6.6, 16), new THREE.MeshBasicMaterial({ visible: false })); pickC.position.y = 3.3; pickC.userData.s = CERV; mon.add(pickC);

  // Plantes i figures
  const gOlla = new THREE.CylinderGeometry(.22, .17, .32, 14), gMata = new THREE.IcosahedronGeometry(.4, 1);
  const planta = (x, y, z) => { const o = new THREE.Mesh(gOlla, mat('#D9D2C5')); o.position.set(x, y + .16, z); o.castShadow = true; mon.add(o); const m = new THREE.Mesh(gMata, mat('#2FA36B', { flatShading: true })); m.position.set(x, y + .62, z); m.scale.y = 1.2; m.castShadow = true; mon.add(m); };
  const gCos = new THREE.CylinderGeometry(.13, .2, .56, 16), gCap = new THREE.SphereGeometry(.155, 18, 14), gPel = new THREE.SphereGeometry(.166, 18, 12, 0, Math.PI * 2, 0, Math.PI * .56), gAur = new THREE.TorusGeometry(.17, .022, 8, 24, Math.PI);
  function ninot(a) {
    const g = new THREE.Group();
    const cos = new THREE.Mesh(gCos, mat(a.c || '#9CC0FF', { roughness: .55 })); cos.position.y = .3; cos.castShadow = true; g.add(cos);
    const cap = new THREE.Mesh(gCap, mat(a.p || '#E2BF9C', { roughness: .5 })); cap.position.y = .74; cap.castShadow = true; g.add(cap);
    const pel = new THREE.Mesh(gPel, mat(a.h || '#2A2A33', { roughness: .6 })); pel.position.y = .755; pel.rotation.x = .2; g.add(pel);
    if (a.u) { const u = new THREE.Mesh(gb(.24, .04, .03), mat('#0B0F19')); u.position.set(0, .755, -.145); g.add(u); }
    if (a.a) { const h = new THREE.Mesh(gAur, mat('#11151F')); h.position.y = .75; g.add(h); }
    return g;
  }

  // Les sales
  const posa = (s) => { const [sx, sy] = vert ? s.P : s.L; s.x = (sx / K1 + sy / K2) / 2; s.z = (sy / K2 - sx / K1) / 2; };
  const Y0 = .3, SEU = Y0 + .33, tops = [], cames = [], monitors = [], peus = [], pantalles = [], teclats = [], seients = [], respatllers = [], bases = [], figs = [], picks = [pickC], fluxos = [];
  for (const s of SALES) {
    posa(s);
    const n = s.ag.length, cols = n >= 16 ? 5 : n >= 9 ? 4 : n >= 5 ? 3 : 2, rows = Math.ceil(n / cols), W = cols * 1.72 + 1.3, Dp = rows * 1.72 + 2.7;
    s.W = W; s.D = Dp;
    s.fm = new THREE.MeshStandardMaterial({ roughness: .62, metalness: .05 }); s.fm.color = lin(barreja(s.c, '#05070D', .42)); s.fm.emissive = lin(s.c); s.fm.emissiveIntensity = 0;
    caixa(W, Y0, Dp, s.fm, s.x, Y0 / 2, s.z);
    caixa(W - 1, .012, rows * 1.72 + .3, mat(barreja(s.c, '#FFFFFF', .1)), s.x + .16, Y0 + .007, s.z - Dp / 2 + .32 + (rows * 1.72 + .3) / 2, false);
    const paret = mat(barreja(s.c, '#05070D', .74), { roughness: .7 }), N = neo(s.c);
    caixa(W, 2.1, .16, paret, s.x, Y0 + 1.05, s.z - Dp / 2 + .08); caixa(.16, 2.1, Dp, paret, s.x - W / 2 + .08, Y0 + 1.05, s.z);
    caixa(W, .05, .05, N, s.x, Y0 + 2.12, s.z - Dp / 2 + .13, false); caixa(.05, .05, Dp, N, s.x - W / 2 + .13, Y0 + 2.12, s.z, false);
    caixa(W, .035, .035, N, s.x, Y0 + .012, s.z + Dp / 2, false); caixa(.035, .035, Dp, N, s.x + W / 2, Y0 + .012, s.z, false);
    s.lamp = new THREE.PointLight(lin(s.c), 0, 13, 2); s.lamp.position.set(s.x + .5, 3.1, s.z + .5); mon.add(s.lamp);
    planta(s.x + W / 2 - .42, Y0, s.z - Dp / 2 + .44);
    s.ag.forEach((a, i) => {
      const cx = s.x - W / 2 + 1.25 + (i % cols) * 1.72, cz = s.z - Dp / 2 + 1.25 + Math.floor(i / cols) * 1.72;
      tops.push([cx, Y0 + .6, cz]); cames.push([cx - .58, Y0 + .29, cz], [cx + .58, Y0 + .29, cz]);
      monitors.push([cx, Y0 + .92, cz - .18]); peus.push([cx, Y0 + .72, cz - .2]); pantalles.push([cx, Y0 + .92, cz - .152]); teclats.push([cx, Y0 + .64, cz + .1]);
      seients.push([cx, Y0 + .3, cz + .62]); respatllers.push([cx, Y0 + .55, cz + .84]); bases.push([cx, Y0 + .13, cz + .62]);
      const g = ninot(a), f = { a, g, s, cx, cz, idx: pantalles.length - 1, lloc: a.st > 0 ? 'taula' : 'cafe' };
      if (a.st > 0) g.position.set(cx, SEU, cz + .6);
      mon.add(g); figs.push(f);
      if (a.st === 2) { const v = llum('#4BD59A', .62, .95); v.position.y = 1.2; g.add(v); }
    });
    const pick = new THREE.Mesh(gb(W, 2.6, Dp), new THREE.MeshBasicMaterial({ visible: false })); pick.position.set(s.x, 1.3, s.z); pick.userData.s = s; mon.add(pick); picks.push(pick);
    s.pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [0, 2.5].map((y) => new THREE.Vector3(s.x + a * W / 2, y, s.z + b * Dp / 2)));
    // Zona d'ajudants
    const bw = W - 1.2, bd = 1.15, bc = document.createElement('canvas'); bc.width = 640; bc.height = Math.round(640 * bd / bw); const bx = bc.getContext('2d'); bx.strokeStyle = 'rgba(255,255,255,.7)'; bx.lineWidth = 3; bx.setLineDash([16, 11]); bx.strokeRect(4, 4, bc.width - 8, bc.height - 8); bx.fillStyle = 'rgba(255,255,255,.62)'; bx.font = '600 22px Inter,sans-serif'; bx.fillText("ZONA D'AJUDANTS", 18, bc.height - 15);
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(bw, bd), neo('#FFFFFF', { map: textura(bc), transparent: true, depthWrite: false, opacity: .8 })); bay.rotation.x = -Math.PI / 2; bay.position.set(s.x + .1, Y0 + .02, s.z + Dp / 2 - .72); mon.add(bay);
  }
  // Pantalla de paret amb la xifra de cada sala
  const paretKpi = { marqueting: [coma(D.xarxes.kpi ? D.xarxes.kpi.eng : 0) + ' %', 'interacció · 30 dies'], enginyeria: [webOk ? 'En línia' : 'Caiguda', 'web · ' + D.hora], vendes: [D.embut.clients + ' / 3', 'clients'], operacions: [String(D.tasques.length), 'tasques teves'], direccio: [String(D.dec.length), 'decisions'] };
  const pintaParets = () => { for (const s of SALES) {
    const c = s.tela || (s.tela = document.createElement('canvas')); c.width = 640; c.height = 320; const x = c.getContext('2d'), [big, sm] = paretKpi[s.id];
    x.fillStyle = '#080C16'; x.fillRect(0, 0, 640, 320); x.fillStyle = s.c; x.fillRect(0, 0, 640, 12);
    let fs = 130; do { x.font = `500 ${fs}px "JetBrains Mono",ui-monospace,monospace`; fs -= 6; } while (x.measureText(big).width > 580);
    x.fillStyle = '#F4F6FB'; x.textBaseline = 'middle'; x.fillText(big, 30, 140); x.fillStyle = '#B3BCCF'; x.font = '500 44px Inter,sans-serif'; x.fillText(sm, 32, 256);
    if (s.telaT) s.telaT.needsUpdate = true;
  } };
  pintaParets();
  for (const s of SALES) { s.telaT = textura(s.tela); const w = Math.min(s.W * .46, 3.2), p = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), neo('#FFFFFF', { map: s.telaT })); p.position.set(s.x - s.W / 2 + w / 2 + .5, Y0 + 1.34, s.z - s.D / 2 + .175); mon.add(p); caixa(w + .1, w / 2 + .1, .04, mat('#05070D'), p.position.x, p.position.y, p.position.z - .03, false); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pintaParets);

  // Detalls de cada equip
  { const m = SALES[0], x = m.x + m.W / 2 - 1.4, z = m.z - m.D / 2 + .5; const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .045, 10, 40), neo('#FFF3DC')); ring.position.set(x, Y0 + 1.5, z); mon.add(ring); cili(.02, .02, 1.3, mat('#11151F'), x, Y0 + .65, z); const g = llum('#FFE9C2', 1.6, .5); g.position.set(x, Y0 + 1.5, z + .05); mon.add(g); }
  { const e = SALES[1], x = e.x + e.W / 2 - 1.5, z = e.z - e.D / 2 + .55; caixa(.8, 1.75, .6, mat('#0E1320', { metalness: .4 }), x, Y0 + .875, z); for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) caixa(.06, .05, .02, neo((r * 4 + c) % 5 ? '#4BD59A' : '#FE8500'), x - .24 + c * .16, Y0 + .3 + r * .2, z + .31, false); }
  { const v = SALES[2], x = v.x + v.W / 2 - 1.3, z = v.z - v.D / 2 + .42; cili(.03, .03, 1.1, mat('#3A2A12'), x, Y0 + .55, z); const b = new THREE.Mesh(new THREE.CylinderGeometry(.13, .27, .34, 18), mat('#E8B64C', { metalness: .75, roughness: .32 })); b.position.set(x, Y0 + 1.24, z); b.castShadow = true; mon.add(b); }
  { const o = SALES[3], x = o.x + o.W / 2 - 1.15, z = o.z - o.D / 2 + .42; [0, 1].forEach((k) => { caixa(.5, 1.1, .46, mat('#3B4254'), x - k * .54, Y0 + .55, z); for (let r = 0; r < 3; r++) caixa(.42, .02, .02, mat('#9AA4B8'), x - k * .54, Y0 + .3 + r * .34, z + .24, false); }); }

  // Escriptoris
  const mEsc = mat('#E7E1D5', { roughness: .5 }), mFos = mat('#222838'), mCad = mat('#171C29', { roughness: .55 });
  inst(gb(1.28, .06, .64), mEsc, tops); inst(gb(.06, .58, .54), mFos, cames); inst(gb(.66, .42, .05), mat('#0B0F19'), monitors); inst(gb(.08, .2, .05), mFos, peus);
  inst(gb(.36, .02, .13), mat('#3B4254'), teclats); inst(gb(.42, .07, .42), mCad, seients); inst(gb(.42, .46, .06), mCad, respatllers); inst(new THREE.CylinderGeometry(.04, .15, .26, 10), mFos, bases);
  const pantIM = inst(gb(.6, .36, .01), new THREE.MeshBasicMaterial({ toneMapped: false }), pantalles, false);
  const cOn = lin('#CFE4FF'), cMig = lin('#4C7FE0'), cOff = lin('#0C1220');
  figs.forEach((f) => pantIM.setColorAt(f.idx, f.a.st === 2 ? cOn : f.a.st === 1 ? cMig : cOff)); pantIM.instanceColor.needsUpdate = true;

  // La cafeteria
  posa(CAFE);
  const lliuresF = figs.filter((f) => f.lloc === 'cafe'), taules = Math.max(1, Math.ceil(lliuresF.length / 4)), tcols = Math.min(3, taules), trows = Math.ceil(taules / tcols);
  const CW = tcols * 2.75 + 1.3, CD = trows * 2.75 + 2.1; CAFE.W = CW; CAFE.D = CD;
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const fx = fc.getContext('2d'); for (let i = 0; i < 8; i++) { fx.fillStyle = ['#8A5A33', '#94613A', '#7E5230', '#9A6840'][i % 4]; fx.fillRect(0, i * 32, 256, 31); fx.fillStyle = '#5B3A20'; fx.fillRect(0, i * 32 + 31, 256, 1); fx.fillRect((i * 83) % 256, i * 32, 2, 31); }
  const ft = textura(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(CW / 5, CD / 5);
  CAFE.fm = new THREE.MeshStandardMaterial({ map: ft, roughness: .7 }); CAFE.fm.emissive = lin(CAFE.c); CAFE.fm.emissiveIntensity = 0;
  caixa(CW, Y0, CD, CAFE.fm, CAFE.x, Y0 / 2, CAFE.z);
  const Nc = neo('#FFD9A8'); caixa(CW, .035, .035, Nc, CAFE.x, Y0 + .012, CAFE.z + CD / 2, false); caixa(.035, .035, CD, Nc, CAFE.x + CW / 2, Y0 + .012, CAFE.z, false);
  caixa(CW - 1.6, .9, .55, mat('#3A2A1C'), CAFE.x, Y0 + .45, CAFE.z - CD / 2 + .4); caixa(CW - 1.5, .06, .65, mat('#E7E1D5'), CAFE.x, Y0 + .93, CAFE.z - CD / 2 + .4);
  caixa(.5, .46, .34, mat('#9AA4B8', { metalness: .7, roughness: .3 }), CAFE.x - CW / 2 + 1.4, Y0 + 1.19, CAFE.z - CD / 2 + .4);
  CAFE.lamp = new THREE.PointLight(lin('#FFC58A'), 0, 13, 2); CAFE.lamp.position.set(CAFE.x, 3.2, CAFE.z); mon.add(CAFE.lamp);
  for (let i = 0; i < 7; i++) { const l = llum('#FFD9A8', .5, .9), t = i / 6; l.position.set(CAFE.x - CW / 2 + .4 + t * (CW - .8), Y0 + 1.95 - Math.sin(t * Math.PI) * .32, CAFE.z - CD / 2 + .1); mon.add(l); }
  planta(CAFE.x + CW / 2 - .4, Y0, CAFE.z - CD / 2 + .4); planta(CAFE.x - CW / 2 + .4, Y0, CAFE.z + CD / 2 - .4);
  const taulaL = [], peuL = [], tamL = []; let si = 0;
  for (let t = 0; t < taules; t++) {
    const tx0 = CAFE.x - CW / 2 + 1.55 + (t % tcols) * 2.75, tz0 = CAFE.z - CD / 2 + 2.3 + Math.floor(t / tcols) * 2.75;
    taulaL.push([tx0, Y0 + .62, tz0]); peuL.push([tx0, Y0 + .3, tz0]);
    for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + Math.PI / 4, x = tx0 + Math.cos(an) * .88, z = tz0 + Math.sin(an) * .88; tamL.push([x, Y0 + .17, z]); const f = lliuresF[si++]; if (f) { f.g.position.set(x, SEU, z); f.g.rotation.y = Math.atan2(x - tx0, z - tz0); } }
  }
  inst(new THREE.CylinderGeometry(.56, .56, .05, 24), mEsc, taulaL); inst(new THREE.CylinderGeometry(.05, .2, .6, 12), mFos, peuL); inst(new THREE.CylinderGeometry(.2, .2, .34, 14), mat('#5C4630'), tamL);
  const pickF = new THREE.Mesh(gb(CW, 2, CD), new THREE.MeshBasicMaterial({ visible: false })); pickF.position.set(CAFE.x, 1, CAFE.z); pickF.userData.s = CAFE; mon.add(pickF); picks.push(pickF);
  CAFE.pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [0, 2].map((y) => new THREE.Vector3(CAFE.x + a * CW / 2, y, CAFE.z + b * CD / 2)));
  CERV.pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [0, 6.4].map((y) => new THREE.Vector3(a * 4.4, y, b * 4.4)));

  // L'Alfred, al costat del Cervell
  { const a = ninot({ c: '#14161D', p: '#E2BF9C', h: '#C9CED8' }); a.position.set(2.5, .32, 2.1); a.rotation.y = -2.4; mon.add(a); const b = new THREE.Mesh(gb(.08, .3, .02), neo('#F4F6FB')); b.position.set(0, .34, -.17); a.add(b); }

  // Camins de llum
  for (const s of [...SALES, CAFE]) {
    const a = new THREE.Vector3(s.x, 0, s.z).normalize().multiplyScalar(4.1).setY(.03), b = new THREE.Vector3(s.x, .03, s.z), d = b.clone().sub(a), L = d.length();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, .1), neo(s.c, { transparent: true, opacity: .6, depthWrite: false })); m.rotation.set(-Math.PI / 2, 0, -Math.atan2(d.z, d.x)); m.position.copy(a).addScaledVector(d, .5); mon.add(m);
    a.y = b.y = .12;
    for (let k = 0; k < 2; k++) { const sp = llum(s.c, .8, 1); mon.add(sp); fluxos.push({ sp, a, b, t: k * .5, v: .15 + (k ? .03 : .07) }); }
  }

  // Etiquetes
  const lbs = $('lbs'), lb = [
    ...SALES.map((s) => ({ p: new THREE.Vector3(s.x - s.W / 2, 2.6, s.z - s.D / 2), html: () => `<b><i style="background:${s.c}"></i>${esc(s.nom)}<em>${s.taula}/${s.ag.length}</em></b><span>${s.taula} de ${s.ag.length} a la taula</span>` })),
    { p: new THREE.Vector3(CAFE.x - CW / 2, .9, CAFE.z + CD / 2), html: () => `<b><i style="background:${CAFE.c}"></i>Cafeteria<em>${figs.filter((f) => f.lloc === 'cafe').length}</em></b><span>${figs.filter((f) => f.lloc === 'cafe').length} sense feina</span>` },
    { p: new THREE.Vector3(3, .3, 3), html: () => `<b><i style="background:${CERV.c}"></i>El Cervell<em>${D.docs}</em></b><span>${D.docs} documents · ${D.dec.length} decisions</span>`, baix: 1 },
  ];
  for (const l of lb) { l.el = document.createElement('div'); l.el.className = 'lb'; l.el.innerHTML = l.html(); lbs.appendChild(l.el); }
  const refresca = () => { for (const l of lb) l.el.innerHTML = l.html(); };

  // Càmera: encaixa uns punts dins d'un rectangle de la pantalla
  const totsPts = [...SALES.flatMap((s) => s.pts), ...CAFE.pts, new THREE.Vector3(0, 7, 0)];
  const v = { k: 10, tx: 0, ty: 0 }, vt = { k: 10, tx: 0, ty: 0 };
  let gir = 0, girT = 0;
  function encaixa(pts, sf) {
    const w = hq.clientWidth, h = hq.clientHeight; let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const p of pts) { const x = p.dot(R), y = p.dot(U); a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
    const k = Math.min((sf.r - sf.l) / (b - a), (sf.b - sf.t) / (d - c));
    return { k, tx: (a + b) / 2 - ((sf.l + sf.r) / 2 - w / 2) / k, ty: (c + d) / 2 + ((sf.t + sf.b) / 2 - h / 2) / k };
  }
  function centra(s) {
    const w = hq.clientWidth, h = hq.clientHeight, mob = w < 760, sala = s && s.pts;
    const sf = { l: mob ? 8 : 24, t: mob ? 70 : 86, r: w - (mob ? 8 : 24), b: h - (mob ? 150 : 112) };
    if (obert) { if (mob) { sf.b = h * .3; sf.t = 58; } else sf.r = w - 452; }
    Object.assign(vt, encaixa(sala ? s.pts : totsPts, sf));
    if (sala) { vt.k = Math.min(vt.k, mob ? 34 : 58); girT = 0; }
    if (quiet) Object.assign(v, vt);
  }
  function aplica() { const w = hq.clientWidth, h = hq.clientHeight, a = w / (2 * v.k), b = h / (2 * v.k); cam.left = -a; cam.right = a; cam.top = b; cam.bottom = -b; cam.updateProjectionMatrix(); cam.position.copy(OFS).addScaledVector(R, v.tx).addScaledVector(U, v.ty); }
  function mida() { rend.setSize(hq.clientWidth, hq.clientHeight, false); centra(obert); }
  addEventListener('resize', mida); mida(); Object.assign(v, vt); if (!quiet) v.k *= .84;

  // Tocar, girar i assenyalar
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2(), hover = matchMedia('(hover:hover)').matches; let baixa = null, sobre = null;
  const apunta = (e) => { const r = cv.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, cam); const h = ray.intersectObjects(picks, false)[0]; return h ? h.object.userData.s : null; };
  cv.addEventListener('pointerdown', (e) => { baixa = { x: e.clientX, y: e.clientY, g: girT, m: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* el punter ja no hi és */ } });
  cv.addEventListener('pointermove', (e) => {
    if (baixa) { const dx = e.clientX - baixa.x; baixa.m = Math.max(baixa.m, Math.abs(dx), Math.abs(e.clientY - baixa.y)); if (!obert) girT = Math.max(-.7, Math.min(.7, baixa.g + dx * .005)); return; }
    if (hover && !obert) { const s = apunta(e); if (s !== sobre) { sobre = s; cv.classList.toggle('mans', !!s); } }
  });
  cv.addEventListener('pointerup', (e) => { const b = baixa; baixa = null; if (!b || b.m > 7) return; const s = apunta(e); if (s) obre(s); else if (obert) tanca(); });
  cv.addEventListener('pointercancel', () => { baixa = null; });

  // Caminar de la cafeteria a la taula
  const caminants = [], extres = [];
  function cami(f) {
    const s = f.s, V = (x, y, z) => new THREE.Vector3(x, y, z), p = [];
    const sortida = V(CAFE.x - CAFE.W / 2 - .5, 0, CAFE.z - CAFE.D / 2 - .5); p.push(V(CAFE.x - CAFE.W / 2 + .3, Y0, f.g.position.z), sortida);
    const q = V(s.x + s.W / 2 + .6, 0, s.z + s.D / 2 + .6), pre = [];
    if (s.z - s.D / 2 > 0) pre.push(V(q.x, 0, s.z - s.D / 2 - .6));
    if (s.x - s.W / 2 > 0) pre.push(V(s.x - s.W / 2 - .6, 0, q.z));
    const obj = pre[0] || q, a0 = Math.atan2(sortida.z, sortida.x); let da = Math.atan2(obj.z, obj.x) - a0; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
    const passos = Math.max(2, Math.ceil(Math.abs(da) / .4)); for (let i = 0; i <= passos; i++) { const a = a0 + da * i / passos; p.push(V(Math.cos(a) * 4.9, 0, Math.sin(a) * 4.9)); }
    p.push(...pre); if (!pre.length || s.x - s.W / 2 > 0) p.push(q);
    const passadis = f.cz + 1.12; p.push(V(s.x + s.W / 2 + .35, 0, passadis), V(s.x + s.W / 2 - .2, Y0, passadis), V(f.cx, Y0, passadis), V(f.cx, SEU, f.cz + .6));
    return p;
  }
  function camina(f, fi) {
    f.lloc = 'camina'; refresca();
    if (quiet) { f.g.position.set(f.cx, SEU, f.cz + .6); f.g.rotation.y = 0; if (fi) fi(); return; }
    const halo2 = llum('#9CC0FF', .9, .85); halo2.position.y = 1.15; f.g.add(halo2); caminants.push({ f, p: cami(f), i: 0, ph: 0, y: f.g.position.y, fi, halo2 });
  }
  function ajudants(s, n) {
    for (let k = 0; k < n; k++) { const g = new THREE.Group(), c = new THREE.Mesh(gCos, neo('#9CC0FF', { transparent: true, opacity: .8 })), h = new THREE.Mesh(gCap, neo('#DCE9FF', { transparent: true, opacity: .85 })); c.position.y = .3; h.position.y = .74; g.add(c, h); g.position.set(s.x + (k - (n - 1) / 2) * .9, Y0, s.z + s.D / 2 - .72); g.scale.setScalar(.01); mon.add(g); extres.push({ t: 0, g, dur: 11, retard: k * .22 }); }
  }
  function ordre(o, cb) {
    const s = SALES.find((x) => x.id === o.s), f = figs.find((x) => x.s === s && x.lloc === 'cafe');
    const sp = llum('#CFE4FF', 1.7, 1), a = new THREE.Vector3(0, 3.9, 0), b = new THREE.Vector3(s.x, 1.2, s.z); mon.add(sp);
    extres.push({ t: 0, sp, a, b, fi() { s.flash = 1; ajudants(s, 3); } });
    if (f) { s.taula++; camina(f, () => { pantIM.setColorAt(f.idx, cOn); pantIM.instanceColor.needsUpdate = true; f.lloc = 'taula'; f.a.st = 2; refresca(); }); }
    cb(f ? f.a : s.ag[0]);
  }
  // Bafarades amb la feina real
  const parlen = figs.filter((f) => f.a.st > 0 && f.a.j); let bi = 0, bubF = null;
  function bafarada() {
    if (obert || !parlen.length || quiet) return;
    bubF = parlen[bi++ % parlen.length]; const t = bubF.a.j.replace(/^(Lliurat avui|A la cua):\s*/, ''); $('bub').innerHTML = `<b>${esc(bubF.a.n)}</b> · ${esc(t.length > 62 ? t.slice(0, 60) + '…' : t)}`; $('bub').hidden = false;
    setTimeout(() => { $('bub').hidden = true; bubF = null; }, 4200);
  }
  setInterval(bafarada, 6500); setTimeout(bafarada, 1800);

  let ultim = 0, escolta = 0, oida = 0, inici = 0, frames = 0;
  const vv = new THREE.Vector3();
  function pas(t) {
    const dt = Math.min(.05, (t - ultim) / 1000 || .016); ultim = t; if (!inici) inici = t;
    const s = quiet ? 0 : t / 1000, e5 = quiet ? 1 : 1 - Math.exp(-dt * 4.5), on0 = quiet ? 99 : (t - inici) / 1000;
    v.k += (vt.k - v.k) * e5; v.tx += (vt.tx - v.tx) * e5; v.ty += (vt.ty - v.ty) * e5; aplica();
    const girAnt = gir; gir += (girT - gir) * (quiet ? 1 : 1 - Math.exp(-dt * 8)); mon.rotation.y = gir;
    oida += (escolta - oida) * (quiet ? 1 : 1 - Math.exp(-dt * 6));
    hud.rotation.z = s * .05; closca.rotation.y = s * (.4 + oida * 1.6); closca.rotation.x = s * .2; orbites[0].rotation.z = s * .5; orbites[1].rotation.z = -s * .36;
    nucli.scale.setScalar(1 + Math.sin(s * 2) * .04 + oida * (.3 + Math.sin(s * 9) * .1)); halo.scale.setScalar(9.5 * (1 + oida * .5)); halo.material.opacity = .78 + Math.sin(s * 2) * .12; pl.intensity = 1.5 + Math.sin(s * 2) * .3 + oida * 2; raig.material.opacity = .32 + oida * .3;
    for (const o of orbs) { const u = o.userData, a = u.a + s * u.v, y = (u.y + s * .35 * (1 + oida * 2)) % 6.4; o.position.set(Math.cos(a) * u.r, .4 + y, Math.sin(a) * u.r); o.material.opacity = Math.sin(y / 6.4 * Math.PI) * .95; }
    for (const f of fluxos) { f.t = (f.t + f.v * dt) % 1; f.sp.position.lerpVectors(f.a, f.b, f.t); f.sp.material.opacity = Math.sin(f.t * Math.PI); }
    [...SALES, CAFE].forEach((r, i) => {
      const on = Math.max(0, Math.min(1, (on0 - i * .14) / .5)); r.flash = Math.max(0, (r.flash || 0) - dt * .9);
      r.fm.emissiveIntensity = (r === CAFE ? .05 : .13) * on + (sobre === r ? .14 : 0) + r.flash * .75; r.lamp.intensity = (r === CAFE ? 1.5 : 1.25) * on + r.flash * 2.2;
    });
    for (const q of figs) if (q.lloc === 'taula' && q.a.st === 2) q.g.position.y = SEU + Math.abs(Math.sin(s * 3.2 + q.idx)) * .03;
    for (let i = caminants.length - 1; i >= 0; i--) {
      const w = caminants[i], g = w.f.g; let queda = 8.5 * dt; w.ph += dt * 13;
      while (queda > 0 && w.i < w.p.length) { const d = w.p[w.i], dx = d.x - g.position.x, dz = d.z - g.position.z, L = Math.hypot(dx, dz); if (L <= queda) { g.position.x = d.x; g.position.z = d.z; w.i++; queda -= L; } else { g.position.x += dx / L * queda; g.position.z += dz / L * queda; g.rotation.y = Math.atan2(-dx, -dz); queda = 0; } }
      const ty = w.i < w.p.length ? w.p[w.i].y : SEU; w.y += (ty - w.y) * Math.min(1, dt * 11); g.position.y = w.y + Math.abs(Math.sin(w.ph)) * .07;
      if (w.i >= w.p.length) { g.remove(w.halo2); g.position.y = SEU; g.rotation.y = 0; caminants.splice(i, 1); if (w.fi) w.fi(); }
    }
    for (let i = extres.length - 1; i >= 0; i--) {
      const x = extres[i]; x.t += dt;
      if (x.sp) { const k = Math.min(1, x.t / .85); x.sp.position.lerpVectors(x.a, x.b, k); if (k >= 1) { mon.remove(x.sp); extres.splice(i, 1); x.fi(); } continue; }
      const u = x.t - x.retard, e = u < 0 ? .01 : u < .35 ? u / .35 : u > x.dur - .5 ? Math.max(.01, (x.dur - u) / .5) : 1; x.g.scale.setScalar(e * .86 + .001); if (u >= x.dur) { mon.remove(x.g); extres.splice(i, 1); }
    }
    if (frames < 4 || caminants.length || Math.abs(gir - girAnt) > .0004) rend.shadowMap.needsUpdate = true; frames++;
    rend.render(sc, cam);
    const w = hq.clientWidth, h = hq.clientHeight;
    if (!obert) for (const l of lb) { vv.copy(l.p).applyMatrix4(mon.matrixWorld).project(cam); const x = (vv.x * .5 + .5) * w, y = (-vv.y * .5 + .5) * h; l.el.style.transform = `translate(${x}px,${y}px) translate(-50%,${l.baix ? '6px' : '-100%'})`; }
    if (bubF) { vv.copy(bubF.g.position); vv.y += 1.25; vv.applyMatrix4(mon.matrixWorld).project(cam); const bw = $('bub').offsetWidth, bh = $('bub').offsetHeight, x = Math.max(bw / 2 + 8, Math.min(w - bw / 2 - 8, (vv.x * .5 + .5) * w)), y = Math.max(bh + 62, (-vv.y * .5 + .5) * h); $('bub').style.transform = `translate(${x}px,${y}px) translate(-50%,-100%) translateY(-8px)`; }
  }
  G = { centra, ordre, refresca, escolta(b) { escolta = b ? 1 : 0; } };
  let vis = true; new IntersectionObserver((en) => { vis = en[0].isIntersecting; }, { threshold: .05 }).observe(hq);
  const bucle = (t) => { if (vis && !document.hidden) pas(t); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
}
