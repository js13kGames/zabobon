// skróty/aliasy dla krótszego kodu + stałe GL (ONE const only)
const D = document,
  C = D.getElementById("gl"),
  G = C.getContext("webgl"),
  M = Math,
  S = M.sin,
  Q = M.cos,
  H = M.hypot,
  F = Float32Array,
  R = () => M.random(),
  RB = (a, b) => a + R() * (b - a),
  // stałe WebGL jako numery
  AB = 34962,
  ST = 35044,
  DT = 2929,
  LNS = 1,
  DYN = 35048,
  // stałe używane dalej
  MAX_LAMPS = 16,
  QUOTES = {
    general: [
      "A cat has night in its paws.",
      "In the dark, all cats are lucky.",
      // "Where the cat looks, secrets follow.",
      // "Midnight belongs to whiskers.",
      "Paws are silent; omens are loud.",
      // "A blink of gold in a sea of black.",
      // "Bad luck fears a brave cat.",
      // "Follow the tail; fear the glare.",
      // "Darkness purrs back.",
      // "Fortune sits where the cat sits.",
      // "By moonlight, whiskers tell truths.",
    ],
    intro: [
      "Follow the red dot, they said. You'll be fine, they said.",
      "Bring them bad luck... follow the red dot.",
      "Summon the black Volga. Chase the red light.",
    ],
    nineLives: [
      "Nine lives aren't infinite.",
      // "Down to eight? Keep your whiskers sharp.",
      "Nine lives, one shadow.",
      "Spend a life wisely, cat!!!",
    ],
  },
  // core utility functions as arrows
  SH = (t, s) => {
    let h = G.createShader(t);
    G.shaderSource(h, s);
    G.compileShader(h);
    if (!G.getShaderParameter(h, 35713)) throw G.getShaderInfoLog(h);
    return h;
  },
  gal = (name) => G.getAttribLocation(PGM, name),
  gul = (name) => G.getUniformLocation(PGM, name),
  U3 = (u, x, y, z) => {
    G.uniform3f(u, x, y, z);
  },
  UM = (m) => {
    G.uniformMatrix4fv(uM, false, m);
  },
  VB = (d) => {
    let b = G.createBuffer();
    G.bindBuffer(AB, b);
    G.bufferData(AB, d, ST);
    return b;
  },
  BA = (b, loc, s) => {
    G.bindBuffer(AB, b);
    G.vertexAttribPointer(loc, s, G.FLOAT, false, 0, 0);
    G.enableVertexAttribArray(loc);
  },
  // geometry and helper builders as arrows
  faceN = (v) => {
    const n = new F(v.length);
    for (let i = 0; i < v.length; i += 9) {
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = v.slice(i, i + 9);
      const ux = bx - ax,
        uy = by - ay,
        uz = bz - az,
        vx = cx - ax,
        vy = cy - ay,
        vz = cz - az;
      let nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz = ux * vy - uy * vx,
        il = 1 / (H(nx, ny, nz) || 1);
      nx *= il;
      ny *= il;
      nz *= il;
      n.set([nx, ny, nz, nx, ny, nz, nx, ny, nz], i);
    }
    return n;
  },
  grid = (s = 20, st = 1) => {
    const v = [];
    for (let i = -s; i <= s; i += st) {
      v.push(-s, 0, i, s, 0, i, i, 0, -s, i, 0, s);
    }
    return new F(v);
  },
  planeXZ = (size = 50) =>
    new F([
      -size,
      0,
      -size,
      size,
      0,
      -size,
      size,
      0,
      size,
      -size,
      0,
      -size,
      size,
      0,
      size,
      -size,
      0,
      size,
    ]),
  buildCapsule = (len, rad, Ri = 12, Sl = 18, orient = "x") => {
    const v = [];
    const h = len / 2,
      rings = [];
    for (let i = 0; i <= Ri; i++) {
      const u = i / Ri;
      const t = (-h + u * len) / h;
      const rr = rad * M.sqrt(M.max(0, 1 - t * t));
      const ring = [];
      for (let j = 0; j <= Sl; j++) {
        const a = (j / Sl) * 6.28318,
          c = Q(a),
          s = S(a);
        let x = 0,
          y = 0,
          z = 0;
        if (orient === "x") {
          x = -h + u * len;
          y = rr * c;
          z = rr * s;
        } else {
          y = -h + u * len;
          x = rr * c;
          z = rr * s;
        }
        ring.push([x, y, z]);
      }
      rings.push(ring);
    }
    for (let i = 0; i < Ri; i++) {
      const A = rings[i],
        B = rings[i + 1];
      for (let j = 0; j < Sl; j++) {
        const P = A[j],
          P1 = A[j + 1],
          Q0 = B[j],
          Q1 = B[j + 1];
        v.push(
          P[0],
          P[1],
          P[2],
          Q0[0],
          Q0[1],
          Q0[2],
          P1[0],
          P1[1],
          P1[2],
          P1[0],
          P1[1],
          P1[2],
          Q0[0],
          Q0[1],
          Q0[2],
          Q1[0],
          Q1[1],
          Q1[2]
        );
      }
    }
    return new F(v);
  },
  roundedBody = (l = 0.9, r = 0.22, Ri = 12, Sl = 18) =>
    buildCapsule(l, r, Ri, Sl, "x"),
  sphere = (cx, cy, cz, r = 0.14, st = 8, sl = 12) => {
    const v = [];
    for (let i = 0; i < st; i++) {
      const v0 = i / st,
        v1 = (i + 1) / st,
        ph0 = v0 * M.PI,
        ph1 = v1 * M.PI;
      for (let j = 0; j < sl; j++) {
        const u0 = j / sl,
          u1 = (j + 1) / sl,
          th0 = u0 * 2 * M.PI,
          th1 = u1 * 2 * M.PI;
        const p = (ph, th) => [
            cx + r * S(ph) * Q(th),
            cy + r * Q(ph),
            cz + r * S(ph) * S(th),
          ],
          A = p(ph0, th0),
          B = p(ph1, th0),
          C = p(ph0, th1),
          D = p(ph1, th1);
        v.push(...A, ...B, ...C, ...C, ...B, ...D);
      }
    }
    return new F(v);
  },
  leg = (len = 0.45, rad = 0.05, Ri = 12, Sl = 18) =>
    buildCapsule(len, rad, Ri, Sl, "y"),
  cube = (s = 0.35) => {
    const h = s / 2,
      vPacked =
        "+--++-++++--++++-+--+-++-+---+-+-----+--+++++-+-+++++---+---+----++--+-+--++-++++--++++-+++------+-+---+-++-";
    const v = vPacked.split("").map((c) => (c === "+" ? h : -h));
    const nPacked =
        "+..+..+..+..+..+..-..-..-..-..-..-...+..+..+..+..+..+..-..-..-..-..-..-...+..+..+..+..+..+..-..-..-..-..-..-",
      n = nPacked.split("").map((c) => (c === "+" ? 1 : c === "-" ? -1 : 0));
    return { v: new F(v), n: new F(n), count: v.length / 3 };
  },
  pyramidUnit = (s) => {
    const h = s,
      a = s * 0.5,
      A = [-a, 0, -a],
      B = [a, 0, -a],
      C = [a, 0, a],
      D = [-a, 0, a],
      P = [0, h, 0],
      v = new F([
        ...A,
        ...B,
        ...P,
        ...B,
        ...C,
        ...P,
        ...C,
        ...D,
        ...P,
        ...D,
        ...A,
        ...P,
      ]),
      n = faceN(v);
    for (let i = 0; i < n.length; i++) n[i] = -n[i];
    return { v, n, count: v.length / 3 };
  },
  quad = (w = 0.2, h = 0.3) =>
    new F([
      -w / 2,
      -h / 2,
      0,
      w / 2,
      -h / 2,
      0,
      -w / 2,
      h / 2,
      0,
      w / 2,
      h / 2,
      0,
    ]),
  // scene/lighting helpers (batch 2)
  buildings = () => {
    const B = [],
      margin = 2.3,
      add = (x, z, sx, sy, sz, color) =>
        B.push({ x, y: sy * CB * 0.5, z, sx, sy, sz, color });
    // side facades (Z axis)
    for (let z = -LIM; z <= LIM; ) {
      let w = RB(10, 20),
        h = RB(12, 20),
        d = RB(7, 9),
        gap = RB(0.4, 0.9);
      w = Math.min(w, (PLAZA_SIZE - z) / CB);
      add(-(LIM + margin), z + w * CB * 0.5, d, h, w, [0.62, 0.6, 0.56]);
      add(+(LIM + margin), z + w * CB * 0.5, d, h, w, [0.58, 0.6, 0.65]);
      z += w * CB + gap;
    }
    // front facades (X axis)
    for (let x = -LIM; x <= LIM; ) {
      let w = RB(10, 20),
        h = RB(8, 16),
        d = RB(7, 9),
        gap = RB(0, 0.3);
      w = Math.min(w, (PLAZA_SIZE - x) / CB);
      add(x + w * CB * 0.5, -(LIM + margin), w, h, d, [0.95, 0.92, 0.85]);
      x += w * CB + gap;
    }
    return B;
  },
  computeHeadlight = () => {
    const fx = Q(yaw),
      fz = S(yaw),
      hx = cat[0] + fx * 0.15,
      hy = 0.38,
      hz = cat[2] + fz * 0.15,
      ahead = 4.0 * CAT.bodyLen * CAT.scale,
      tx = cat[0] + fx * ahead,
      tz = cat[2] + fz * ahead;
    let ax = tx - hx,
      ay = 0 - hy,
      az = tz - hz;
    const ar = H(ax, ay, az) || 1;
    ax /= ar;
    ay /= ar;
    az /= ar;
    return { pos: [hx, hy, hz], dir: [ax, ay, az] };
  },
  smoothstep = (edge0, edge1, x) => {
    const t = M.max(0, M.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
  keyLightAt = (x, z) => {
    const Lx = 0,
      Ly = 5,
      Lz = 15,
      gx = x,
      gy = 0,
      gz = z;
    let tLx = Lx - gx,
      tLy = Ly - gy,
      tLz = Lz - gz;
    let rL = H(tLx, tLy, tLz) || 1;
    let ldirx = tLx / rL,
      ldiry = tLy / rL,
      ldirz = tLz / rL;
    let ndl = M.max(ldiry, 0);
    let attenG = 1.0 / (ATT0 + ATT1 * rL + ATT2 * rL * rL);
    let gBright = ndl * attenG;
    let gDir = [-ldirx, -ldiry, -ldirz];
    if (lampK_current <= 0.0) {
      if (gBright > 0.0) return { dir: gDir, strength: gBright };
      return { dir: gDir, strength: 0.0 };
    }
    let bestB = 0,
      bestDir = [0, -1, 0];
    for (let i = 0; i < LAMPS.length; i++) {
      const lx = LAMPS[i].x,
        lz = LAMPS[i].z;
      const dx = gx - lx,
        dy = gy - LAMP_Y,
        dz = gz - lz;
      const r = H(dx, dy, dz) || 1;
      const lpx = dx / r,
        lpy = dy / r,
        lpz = dz / r;
      const dDot = -lpy;
      const spot = smoothstep(LAMP_ODOT, LAMP_IDOT, dDot);
      const lambert = M.max(-lpy, 0);
      const atten = 1.0 / (ATT0 + ATT1 * r + ATT2 * r * r);
      const b = lambert * atten * spot * lampK_current;
      if (b > bestB) {
        bestB = b;
        bestDir = [lpx, lpy, lpz];
      }
    }
    if (bestB > gBright) return { dir: bestDir, strength: bestB };
    return { dir: gDir, strength: gBright };
  },
  beginShadow = (dir, alpha) => {
    G.uniform1f(uShadow, 1.0);
    G.uniform3f(uShadowDir, dir[0], dir[1], dir[2]);
    G.uniform1f(uOpacity, alpha);
    G.uniform1f(uAmbientK, 0.0);
    G.uniform1f(uDiffuseK, 0.0);
  },
  endShadow = () => {
    G.uniform1f(uShadow, 0.0);
    G.uniform1f(uOpacity, 1.0);
    G.uniform1f(uAmbientK, 0.2);
    G.uniform1f(uDiffuseK, 0.8);
  },
  // UI helpers
  updateHearts = () => {
    const heartEls = heartsDiv.querySelectorAll(".heart");
    heartEls.forEach((el, i) => {
      if (i < catLives) {
        el.classList.remove("lost");
      } else {
        el.classList.add("lost");
      }
    });
  },
  updateAvatarHUD = () => {
    if (!AVATAR_EYES || !AVATAR_CROSS) return;
    if (catHit) {
      AVATAR_EYES.style.display = "none";
      AVATAR_CROSS.style.display = "flex";
    } else {
      AVATAR_CROSS.style.display = "none";
      AVATAR_EYES.style.display = "flex";
      const s = Math.max(0.06, Math.min(1, eyeBlink));
      AVATAR_EYES.style.transform = `translate(-50%,-50%) scale(0.85, ${s})`;
    }
  },
  // HUD counters
  updateStats = () => {
    SZ.textContent = "☠ " + unlucky;
  },
  upTime = (s) => {
    TZ.textContent = "⏱ " + s.toFixed(1) + "s";
  },
  // drawing routines
  drawWindow = (cx, cy, cz, rotY, w, h) => {
    U3(uC, 0.23, 0.33, 0.58);
    UM(X.m(X.T(cx, cy, cz), X.m(X.Ry(rotY), X.S(w, h, 1))));
    BA(qVB, aP, 3);
    BA(upVB, aN, 3);
    G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
  },
  drawDoor = (cx, cy, cz, rotY, w, h) => {
    U3(uC, 0.29, 0.18, 0.08);
    BA(qVB, aP, 3);
    BA(qNZVB, aN, 3);
    UM(
      X.m(
        X.T(cx, cy, cz),
        X.m(X.Ry(rotY), X.m(X.T(0, 0, 0.0015), X.S(w, h, 1)))
      )
    );
    G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
  },
  drawLamp = (x, z) => {
    const pole = X.m(X.T(x, 0, z), X.S(0.3, 9, 0.3)),
      lampTop = X.m(X.T(x, 3, z), X.S(1, 1, 1));
    BA(roofVB, aP, 3);
    BA(roofNB, aN, 3);
    U3(uC, 0.3, 0.3, 0.3);
    UM(pole);
    G.drawArrays(G.TRIANGLES, 0, roofCnt);
    BA(headVB, aP, 3);
    G.disableVertexAttribArray(aN);
    G.vertexAttrib3f(aN, 0, 0, 1);
    U3(uC, 1, 1, 0.6);
    UM(lampTop);
    G.drawArrays(G.TRIANGLES, 0, headCnt);
    G.enableVertexAttribArray(aN);
  },
  drawVolga = (x, z, lift) => {
    const body = { sx: 5, sy: 0.8, sz: 2 },
      roof = { sx: 2.2, sy: 0.55, sz: 1.55 },
      half = (o) => ({
        x: o.sx * CB * 0.5,
        y: o.sy * CB * 0.5,
        z: o.sz * CB * 0.5,
      }),
      hb = half(body),
      hr = half(roof),
      Bm = X.T(x, lift, z),
      box = (T, c) => {
        BA(cubeVB, aP, 3);
        BA(cubeNB, aN, 3);
        UM(T);
        U3(uC, c[0], c[1], c[2]);
        G.drawArrays(G.TRIANGLES, 0, cubeCnt);
      },
      lx = +hb.x - 0.07,
      ly = 0.26,
      lz = hb.z - 0.18,
      wR = 0.5,
      wT = 0.22,
      axZ = hb.z + wT * 0.5 + 0.01,
      axF = +(hb.x - 0.18),
      axR = -(hb.x - 0.18),
      sink = 0.01,
      wy = wR - lift - sink,
      wheel = (wx, wz) => {
        BA(headVB, aP, 3);
        BA(headNB, aN, 3);
        UM(X.m(Bm, X.m(X.T(wx, wy, wz), X.S(wR, wR, wT))));
        U3(uC, 0.5, 0.5, 0.5);
        G.drawArrays(G.TRIANGLES, 0, headCnt);
      };
    box(X.m(Bm, X.S(body.sx, body.sy, body.sz)), [0.05, 0.05, 0.06]);
    box(
      X.m(
        Bm,
        X.m(X.T(0, hb.y + hr.y + 0.01, 0), X.S(roof.sx, roof.sy, roof.sz))
      ),
      [0.05, 0.05, 0.06]
    );
    box(
      X.m(Bm, X.m(X.T(+lx, ly, +lz), X.S(0.18, 0.14, 0.14))),
      [0.95, 0.95, 0.9]
    );
    box(
      X.m(Bm, X.m(X.T(+lx, ly, -lz), X.S(0.18, 0.14, 0.14))),
      [0.95, 0.95, 0.9]
    );
    wheel(axF, +axZ);
    wheel(axF, -axZ);
    wheel(axR, +axZ);
    wheel(axR, -axZ);
  },
  drawHumanFull = (B, isY, p) => {
    const ph = walk + p.pos[0] * 2.1,
      lg = S(ph) * 0.3,
      ar = -lg * 0.7,
      armS = X.S(0.71, 0.82, 0.71),
      hr = 0.14,
      headW = 2 * hr,
      headD = 2 * hr,
      lensDepth = 0.05 * headD,
      lensR = 0.45 * headW * 0.5 * 0.75,
      gx = hr + lensDepth * 0.5 + 0.002,
      bridgeW = 0.16 * headW,
      zCenter = bridgeW * 0.5 + lensR,
      Hh = X.m(B, X.T(0, 0.99, 0)),
      drawLens = (Lm) => {
        U3(uC, 0, 0, 0);
        BA(cylVB, aP, 3);
        BA(cylNB, aN, 3);
        UM(X.m(Lm, X.S(lensDepth, lensR, lensR)));
        G.drawArrays(G.TRIANGLES, 0, cylCnt);
      },
      LmL = X.m(Hh, X.T(gx, 0, -zCenter)),
      LmR = X.m(Hh, X.T(gx, 0, +zCenter)),
      armLen = 0.5 * headD,
      armSeg = armLen / 2,
      armH = lensR * 0.8,
      yArm = 0,
      zEdgeL = -zCenter - lensR,
      zEdgeR = +zCenter + lensR;
    U3(uC, isY ? 1 : 1.0, isY ? 1 : 0.5, isY ? 0 : 0.7);
    BA(legVB, aP, 3);
    BA(legNB, aN, 3);
    UM(X.m(B, X.m(X.T(0, 0.275, 0.09), X.Rz(lg))));
    G.drawArrays(G.TRIANGLES, 0, legCnt);
    UM(X.m(B, X.m(X.T(0, 0.275, -0.09), X.Rz(-lg))));
    G.drawArrays(G.TRIANGLES, 0, legCnt);
    BA(torsoVB, aP, 3);
    BA(torsoNB, aN, 3);
    UM(X.m(B, X.T(0, 0.55, 0)));
    G.drawArrays(G.TRIANGLES, 0, torsoCnt);
    BA(legVB, aP, 3);
    BA(legNB, aN, 3);
    UM(X.m(B, X.m(X.m(X.T(0, 0.55, 0.18), X.Rz(ar)), armS)));
    G.drawArrays(G.TRIANGLES, 0, legCnt);
    UM(X.m(B, X.m(X.m(X.T(0, 0.55, -0.18), X.Rz(-ar)), armS)));
    G.drawArrays(G.TRIANGLES, 0, legCnt);
    BA(headVB, aP, 3);
    BA(headVB, aN, 3);
    UM(X.m(B, X.T(0, 0.99, 0)));
    G.drawArrays(G.TRIANGLES, 0, headCnt);
    drawLens(LmL);
    drawLens(LmR);
    U3(uC, 0, 0, 0);
    BA(qVB, aP, 3);
    BA(qNZVB, aN, 3);
    UM(
      X.m(
        Hh,
        X.m(X.T(gx, 0, 0), X.m(X.Ry(-M.PI / 2), X.S(bridgeW, lensR * 0.6, 1)))
      )
    );
    G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
    for (const zEdge of [zEdgeL, zEdgeR]) {
      for (const mul of [0.5, 1.5]) {
        UM(
          X.m(
            Hh,
            X.m(X.T(gx - armSeg * mul, yArm, zEdge), X.S(armSeg, armH, 1))
          )
        );
        G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
      }
    }
  },
  drawCat = (Mc, speed, blink) => {
    const Ms = X.m(Mc, X.S(CAT.scale, CAT.scale, CAT.scale)),
      CC = blink ? [1, 0.3, 0.3] : [0, 0, 0],
      EAR = [0, 0, 0],
      hk = CAT.headR / 0.14,
      Mh = X.m(Ms, X.T(0.7, CAT.bodyRad * 0.2, 0)),
      eyeX = CAT.headR * 0.95,
      eyeY = CAT.bodyRad * 0.05,
      eyeZ = CAT.headR * 0.45,
      eSZ = CAT.headR * (1.0 / 3.0) * 4,
      eSY = eSZ * eyeBlink * 2,
      eSX = CAT.headR * 0.08,
      pupilW = eSZ * 0.08,
      pupilH = eSY * 0.9,
      pupilOff = CAT.headR * 0.02,
      eS = 0.18,
      eZ = CAT.headR * 0.35,
      eY = CAT.bodyRad * 0.2 + CAT.headR * 0.9,
      eX = 0.7 - CAT.headR * 0.2,
      hipY = -0.02,
      hipZ = 0.18,
      fx = 0.4,
      bx = -0.4,
      amp = 0.55 * M.min(speed / (10 * 0.8), 1),
      sw = (ph) => S(ph) * amp,
      fr = sw(walk),
      fl = sw(walk + M.PI),
      br = sw(walk + M.PI),
      bl = sw(walk),
      legDraw = ([hx, hy, hz, a]) => {
        UM(X.m(Ms, X.m(X.T(hx, hy, hz), X.m(X.Rz(a), X.T(0, -0.275, 0)))));
        G.drawArrays(G.TRIANGLES, 0, legCnt);
      },
      seg = 0.38,
      segs = 3,
      lag = 0.6,
      wag = 0.35 * (0.5 + 0.5 * M.min(speed / 10, 1));
    U3(uC, CC[0], CC[1], CC[2]);
    UM(Ms);
    BA(bodyVB, aP, 3);
    BA(bodyNB, aN, 3);
    G.drawArrays(G.TRIANGLES, 0, bodyCnt);
    UM(X.m(Mh, X.S(hk, hk, hk)));
    BA(headVB, aP, 3);
    BA(headVB, aN, 3);
    G.drawArrays(G.TRIANGLES, 0, headCnt);
    U3(uC, 223.0 / 255.0, 1.0, 90.0 / 255.0);
    BA(headVB, aP, 3);
    BA(headNB, aN, 3);
    for (const z of [eyeZ, -eyeZ]) {
      UM(X.m(Mh, X.m(X.T(eyeX, eyeY, z), X.S(eSX, eSY, eSZ))));
      G.drawArrays(G.TRIANGLES, 0, headCnt);
    }
    U3(uC, 0, 0, 0);
    BA(qVB, aP, 3);
    BA(qNZVB, aN, 3);
    for (const z of [eyeZ, -eyeZ]) {
      UM(
        X.m(
          Mh,
          X.m(
            X.T(eyeX + pupilOff, eyeY, z),
            X.m(X.Ry(-M.PI / 2), X.S(pupilW, pupilH, 1))
          )
        )
      );
      G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
    }
    BA(roofVB, aP, 3);
    BA(roofNB, aN, 3);
    U3(uC, EAR[0], EAR[1], EAR[2]);
    for (const z of [eZ, -eZ]) {
      UM(X.m(Ms, X.m(X.T(eX, eY, z), X.S(eS, eS, eS))));
      G.drawArrays(G.TRIANGLES, 0, roofCnt);
    }
    U3(uC, CC[0], CC[1], CC[2]);
    BA(legVB, aP, 3);
    BA(legNB, aN, 3);
    legDraw([fx, hipY, hipZ, fr]);
    legDraw([fx, hipY, -hipZ, fl]);
    legDraw([bx, hipY, hipZ, br]);
    legDraw([bx, hipY, -hipZ, bl]);
    BA(tailVB, aP, 3);
    BA(tailNB, aN, 3);
    let Mc2 = X.m(Ms, X.T(-0.4, 0.1, 0));
    for (let s = 0; s < segs; s++) {
      const ay = S(tail + s * lag) * wag;
      Mc2 = X.m(Mc2, X.m(X.Ry(ay), X.T(-seg * 0.5, 0, 0)));
      UM(Mc2);
      G.drawArrays(G.TRIANGLES, 0, tailCnt);
      Mc2 = X.m(Mc2, X.T(-seg * 0.5, 0, 0));
    }
  };

// WebGL musi istnieć
if (!G) throw "WebGL?";

// Top-level globals (ONE let only)
let W = C.width,
  Hpx = C.height,
  mx = W / 2,
  my = Hpx / 2,
  // shader source holders
  VS = `attribute vec3 p, n; uniform mat4 P, V, M; uniform float shadow; uniform vec3 shadowDir; uniform float shadowYOffset; varying vec3 vN, vW; void main() { vec4 w = M * vec4(p, 1.0); if (shadow > 0.5) { float denom = shadowDir.y; denom = (abs(denom) < 1.0e-5) ? (denom < 0.0 ? -1.0e-5 : 1.0e-5) : denom; float k = w.y / denom; w.x -= shadowDir.x * k; w.z -= shadowDir.z * k; w.y = shadowYOffset; vW = w.xyz; vN = vec3(0.0, 1.0, 0.0); gl_Position = P * V * w; } else { vW = w.xyz; mat3 Nmat = mat3(M[0].xyz, M[1].xyz, M[2].xyz); vN = normalize(Nmat * n); gl_Position = P * V * w; } }`,
  FS = `precision mediump float;varying vec3 vN,vW;uniform vec3 C;uniform float scene;uniform vec3 L;uniform vec3 Lcolor;uniform float ambientK;uniform float diffuseK;const int MAX_LAMPS=16;uniform int lampCount;uniform vec3 lampPos[MAX_LAMPS];uniform vec3 lampDir[MAX_LAMPS];uniform vec3 lampColor[MAX_LAMPS];uniform float lampInnerDot[MAX_LAMPS];uniform float lampOuterDot[MAX_LAMPS];uniform vec3 att;uniform float lampK;uniform float opacity;uniform float headOn;uniform vec3 headPos;uniform vec3 headDir;uniform vec3 headColor;uniform float headInnerDot;uniform float headOuterDot;void main(){vec3 n=normalize(vN);vec3 ambient=C*ambientK*scene;vec3 toL=L-vW;float rL=length(toL);vec3 ldir=toL/max(rL,1e-5);float ndl=max(dot(n,ldir),0.0);vec3 globalDiff=C*diffuseK*ndl*Lcolor*scene;vec3 spotSum=vec3(0.0);for(int i=0;i<MAX_LAMPS;++i){if(i>=lampCount)break;vec3 Lp=lampPos[i];vec3 Ld=lampDir[i];vec3 toPoint=vW-Lp;float r=length(toPoint);vec3 lightToPoint=toPoint/max(r,1e-5);float d=dot(Ld,lightToPoint);float spot=smoothstep(lampOuterDot[i],lampInnerDot[i],d);float lambert=max(dot(n,-lightToPoint),0.0);float atten=1.0/(att.x+att.y*r+att.z*r*r);spotSum+=C*diffuseK*lambert*atten*spot*lampColor[i]*lampK;}vec3 headSum=vec3(0.0);if(headOn>0.5){vec3 toPoint=vW-headPos;float r=length(toPoint);vec3 lightToPoint=toPoint/max(r,1.0e-5);float d=dot(headDir,lightToPoint);float spot=smoothstep(headOuterDot,headInnerDot,d);float lambert=max(dot(n,-lightToPoint),0.0);float atten=1.0/(att.x+att.y*r+att.z*r*r);headSum=C*diffuseK*lambert*atten*spot*headColor;}vec3 color=ambient+globalDiff+spotSum+headSum;color=pow(clamp(color,0.0,1.0),vec3(1.0/1.4));gl_FragColor=vec4(color,opacity);}`,
  // math/transform helpers object
  X,
  // program + attrib/uniform handles
  PGM,
  aP,
  aN,
  uP,
  uV,
  uM,
  uL,
  uC,
  uShadow,
  uShadowDir,
  uShadowYOffset,
  uOpacity,
  uHeadOn,
  uHeadPos,
  uHeadDir,
  uHeadColor,
  uHeadInner,
  uHeadOuter,
  uLampK,
  uScene,
  uLcolor,
  uAmbientK,
  uDiffuseK,
  uAtt,
  uLampCount,
  uLampPos,
  uLampDir,
  uLampColor,
  uLampInner,
  uLampOuter,
  // mesh/grid globals
  GRID,
  gridVB,
  upN,
  upVB,
  // extra mesh buffers
  torsoV,
  torsoN,
  torsoVB,
  torsoNB,
  torsoCnt,
  // planes and sizes
  PLAZA_SIZE = 24,
  GRASS_SIZE = 200,
  grassV = planeXZ(GRASS_SIZE),
  grassVB = VB(grassV),
  plazaV = planeXZ(PLAZA_SIZE),
  plazaVB = VB(plazaV),
  // scene constants and flags
  CB = 0.35,
  LIM = 23,
  CAT = { scale: 0.6, bodyLen: 1.2, bodyRad: 0.25, headR: 0.18 },
  EPSY = 0.0015,
  extraSpawned = false,
  // geometry buffers
  bodyV,
  bodyN,
  bodyVB,
  bodyNB,
  bodyCnt,
  legV,
  legN,
  legVB,
  legNB,
  legCnt,
  tailV,
  tailN,
  tailVB,
  tailNB,
  tailCnt,
  headV,
  headN,
  headVB,
  headNB,
  headCnt,
  cubeM,
  cubeVB,
  cubeNB,
  cubeCnt,
  pyr,
  roofVB,
  roofNB,
  roofCnt,
  qV = quad(),
  qVB = VB(qV),
  cylV,
  cylN,
  cylVB,
  cylNB,
  cylCnt,
  qNZ,
  qNZVB,
  // buildings and lamps
  BLD = buildings(),
  TOWN = BLD[0],
  ZF = -(LIM + 1.2),
  LAMPS,
  // lighting constants
  LAMP_Y = 3,
  LAMP_DIR = [0, -1, 0],
  LAMP_IDOT = M.cos((25 * M.PI) / 180),
  LAMP_ODOT = M.cos((50 * M.PI) / 180),
  ATT0 = 1.0,
  ATT1 = 0.14,
  ATT2 = 0.07,
  HEAD_IDOT = M.cos((12 * M.PI) / 180),
  HEAD_ODOT = M.cos((22 * M.PI) / 180),
  // lamp blinking state
  LAMP_BLINK_SEQ = [
    { on: 120, off: 160 },
    { on: 200, off: 240 },
    { on: 320, off: 420 },
  ],
  lampBlinking = 0,
  lampBlinkStart = 0,
  lampStable = 0,
  prevNightF = 0,
  lampK_current = 0,
  // laser and crowd
  laserV = new F(18),
  laserVB = VB(laserV),
  CROWD = 25,
  ppl,
  // game state
  cat = [0, 0, 0],
  vel = [0, 0, 0],
  yaw = 0,
  cam = [0, 6, 10],
  aim = [0, 0],
  walk = 0,
  tail = 0,
  catHit = 0,
  catHitT = 0,
  catLives = 9,
  eyeBlink = 1.0,
  blinkState = 0,
  blinkT = 0,
  nextBlink = 1.5 + R() * 2.5,
  prevCatHit = 0,
  // HUD
  heartsDiv = document.getElementById("hearts"),
  SZ = document.createElement("span"),
  TZ = D.createElement("span"),
  t0 = 0,
  tStart = 0,
  playing = 0,
  OV,
  E,
  AVATAR_EYES,
  AVATAR_CROSS,
  unlucky = 0,
  // loop timing
  prev = performance.now(),
  // function placeholders to avoid extra const declarations
  spawnExtraPeople,
  loop;

// canvas w pikselach CSS (bez DPR) + viewport
onresize = () => {
  C.width = innerWidth;
  C.height = innerHeight;
  G.viewport(0, 0, C.width, C.height);
};
onresize();

// pozycja wskaźnika w pikselach CSS, start od środka
onpointermove = (e) => {
  mx = e.clientX;
  my = e.clientY;
};

// --- Top-level initializations (assignments) ---
// HUD: hearts and stats
for (let i = 0; i < 9; i++) {
  const span = document.createElement("span");
  span.textContent = "♥";
  span.classList.add("heart");
  heartsDiv.appendChild(span);
}
SZ.style.marginLeft = "8px";
SZ.style.color = "#fff";
heartsDiv.appendChild(SZ);
updateStats();

// time readout in HUD
TZ.style.marginLeft = "8px";
TZ.style.color = "#fff";
heartsDiv.appendChild(TZ);
upTime(0);

// flags and loop timing

// kompilacja/linkowanie programu + uchwyty atrybutów/uniformów
PGM = G.createProgram();
G.attachShader(PGM, SH(G.VERTEX_SHADER, VS));
G.attachShader(PGM, SH(G.FRAGMENT_SHADER, FS));
G.linkProgram(PGM);
if (!G.getProgramParameter(PGM, 35714)) throw G.getProgramInfoLog(PGM);
G.useProgram(PGM);

aP = gal("p");
aN = gal("n");
uP = gul("P");
uV = gul("V");
uM = gul("M");
uL = gul("L");
uC = gul("C");
// shadow uniforms
uShadow = gul("shadow");
uShadowDir = gul("shadowDir");
uShadowYOffset = gul("shadowYOffset");
uOpacity = gul("opacity");
// headlight uniforms
uHeadOn = gul("headOn");
uHeadPos = gul("headPos");
uHeadDir = gul("headDir");
uHeadColor = gul("headColor");
uHeadInner = gul("headInnerDot");
uHeadOuter = gul("headOuterDot");
// lamp blinking intensity uniform
uLampK = gul("lampK");

uScene = gul("scene");
// default opaque draws
G.uniform1f(uOpacity, 1.0);
// default shadow off and offset
G.uniform1f(uShadow, 0.0);
G.uniform1f(uShadowYOffset, 0.002);

//światla lamp

// --- nowe uniformy oświetlenia ---
uLcolor = gul("Lcolor");
uAmbientK = gul("ambientK");
uDiffuseK = gul("diffuseK");
uAtt = gul("att");

uLampCount = gul("lampCount");

// Tablice lamp (MAX_LAMPS = 16; zostaw jak w FS)
uLampPos = gul("lampPos");
uLampDir = gul("lampDir");
uLampColor = gul("lampColor");
uLampInner = gul("lampInnerDot");
uLampOuter = gul("lampOuterDot");

// głębia włączona (zasłanianie obiektów)
G.enable(DT);
// polygon offset włączony
G.enable(G.POLYGON_OFFSET_FILL);
// blending for semi-transparent shadows
G.enable(G.BLEND);
G.blendFunc(G.SRC_ALPHA, G.ONE_MINUS_SRC_ALPHA);

// macierze/wektory: minimalny zestaw (I, proj, lookAt, mul, TRS, proste wektory)
X = {
  I: () => new F([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  p: (f, a, zn, zf) => {
    const t = 1 / M.tan(f / 2),
      A = (zf + zn) / (zn - zf),
      B = (2 * zf * zn) / (zn - zf);
    return new F([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, A, -1, 0, 0, B, 0]);
  },
  v: (e, t, u) => {
    let [ex, ey, ez] = e,
      [tx, ty, tz] = t,
      [ux, uy, uz] = u,
      zx = ex - tx,
      zy = ey - ty,
      zz = ez - tz,
      l = 1 / (H(zx, zy, zz) || 1);
    zx *= l;
    zy *= l;
    zz *= l;
    let xx = uy * zz - uz * zy,
      xy = uz * zx - ux * zz,
      xz = ux * zy - uy * zx;
    l = 1 / (H(xx, xy, xz) || 1);
    xx *= l;
    xy *= l;
    xz *= l;
    let yx = zy * xz - zz * xy,
      yy = zz * xx - zx * xz,
      yz = zx * xy - zy * xx;
    return new F([
      xx,
      yx,
      zx,
      0,
      xy,
      yy,
      zy,
      0,
      xz,
      yz,
      zz,
      0,
      -(xx * ex + xy * ey + xz * ez),
      -(yx * ex + yy * ey + yz * ez),
      -(zx * ex + zy * ey + zz * ez),
      1,
    ]);
  },
  m: (A, B) => {
    const C = new F(16);
    for (let c = 0; c < 4; c++) {
      const b0 = B[c * 4],
        b1 = B[c * 4 + 1],
        b2 = B[c * 4 + 2],
        b3 = B[c * 4 + 3];
      C[c * 4] = A[0] * b0 + A[4] * b1 + A[8] * b2 + A[12] * b3;
      C[c * 4 + 1] = A[1] * b0 + A[5] * b1 + A[9] * b2 + A[13] * b3;
      C[c * 4 + 2] = A[2] * b0 + A[6] * b1 + A[10] * b2 + A[14] * b3;
      C[c * 4 + 3] = A[3] * b0 + A[7] * b1 + A[11] * b2 + A[15] * b3;
    }
    return C;
  },
  T: (x, y, z) => new F([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
  Rx: (a) => {
    const c = Q(a),
      s = S(a);
    return new F([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  },
  Ry: (a) => {
    const c = Q(a),
      s = S(a);
    return new F([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
  },
  Rz: (a) => {
    const c = Q(a),
      s = S(a);
    return new F([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  },
  S: (x, y, z) => new F([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]),
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cr: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  nm: (v) => {
    const l = 1 / H(v[0], v[1], v[2]);
    return [v[0] * l, v[1] * l, v[2] * l];
  },
};

// VBO helpery: tworzenie i podpinanie atrybutu

// normalne per-triangle - tańsze niż zbieranie i wygładzanie po wierzchołkach

// siatka podłogi + normalne w górę
((GRID = grid(25, 1)), (gridVB = VB(GRID)), (upN = new F(GRID.length)));
for (let i = 1; i < upN.length; i += 3) upN[i] = 1;
upVB = VB(upN);

// --- PŁASZCZYZNY PODŁOGI (trawa + plac) ---

// wspólny generator kapsuły (walec z zaokrąglonymi końcami)

// owalne ciało wzdłuż osi X, gęstość: Ri (pierścienie), Sl (podziały wokół)

// sfera z podziałów (używana też jako koła po spłaszczeniu Z)

// walec z zaokrąglonymi końcami wzdłuż Y (nogi/ramiona/torso)

// sześcian jako 12 trójkątów + normalne ścian

// piramida (dach) — 4 ściany, normalne odwrócone na zewnątrz

// quad do rysowania okien (TRIANGLE_STRIP)

// stałe sceny i proporcje kota
CB = 0.35;
LIM = 23;
CAT = { scale: 0.6, bodyLen: 1.2, bodyRad: 0.25, headR: 0.18 };
EPSY = 0.0015; // 1.5 mm w jednostkach świata – niewidoczne, ale usuwa z-fighting
//dla ludzi po pracy
extraSpawned = false; // czy już dorzuciliśmy 50 osób

//do świateł
// globalne światło i współczynniki
U3(uL, 0, 5, 15);
G.uniform3f(uLcolor, 1, 1, 1); // biały
G.uniform1f(uAmbientK, 0.2);
G.uniform1f(uDiffuseK, 0.8);

// tłumienie
G.uniform3f(uAtt, 1.0, 0.14, 0.07);

// VBO/NBO dla wszystkich siatek
bodyV = roundedBody(CAT.bodyLen, CAT.bodyRad, 14, 20);
bodyN = faceN(bodyV);
bodyVB = VB(bodyV);
bodyNB = VB(bodyN);
bodyCnt = bodyV.length / 3;
legV = leg(0.45, 0.05, 12, 18);
legN = faceN(legV);
legVB = VB(legV);
legNB = VB(legN);
legCnt = legV.length / 3;
tailV = roundedBody(0.38, 0.055, 10, 16);
tailN = faceN(tailV);
tailVB = VB(tailV);
tailNB = VB(tailN);
tailCnt = tailV.length / 3;
headV = sphere(0, 0, 0, 0.14, 8, 12);
headN = faceN(headV);
headVB = VB(headV);
headNB = VB(headN);
headCnt = headV.length / 3;
cubeM = cube(0.35);
cubeVB = VB(cubeM.v);
cubeNB = VB(cubeM.n);
cubeCnt = cubeM.count;
pyr = pyramidUnit(CB);
roofVB = VB(pyr.v);
roofNB = VB(pyr.n);
roofCnt = pyr.count;

// uniwersalny walec (wzdłuż osi X) bazowy dla soczewek okularów — skala nada rozmiar
cylV = roundedBody(1.0, 1.0, 12, 24);
cylN = faceN(cylV);
cylVB = VB(cylV);
cylNB = VB(cylN);
cylCnt = cylV.length / 3;

//do zegara
qNZ = new F(qV.length);
for (let i = 2; i < qNZ.length; i += 3) qNZ[i] = 1;
qNZVB = VB(qNZ);

// generator budynków wokół placu, „add” sam wylicza y jako połowę wysokości

//ratusz: wybór budynku z frontu, moxliwie blisko x=0
for (const b of BLD)
  if (
    M.abs(b.z - ZF) < M.abs(TOWN.z - ZF) ||
    (M.abs(b.z - ZF) === M.abs(TOWN.z - ZF) && M.abs(b.x) < M.abs(TOWN.x))
  )
    TOWN = b;

// --- LATARNIE: 4 linie (2 korytarze) po bokach placu ---
// lewy korytarz: 2 krawędzie (xL1, xL2); prawy: (xR1, xR2)
LAMPS = (() => {
  const arr = [],
    xL1 = -PLAZA_SIZE * 0.7,
    xL2 = -PLAZA_SIZE * 0.5,
    xR1 = PLAZA_SIZE * 0.5,
    xR2 = PLAZA_SIZE * 0.7,
    lines = [xL1, xL2, xR1, xR2],
    perLine = 4, // 4 lampy na linię => 16 łącznie
    zMin = -PLAZA_SIZE * 0.8,
    zMax = PLAZA_SIZE * 0.8;
  for (const x of lines) {
    for (let i = 0; i < perLine; i++) {
      const t = perLine === 1 ? 0.5 : i / (perLine - 1);
      const z = zMin * (1 - t) + zMax * t;
      arr.push({ x, z });
    }
  }
  return arr;
})();
{
  const N = M.min(LAMPS.length, MAX_LAMPS),
    pos = new F(MAX_LAMPS * 3),
    dir = new F(MAX_LAMPS * 3),
    col = new F(MAX_LAMPS * 3),
    inr = new F(MAX_LAMPS),
    outr = new F(MAX_LAMPS),
    id = Q((25 * M.PI) / 180),
    od = Q((50 * M.PI) / 180);
  for (let i = 0; i < N; i++) {
    let b = i * 3,
      x = LAMPS[i].x,
      z = LAMPS[i].z;
    pos[b] = x;
    pos[b + 1] = 3;
    pos[b + 2] = z;
    dir[b + 1] = -1;
    col[b] = 1.8;
    col[b + 1] = 1.6;
    col[b + 2] = 1.1;
    inr[i] = id;
    outr[i] = od;
  }
  G.uniform1i(uLampCount, N);
  G.uniform3fv(uLampPos, pos);
  G.uniform3fv(uLampDir, dir);
  G.uniform3fv(uLampColor, col);
  G.uniform1fv(uLampInner, inr);
  G.uniform1fv(uLampOuter, outr);
}

// constants for shadow lighting calc on CPU side
// wspólny kalkulator pozycji i kierunku reflektora kota

// --- Dusk lamp blinking state ---

// laser: dwa małe trójkąty; normalne w górę

// tłum: pozycja, kierunek (norm.), prędkość i stany wołgi
ppl = Array.from({ length: CROWD }, () => ({
  // pozycja
  pos: [RB(-0.9 * LIM, 0.9 * LIM), 0, RB(-0.9 * LIM, 0.9 * LIM)],
  // kierunek
  dir: (() => {
    let x = RB(-1, 1),
      z = RB(-1, 1),
      l = 1 / (H(x, z) || 1);
    return [x * l, z * l];
  })(),
  // prędkość
  spd: RB(0.8, 3.2),
  // stany wołgi
  yellow: 0,
  prevLat: 0,
  abducted: 0,
  abdTimer: 0,
  carX: 0,
  carZ: 0,
  carPhase: 0,
  captured: 0,
  driveOff: 0,
  driveSpeed: 0,
}));

// === UI: HUD and overlays (static DOM from index.html) ===
// Binds avatar eyes/cross, tooltip quotes, and start overlay blink/Play.
// Ensures all overlays use solid black via shared .overlay CSS.
// --- HUD: Cat avatar (bind to static DOM) ---
AVATAR_EYES = D.getElementById("avatarEyes");
AVATAR_CROSS = D.getElementById("avatarCross");

// Tooltip logic bound to existing #avatarTip
(() => {
  const AVATAR_TOOLTIP = D.getElementById("avatarTip"),
    QuoteState = { pendingCategory: null, introRemaining: 3 },
    pickQuote = () => {
      let pool = QUOTES.general;
      if (QuoteState.pendingCategory && QUOTES[QuoteState.pendingCategory]) {
        pool = QUOTES[QuoteState.pendingCategory];
        QuoteState.pendingCategory = null;
      } else if (QuoteState.introRemaining > 0 && QUOTES.intro.length) {
        pool = QUOTES.intro;
        QuoteState.introRemaining--;
      }
      return pool[(Math.random() * pool.length) | 0];
    },
    showRandomQuote = () => {
      const q = pickQuote();
      AVATAR_TOOLTIP.textContent = q;
      AVATAR_TOOLTIP.style.display = "block";
      setTimeout(() => (AVATAR_TOOLTIP.style.display = "none"), 3000);
    },
    startQuotes = () => {
      if (quoteTimer) return;
      showRandomQuote();
      quoteTimer = setInterval(showRandomQuote, 10000);
    };
  if (!AVATAR_TOOLTIP) return;
  D.defaultView.queueQuoteCategory = (cat) => {
    QuoteState.pendingCategory = cat;
  };
  let quoteTimer = null;
  D.defaultView.startAvatarQuotes = startQuotes;
})();

// --- Start overlay (blink + Play binding) ---
// Bind start overlay and blink animation to static DOM
OV = D.getElementById("start");
E = D.getElementById("startEyes");
(() => {
  if (!E) return;
  const blink = () => {
    E.style.transform = "scaleY(.06)";
    setTimeout(() => (E.style.transform = "scaleY(1)"), 110);
    setTimeout(blink, 900 + R() * 2000);
  };
  blink();
})();
D.getElementById("play").onclick = () => {
  playing = 1;
  OV && OV.remove();
  prev = performance.now();
  tStart = prev;
  t0 = Date.now();
  if (typeof startAvatarQuotes === "function") startAvatarQuotes();
};
// torso z siatki leg o innych parametrach + pełna postać
torsoV = leg(0.6, 0.12, 12, 18);
torsoN = faceN(torsoV);
torsoVB = VB(torsoV);
torsoNB = VB(torsoN);
torsoCnt = torsoV.length / 3;

//ludzie po pracy
spawnExtraPeople = (n) => {
  for (let i = 0; i < n; i++) {
    const b = BLD[(Math.random() * BLD.length) | 0], // losowy budynek
      // start na środku budynku przy placu
      x = b.x,
      z = b.z,
      // kierunek = wektor od środka placu do środka budynku
      dx = Math.sign(x) || 0,
      dz = Math.sign(z) || 0;
    ppl.push({
      pos: [x, 0, z],
      dir: [dx, dz],
      spd: RB(0.8, 3.2),
      yellow: 0,
      prevLat: 0,
      abducted: 0,
      abdTimer: 0,
      carX: 0,
      carZ: 0,
      carPhase: 0,
      captured: 0,
      driveOff: 0,
      driveSpeed: 0,
    });
  }
};

// główna pętla: update - render, dt maks 33ms
loop = (t) => {
  requestAnimationFrame(loop);
  W = C.width;
  Hpx = C.height;
  const dt = M.min((t - prev) / 1e3, 0.033);
  prev = t;

  //pauza + aktualizacja timera
  if (!playing) return;
  upTime((Date.now() - t0) / 1000);
  const gt = t - tStart; // czas gry od kliknięcia Play

  //dzień -> zmierzch -> noc -> dzień
  //przez 6 obrotów jest jasno, od 6 do 9 obrotu ściemnia się, od 9 do 12 obrotu jest ciemno, od 12 do 15 obrotu rozjasnia się, od 15 do 21 obrotu jest jasno itd
  const turns = gt / 6000,
    p = turns % 21,
    k =
      p < 6
        ? 0
        : p < 9
          ? (p - 6) / 3
          : p < 12
            ? 1
            : p < 15
              ? 1 - (p - 12) / 3
              : 0,
    sceneDim = 1 - 0.95 * k;

  //dla ludzi po pracy
  if (!extraSpawned && Math.floor(gt / 6000) >= 3) {
    //po trzech obrotch zegara (1 obrót zegara to 6sekund)
    spawnExtraPeople(100);
    extraSpawned = true;
  }

  // kamera: follow (lookAt) + projekcja
  const tgt = [cat[0], cat[1] + 0.6, cat[2]],
    eye = [tgt[0] + cam[0], tgt[1] + cam[1], tgt[2] + cam[2]],
    V = X.v(eye, tgt, [0, 1, 0]),
    fov = (60 * M.PI) / 180,
    asp = W / Hpx,
    P = X.p(fov, asp, 0.1, 200);

  // promień spod kursora → świat, przecinamy z Y=0
  const nx = (mx / W) * 2 - 1,
    ny = -((my / Hpx) * 2 - 1),
    tf = M.tan(fov / 2),
    dx = nx * tf * asp,
    dy = ny * tf,
    dz = 1;
  const f = X.nm(X.sub(tgt, eye)),
    r = X.nm(X.cr(f, [0, 1, 0])),
    up = X.cr(r, f);
  let dir = X.nm([
    r[0] * dx + up[0] * dy + f[0] * dz,
    r[1] * dx + up[1] * dy + f[1] * dz,
    r[2] * dx + up[2] * dy + f[2] * dz,
  ]);
  let tHit = (0 - eye[1]) / dir[1],
    hx = isFinite(tHit) && tHit > 0 ? eye[0] + dir[0] * tHit : aim[0],
    hz = isFinite(tHit) && tHit > 0 ? eye[2] + dir[2] * tHit : aim[1];

  // cel ograniczony do placu + wygładzanie eksponencjalne
  hx = M.max(-LIM, M.min(LIM, hx));
  hz = M.max(-LIM, M.min(LIM, hz));
  const a = 1 - M.exp(-20 * dt);
  aim[0] += (hx - aim[0]) * a;
  aim[1] += (hz - aim[1]) * a;

  // steering arrival (MAX prędkości, ARR promień miękkiego hamowania)
  const dxC = aim[0] - cat[0],
    dzC = aim[1] - cat[2],
    dist = H(dxC, dzC) || 1,
    MAX = 10,
    ARR = 3,
    want = dist < ARR ? MAX * (dist / ARR) : MAX,
    dirX = dxC / dist,
    dirZ = dzC / dist;
  const vA = 1 - M.exp(-6 * dt);
  vel[0] += (dirX * want - vel[0]) * vA;
  vel[2] += (dirZ * want - vel[2]) * vA;
  cat[0] += vel[0] * dt;
  cat[2] += vel[2] * dt;

  // granice placu z tłumieniem odbicia
  if (cat[0] > LIM) {
    cat[0] = LIM;
    vel[0] *= -0.7;
  }
  if (cat[0] < -LIM) {
    cat[0] = -LIM;
    vel[0] *= -0.7;
  }
  if (cat[2] > LIM) {
    cat[2] = LIM;
    vel[2] *= -0.7;
  }
  if (cat[2] < -LIM) {
    cat[2] = -LIM;
    vel[2] *= -0.7;
  }

  // rotacja kota do kierunku ruchu (interpolacja kąta)
  const wy = M.atan2(dirZ, dirX),
    dYaw = M.atan2(S(wy - yaw), Q(wy - yaw));
  yaw += dYaw * (1 - M.exp(-12 * dt));

  // kamera podąża (offset za kotem, wygładzanie)
  const desX = Q(yaw) * 4,
    desZ = S(yaw) * 4 + 10;
  cam[0] += (desX - cam[0]) * (1 - M.exp(-2 * dt));
  cam[2] += (desZ - cam[2]) * (1 - M.exp(-2 * dt));

  // begin frame
  G.viewport(0, 0, W, Hpx);
  // lerp nieba: dzień (.7,.8,.95) -> noc (.02,.03,.08)
  const skyR = 0.7 * (1 - k) + 0.02 * k,
    skyG = 0.8 * (1 - k) + 0.03 * k,
    skyB = 0.95 * (1 - k) + 0.08 * k;
  G.clearColor(skyR, skyG, skyB, 1);
  G.clear(G.COLOR_BUFFER_BIT | G.DEPTH_BUFFER_BIT);
  G.useProgram(PGM);
  U3(uL, 0, 5, 15); // bez zmian
  G.uniform1f(uScene, sceneDim);

  // Lamps dusk blinking: 3 blinks at dusk, then stable ON (scaled by night factor)
  {
    const nightF = M.max(0, M.min(1, k));
    // trigger blink when entering dusk
    if (!lampStable && !lampBlinking && prevNightF < 0.05 && nightF >= 0.05) {
      lampBlinking = 1;
      lampBlinkStart = t;
    }
    // reset at morning
    if (prevNightF > 0.05 && nightF < 0.02) {
      lampStable = 0;
      lampBlinking = 0;
    }

    let lampK = 0.0;
    if (lampBlinking) {
      const elapsed = t - lampBlinkStart,
        totalBlink = LAMP_BLINK_SEQ.reduce((s, c) => s + c.on + c.off, 0);
      if (elapsed >= totalBlink) {
        lampBlinking = 0;
        lampStable = 1;
        lampK = nightF;
      } else {
        let acc = 0,
          blinkOn = 0;
        for (let i = 0; i < LAMP_BLINK_SEQ.length; i++) {
          const seg = LAMP_BLINK_SEQ[i];
          if (elapsed < acc + seg.on) {
            blinkOn = 1;
            break;
          }
          acc += seg.on;
          if (elapsed < acc + seg.off) {
            blinkOn = 0;
            break;
          }
          acc += seg.off;
        }
        lampK = blinkOn ? nightF : 0.0;
      }
    } else if (lampStable) {
      lampK = nightF;
    } else {
      lampK = 0.0;
    }
    G.uniform1f(uLampK, lampK);
    lampK_current = lampK;
    prevNightF = nightF;
  }

  // U3(uL, 0, 5*sceneDim, 15*sceneDim);
  G.uniformMatrix4fv(uP, false, P);
  G.uniformMatrix4fv(uV, false, V);

  // --- PODŁOGA: najpierw trawa (duża), potem plac (mniejszy) ---
  // Trawa: lekko poniżej 0
  // ziemia + plac (stała normalna (0,1,0))
  BA(grassVB, aP, 3);
  G.disableVertexAttribArray(aN);
  G.vertexAttrib3f(aN, 0, 1, 0);
  UM(X.T(0, -EPSY, 0));
  U3(uC, 0.16, 0.46, 0.16);
  G.polygonOffset(1, 1);
  G.drawArrays(G.TRIANGLES, 0, 6);
  BA(plazaVB, aP, 3);
  UM(X.I());
  U3(uC, 0.5, 0.5, 0.5);
  G.polygonOffset(1, 2);
  G.drawArrays(G.TRIANGLES, 0, 6);
  G.polygonOffset(0, 0);
  G.enableVertexAttribArray(aN);

  // fazy animacji: chód - prędkość, ogon stały
  const sp = H(vel[0], vel[2]),
    gait = 8;
  walk += gait * M.max(sp / (MAX * 0.7), 2) * dt;
  tail += 4 * dt;
  // oczy: miganie co 1.5-4s z krótkim zamknięciem
  if (blinkState === 0) {
    nextBlink -= dt;
    if (nextBlink <= 0) {
      blinkState = 1;
      blinkT = 0;
    }
  }
  if (blinkState === 1) {
    blinkT += dt;
    const phase = blinkT;
    if (phase < 0.1)
      eyeBlink = 1 - phase / 0.1; // closing
    else if (phase < 0.2)
      eyeBlink = (phase - 0.1) / 0.1; // opening
    else {
      eyeBlink = 1;
      blinkState = 0;
      nextBlink = 1.5 + R() * 2.5;
    }
  }
  // update HUD avatar blink and hit state
  updateAvatarHUD();

  // current red-blink state when cat is hit (used to gate headlight)
  const redBlinkingNow = catHit && ((catHitT * 10) | 0) % 2 === 0;

  // queue a contextual tooltip after the cat is hit (nine-lives theme)
  if (!prevCatHit && catHit) {
    if (typeof queueQuoteCategory === "function")
      queueQuoteCategory("nineLives");
  }
  prevCatHit = catHit;

  // --- Cat headlight uniforms (illumination) ---
  {
    const { pos: hp, dir: hd } = computeHeadlight(),
    // Night factor from day-night cycle (0=day, 1=night)
    nightF = Math.max(0, Math.min(1, k));
    // Blink + night gating: on only when eyes mostly open, it's dusk/night, and NOT red-blinking on hit
    G.uniform1f(
      uHeadOn,
      eyeBlink > 0.5 && nightF > 0.01 && !redBlinkingNow ? 1.0 : 0.0
    );
    G.uniform3f(uHeadPos, hp[0], hp[1], hp[2]);
    G.uniform3f(uHeadDir, hd[0], hd[1], hd[2]);
    // slightly warm white
    G.uniform3f(uHeadColor, 2.0 * nightF, 2.0 * nightF, 1.6 * nightF);
    G.uniform1f(uHeadInner, HEAD_IDOT);
    G.uniform1f(uHeadOuter, HEAD_ODOT);
  }

  // podłoga (siatka) - troche ponad placem
  U3(uC, 0.35, 0.4, 0.5);
  UM(X.T(0, EPSY, 0));
  BA(gridVB, aP, 3);
  BA(upVB, aN, 3);
  G.drawArrays(LNS, 0, GRID.length / 3);

  // budynki: pilnować BA dla kostki w każdej iteracji (brak VAO)
  for (const b of BLD) {
    //kostka budynku
    BA(cubeVB, aP, 3);
    BA(cubeNB, aN, 3);
    const Mbox = X.m(X.T(b.x, b.y, b.z), X.S(b.sx, b.sy, b.sz));
    U3(uC, b.color[0], b.color[1], b.color[2]);
    UM(Mbox);
    G.drawArrays(G.TRIANGLES, 0, cubeCnt);

    // dach (piramida) na stropie, wysokość zależna od min(sx,sz)
    BA(roofVB, aP, 3);
    BA(roofNB, aN, 3);
    const rH = 0.6 * M.min(b.sx, b.sz),
      yTop = b.y + b.sy * CB * 0.5,
      Mroof = X.m(X.T(b.x, yTop, b.z), X.S(b.sx, rH, b.sz));
    U3(uC, 1, 0.5, 0.31);
    UM(Mroof);
    G.drawArrays(G.TRIANGLES, 0, roofCnt);

    // okna: siatka pięter/kolumn na wybranej fasadzie (front/tył/lewa/prawa)
    const sizeX = b.sx * CB,
      sizeY = b.sy * CB,
      sizeZ = b.sz * CB,
      eps = 0.003;
    const alongX = M.abs(b.x) <= M.abs(b.z);

    // wybór ściany i rotY okna
    let wall, rotY;
    if (alongX) {
      const plusZ = b.z < 0;
      wall = b.z + (plusZ ? sizeZ / 2 + eps : -sizeZ / 2 - eps);
      rotY = plusZ ? 0 : M.PI;
    } else {
      const plusX = b.x < 0;
      wall = b.x + (plusX ? sizeX / 2 + eps : -sizeX / 2 - eps);
      rotY = plusX ? -M.PI / 2 : M.PI / 2;
    }

    // pętle po piętrach i kolumnach (środki komórek) - bez budynku ktory ma zegar
    if (b !== TOWN) {
      const floorsT = M.min(5, M.max(2, (b.sy * 0.45) | 0)),
        skip = M.min(2, floorsT > 2 ? 2 : 0),
        floors = M.max(1, floorsT - skip),
        colsX = M.min(3, M.max(2, (b.sx * 0.25) | 0)),
        colsZ = M.min(3, M.max(2, (b.sz * 0.25) | 0)),
        stepH = (alongX ? sizeX : sizeZ) / (alongX ? colsX : colsZ),
        winW = stepH * 0.92,
        winH = (sizeY / floorsT) * 1.5;

      for (let r = 0; r < floors; r++) {
        const y = b.y - sizeY / 2 + (skip + r + 0.5) * (sizeY / floorsT);
        for (let c = 0; c < (alongX ? colsX : colsZ); c++) {
          const along =
            (alongX ? b.x - sizeX / 2 : b.z - sizeZ / 2) + (c + 0.5) * stepH;
          if (alongX) drawWindow(along, y, wall, rotY, winW, winH);
          else drawWindow(wall, y, along, rotY, winW, winH);
        }
      }
    }

    // --- DRZWI: jeden prostokąt na „tej” fasadzie, przy ziemi ---
    {
      const doorW = 4, // szerokość
        doorH = 9, // wysokość
        yDoor = 0; // tuż nad ziemią

      // środek drzwi na środku fasady, z minimalnym odsunięciem od ściany
      let cx = b.x,
        cz = b.z,
        off = 0.0015;
      if (alongX) {
        cz = wall + (rotY === 0 ? off : -off);
        cx = b.x; // środek po X
      } else {
        cx = wall + (rotY === -Math.PI / 2 ? off : -off);
        cz = b.z; // środek po Z
      }
      drawDoor(cx, yDoor, cz, rotY, doorW, doorH);
    }

    // zegar na ratuszu: tarcza + 4 kreski + wskazówka (pełny obrót = 6s)
    if (b === TOWN) {
      const s = sizeY * 1.5, // skala zegara względem wysokości budynku
        cy = b.y + sizeY * 0.15, // środek tarczy (Y)
        ry = rotY, // obrót ściany
        th = s * 0.03,
        ln = s * 0.2, // grubość i długość kresek / wskazówki
        off = s * 0.08, // odsunięcie kresek od środka
        ang = (-gt * M.PI) / 3000, // prędkość wskazówki
        eps2 = 0.01;
      let cx = b.x,
        cz = wall; // środek tarczy na ścianie
      if (alongX) cz += ry === 0 ? eps2 : -eps2;
      else cx += ry === -M.PI / 2 ? eps2 : -eps2; // lekkie odsunięcie od ściany

      // warstwy lokalnego Z + parametry krążka
      const zB = -0.003,
        zD = 0,
        zM = 0.0015,
        zH = 0.003,
        tD = 0.002,
        k = s * 0.7142857;

      // okrągła obwódka + tarcza: siatka head, płaska normalna (0,0,1)
      BA(headVB, aP, 3);
      G.disableVertexAttribArray(aN);
      G.vertexAttrib3f(aN, 0, 0, 1);

      // obwódka (ciemna) - trochę większa i "za" tarczą
      U3(uC, 0.08, 0.08, 0.1);
      UM(
        X.m(
          X.T(cx, cy, cz),
          X.m(X.Ry(ry), X.m(X.T(0, 0, zB), X.S(k * 1.08, k * 1.08, tD)))
        )
      );
      G.drawArrays(G.TRIANGLES, 0, headCnt);

      // tarcza (biała) - w warstwie 0
      U3(uC, 1, 1, 1);
      UM(
        X.m(X.T(cx, cy, cz), X.m(X.Ry(ry), X.m(X.T(0, 0, zD), X.S(k, k, tD))))
      );
      G.drawArrays(G.TRIANGLES, 0, headCnt);

      // markery i wskazówka: quady minimalnie przed tarczą
      BA(qVB, aP, 3);
      BA(qNZVB, aN, 3);

      U3(uC, 0.2, 0.2, 0.2);
      const markers = [
        { dx: 0, dy: +off, sx: th, sy: ln },
        { dx: 0, dy: -off, sx: th, sy: ln },
        { dx: +off, dy: 0, sx: ln, sy: th },
        { dx: -off, dy: 0, sx: ln, sy: th },
      ];
      for (const m of markers) {
        UM(
          X.m(
            X.T(cx + m.dx, cy + m.dy, cz),
            X.m(X.Ry(ry), X.m(X.T(0, 0, zM), X.S(m.sx, m.sy, 1)))
          )
        );
        G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
      }

      U3(uC, 0.9, 0.2, 0.2);
      const hh = s * 0.3;
      UM(
        X.m(
          X.T(cx, cy, cz),
          X.m(
            X.Ry(ry),
            X.m(X.Rz(ang), X.m(X.T(0, hh * 0.15, zH), X.S(th * 0.8, hh, 1)))
          )
        )
      );
      G.drawArrays(G.TRIANGLE_STRIP, 0, 4);
    }
  }

  // --- LASER: czerwone kółko na ziemi (spłaszczona sfera) ---
  BA(headVB, aP, 3);
  G.disableVertexAttribArray(aN); // stała normalna w górę
  G.vertexAttrib3f(aN, 0, 1, 0);

  U3(uC, 1, 0.2, 0.2);
  UM(
    X.m(
      X.T(aim[0], EPSY * 3, aim[1]), // lekko nad ziemią, żeby nie migało
      X.S(0.6, 0.2, 0.6) // promień i grubość kółka
    )
  );
  G.drawArrays(G.TRIANGLES, 0, headCnt);

  G.enableVertexAttribArray(aN);

  // tłum: wołga (jeśli aktywna) + cienie, potem postać
  for (const p of ppl) {
    const yawP = M.atan2(p.dir[1], p.dir[0]),
    // compute key light for this person
    kl = keyLightAt(p.pos[0], p.pos[2]),
    alphaP = M.min(0.6, 2.0 * kl.strength);
    // draw car shadow first if present
    if (p.abducted) {
      beginShadow(kl.dir, alphaP);
      drawVolga(p.carX, p.carZ, 0.62);
      endShadow();
      // then actual car
      drawVolga(p.carX, p.carZ, 0.62);
    }
    // draw human shadow
    if (!p.captured) {
      const B = X.m(X.T(p.pos[0], 0, p.pos[2]), X.Ry(yawP));
      beginShadow(kl.dir, alphaP);
      drawHumanFull(B, p.yellow, p);
      endShadow();

      // Extra shadow from cat headlight if person lies within the headlight cone
      // Disabled while cat is red-blinking (hit state)
      if (eyeBlink > 0.5 && !redBlinkingNow) {
        const nightF = M.max(0, M.min(1, k));
        if (nightF > 0.01) {
          const gx = p.pos[0],
            gy = 0,
            gz = p.pos[2],
            { pos: hp, dir: hd } = computeHeadlight(),
            hx = hp[0],
            hy = hp[1],
            hz = hp[2],
            ax = hd[0],
            ay = hd[1],
            az = hd[2],
            dx = gx - hx,
            dy = gy - hy,
            dz = gz - hz,
            r = H(dx, dy, dz) || 1,
            lpx = dx / r,
            lpy = dy / r,
            lpz = dz / r, // light->point dir
            dDot = ax * lpx + ay * lpy + az * lpz,
            spot = smoothstep(HEAD_ODOT, HEAD_IDOT, dDot);
          if (spot > 0.001) {
            const lambert = M.max(-lpy, 0),
              atten = 1.0 / (ATT0 + ATT1 * r + ATT2 * r * r),
              b = lambert * atten * spot,
              alphaH = M.min(0.6, 2.0 * b * nightF);
            if (alphaH > 0.01) {
              // Use light->point direction; VS uses signed Y to cast away from light
              beginShadow([lpx, lpy, lpz], alphaH);
              drawHumanFull(B, p.yellow, p);
              endShadow();
            }
          }
        }
      }
    }
    if (!p.captured) {
      const B = X.m(X.T(p.pos[0], 0, p.pos[2]), X.Ry(yawP));
      drawHumanFull(B, p.yellow, p);
    }
  }

  // transform kota + animacja hit (podskok i blink)
  const cy = Q(yaw),
    sy = S(yaw),
    Mc = new F([
      cy,
      0,
      sy,
      0,
      0,
      1,
      0,
      0,
      -sy,
      0,
      cy,
      0,
      cat[0],
      0.25,
      cat[2],
      1,
    ]);
  let yOff = 0,
    blink = 1;
  if (catHit) {
    catHitT -= dt;
    if (catHitT <= 0) catHit = 0;
    else {
      yOff = S(M.min(1, 1 - catHitT / 1.2) * M.PI) * 1.0;
      blink = ((catHitT * 10) | 0) % 2 === 0;
    }
  }
  Mc[13] += yOff;
  // cat shadow based on key light
  {
    const klc = keyLightAt(cat[0], cat[2]);
    const alphaC = M.min(0.6, 2.0 * klc.strength);
    beginShadow(klc.dir, alphaC);
    drawCat(Mc, sp, catHit && !blink);
    endShadow();
  }
  // actual cat
  drawCat(Mc, sp, catHit && !blink);

  // update tłumu: dryf, granice, wykrycie „front-cross”, wołga podjazd/odjazd
  const kill = [];
  for (let i = 0; i < ppl.length; i++) {
    const p = ppl[i];
    if (!p.abducted) {
      const t = (R() - 0.5) * 0.6 * dt,
        c = Q(t),
        w = S(t),
        dx = p.dir[0] * c - p.dir[1] * w,
        dz = p.dir[0] * w + p.dir[1] * c;
      p.dir[0] = dx;
      p.dir[1] = dz;
      p.pos[0] += dx * p.spd * dt;
      p.pos[2] += dz * p.spd * dt;
      if (p.pos[0] > LIM || p.pos[0] < -LIM) {
        p.pos[0] = M.max(-LIM, M.min(LIM, p.pos[0]));
        p.dir[0] *= -1;
      }
      if (p.pos[2] > LIM || p.pos[2] < -LIM) {
        p.pos[2] = M.max(-LIM, M.min(LIM, p.pos[2]));
        p.dir[1] *= -1;
      }
      if (R() < 0.01) p.spd = RB(0.8, 3.2);
      const fx = p.dir[0],
        fz = p.dir[1],
        lx = -fz,
        lz = fx,
        rx = cat[0] - p.pos[0],
        rz = cat[2] - p.pos[2],
        s = rx * fx + rz * fz,
        lat = rx * lx + rz * lz;
      if (
        !p.yellow &&
        s > 0 &&
        s < 2 &&
        M.abs(lat) < 0.45 &&
        p.prevLat * lat < 0
      ) {
        p.yellow = 1;
        p.abducted = 1;
        p.abdTimer = 3;
        p.carPhase = 0;
        p.carX = p.pos[0] - 6;
        p.carZ = p.pos[2];
      }
      p.prevLat = lat;
    } else {
      p.abdTimer -= dt;
      if (p.carPhase === 0) {
        const tx = p.pos[0] - 1,
          dx = tx - p.carX;
        p.carX += dx * M.min(1, 2 * dt);
        if (M.abs(dx) < 0.05) p.carPhase = 1;
      } else {
        const goal = p.carX + 0.45,
          step = 2.5 * dt;
        if (p.pos[0] > goal) p.pos[0] = M.max(goal, p.pos[0] - step);
        if (p.pos[0] <= goal) {
          if (!p.captured) {
            p.captured = 1;
            unlucky++;
            updateStats();
          }
          p.driveOff = 1;
          p.driveSpeed = 12;
        }
      }
      if (p.driveOff) {
        p.carX += p.driveSpeed * dt;
        if (p.carX > LIM + 2) kill.push(i);
      }
    }
  }
  // sprzątanie usuniętych od końca (indeksy się nie rozsypują)
  for (let k = kill.length - 1; k >= 0; k--) ppl.splice(kill[k], 1);

  // kolizja kota z tłumem (promień ~0.6) → hit i -1 życie
  if (!catHit) {
    for (const p of ppl) {
      if (p.abducted) continue; // człowiek już w aucie
      const dx = cat[0] - p.pos[0],
        dz = cat[2] - p.pos[2],
        d = H(dx, dz);
      if (d < 0.6) {
        catHit = 1;
        catHitT = 0.8;
        catLives--;
        updateHearts();
        break;
      }
    }
  }

  //koniec gry — show solid black game-over overlay using shared .overlay CSS
  if (playing && catLives <= 0) {
    playing = 0;
    D.body.insertAdjacentHTML(
      "beforeend",
      '<div id="gameover" class="overlay" style="font-size:64px;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
        '<div style="font-size:128px;margin-bottom:8px">Game<br>Over</div>' +
        '<div style="margin-bottom:6px">☠ ' +
        unlucky +
        "</div>" +
        '<div style="margin-bottom:8px">⏱ ' +
        ((Date.now() - t0) / 1000).toFixed(1) +
        "s</div>" +
        '<button id="play" class="btn">Play Again</button>' +
        "</div>"
    );
    D.getElementById("play").onclick = () => location.reload();
  }

  //latarnie
  for (const l of LAMPS) {
    drawLamp(l.x, l.z);
  }
};
requestAnimationFrame(loop);
