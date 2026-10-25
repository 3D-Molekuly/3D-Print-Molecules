/**
 * jointGeometry.ts — print-in-place rotační kloub pro jednoduché vazby
 * (styl "Ball-and-Stick MOVING JOINTS").
 *
 * Kloub = dvě samostatná tělesa (shell), která se NESMÍ booleovsky spojit:
 *   STATOR – patří k atomu A, válec s dutinou tvaru dvojkužele,
 *   ROTOR  – patří k atomu B, kužel + krátký hřídel + hlava (dvojkužel) uvnitř dutiny.
 * Všechna rozhraní rotor/stator jsou kužele 45° (žádné vodorovné plochy),
 * takže kloub je samonosný při ose svisle (oba směry) i vodorovně.
 *
 * Geometrie vzniká rotací 2D profilu (LatheGeometry) – nepotřebuje CSG.
 * Lokální rámec kloubu: osa = +Y (stejně jako CylinderGeometry), y = 0 … length,
 * stator dole (strana A), rotor nahoře (strana B).
 *
 * Všechny parametry JointParams jsou v MILIMETRECH výsledného tisku.
 */
import * as THREE from 'three';

export interface JointParams {
	R: number; // vnější poloměr kloubu
	rs: number; // poloměr hřídele
	rh: number; // poloměr hlavy (rovník dvojkužele)
	c: number; // vůle (kolmá vzdálenost ploch)
	neck: number; // axiální délka hřídele skrz krk statoru
	wall: number; // minimální tloušťka stěny statoru
	topLen: number; // plný válec rotoru nad kuželem
	radialSegments: number; // jemnost po obvodu
	arcSegments: number; // jemnost zaoblení vůle na hranách
}

export const JOINT_PRESETS: Record<'fdm' | 'sla', JointParams> = {
	fdm: { R: 4.0, rs: 1.4, rh: 2.5, c: 0.3, neck: 1.6, wall: 1.2, topLen: 1.0, radialSegments: 64, arcSegments: 6 },
	sla: { R: 3.0, rs: 1.0, rh: 1.9, c: 0.2, neck: 1.2, wall: 0.8, topLen: 0.8, radialSegments: 64, arcSegments: 6 }
};

const SQ2 = Math.SQRT2;

/** Kontrola vyrobitelnosti; vrací seznam varování (prázdný = OK). */
export function checkJointParams(p: JointParams): string[] {
	const w: string[] = [];
	if (p.R - p.rh - p.c < p.wall - 1e-9)
		w.push(`Stěna statoru u rovníku ${(p.R - p.rh - p.c).toFixed(2)} mm < wall ${p.wall} mm`);
	if (p.rh - p.rs - p.c < 0.4)
		w.push(`Přesah hlavy jen ${(p.rh - p.rs - p.c).toFixed(2)} mm – rotor může vypadnout`);
	if (p.neck - (2 * SQ2 - 2) * p.c < 0.8) w.push('Krk statoru je příliš tenký (zvětšit neck)');
	if (p.rs < 0.8) w.push('Hřídel je velmi tenká, hrozí ulomení');
	return w;
}

/**
 * Přizpůsobí kloub tloušťce tyčinky (vše v mm). Je-li tyčinka silnější než R,
 * kloub se zvětší (R, rs, rh, neck, topLen úměrně), ale vůle c a stěna wall
 * zůstávají – vůle je dána tiskárnou, ne velikostí modelu.
 */
export function paramsForRod(rodRadiusMm: number, base: JointParams): JointParams {
	if (rodRadiusMm <= base.R) return { ...base };
	const k = rodRadiusMm / base.R;
	return { ...base, R: base.R * k, rs: base.rs * k, rh: base.rh * k, neck: base.neck * k, topLen: base.topLen * k };
}

export function jointLevels(p: JointParams) {
	const zHa = p.wall + p.c; // dolní vrchol hlavy
	const zHe = zHa + p.rh; // rovník hlavy
	const zHt = zHe + (p.rh - p.rs); // napojení hřídele na hlavu
	const z1 = zHt + p.neck; // špička kužele rotoru
	const zS = z1 + (p.R - p.rs); // dělení na vnějším plášti
	const zTop = zS + p.topLen;
	return { zHa, zHe, zHt, z1, zS, zTop, length: zTop };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): THREE.Vector2[] {
	const out: THREE.Vector2[] = [];
	for (let i = 0; i <= n; i++) {
		const a = a0 + ((a1 - a0) * i) / n;
		out.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
	}
	return out;
}

function dedupe(pts: THREE.Vector2[]): THREE.Vector2[] {
	return pts.filter((q, i) => i === 0 || q.distanceTo(pts[i - 1]) > 1e-7);
}

/** 2D profily (x = poloměr, y = výška) od osy k ose, pro LatheGeometry. */
export function jointProfiles(p: JointParams) {
	const L = jointLevels(p);
	const { c } = p;
	const rotor = [
		new THREE.Vector2(0, L.zHa),
		new THREE.Vector2(p.rh, L.zHe),
		new THREE.Vector2(p.rs, L.zHt),
		new THREE.Vector2(p.rs, L.z1),
		new THREE.Vector2(p.R, L.zS),
		new THREE.Vector2(p.R, L.zTop),
		new THREE.Vector2(0, L.zTop)
	];
	// Stator = válec minus (rotor zvětšený o vůli c, zaoblené vypouklé hrany).
	const rb = p.rs + c; // poloměr otvoru v krku
	const stator = dedupe([
		new THREE.Vector2(0, 0),
		new THREE.Vector2(p.R, 0),
		new THREE.Vector2(p.R, L.zS - c * SQ2), // vnější hrana dělicího kužele
		new THREE.Vector2(rb, L.z1 + c - c * SQ2), // konkávní roh kužel/hřídel
		new THREE.Vector2(rb, p.rh + L.zHe + c * SQ2 - rb), // konkávní roh hřídel/hlava
		...arc(p.rh, L.zHe, c, Math.PI / 4, -Math.PI / 4, p.arcSegments), // rovník hlavy
		...arc(0, L.zHa, c, -Math.PI / 4, -Math.PI / 2, p.arcSegments) // spodní vrchol
	]);
	return { rotor, stator, length: L.zTop };
}

/** Geometrie statoru a rotoru v lokálním rámci (osa +Y, y = 0 … length), v mm. */
export function createJointGeometries(p: JointParams) {
	const prof = jointProfiles(p);
	const stator = new THREE.LatheGeometry(prof.stator, p.radialSegments);
	const rotor = new THREE.LatheGeometry(prof.rotor, p.radialSegments);
	return { stator, rotor, length: prof.length };
}

type Poly = THREE.Vector2[];

function pointInPoly(q: THREE.Vector2, poly: Poly): boolean {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const a = poly[i], b = poly[j];
		if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
	}
	return inside;
}

/** 2D vzdálenost bodu od polygonu (0 uvnitř). Profily z jointProfiles začínají
 *  i končí na ose, takže se jako polygon uzavírají po ose rotace. */
export function distToPoly(q: THREE.Vector2, poly: Poly): number {
	if (pointInPoly(q, poly)) return 0;
	let best = Infinity;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const a = poly[j], b = poly[i];
		const ab = b.clone().sub(a);
		const t = THREE.MathUtils.clamp(q.clone().sub(a).dot(ab) / Math.max(ab.lengthSq(), 1e-18), 0, 1);
		best = Math.min(best, a.clone().addScaledVector(ab, t).distanceTo(q));
	}
	return best;
}

/**
 * Najde polohu kloubu na vazbě délky d (vše ve scénových jednotkách).
 * Přesná podmínka: koule A nesmí zasáhnout do rotoru+vůle, koule B do statoru+vůle
 * (do "své" části kloubu zasahovat smí – splyne s ní).
 * Vrací s0 = vzdálenost začátku kloubu (y = 0) od středu A, nebo null.
 */
export function planJoint(
	d: number,
	rA: number,
	rB: number,
	prof: { rotor: Poly; stator: Poly; length: number },
	c: number,
	preferT = 0.5
): number | null {
	const okA = (s0: number) => distToPoly(new THREE.Vector2(0, -s0), prof.rotor) >= rA + c;
	const okB = (s0: number) => distToPoly(new THREE.Vector2(0, d - s0), prof.stator) >= rB + c;
	const bisect = (ok: (x: number) => boolean, good: number, bad: number) => {
		for (let i = 0; i < 60; i++) {
			const m = (good + bad) / 2;
			if (ok(m)) good = m; else bad = m;
		}
		return good;
	};
	// okA roste se s0, okB klesá se s0
	if (!okA(d) || !okB(0)) return null;
	const lo = okA(0) ? 0 : bisect(okA, d, 0);
	const hi = okB(d) ? d : bisect(okB, 0, d);
	if (hi < lo) return null;
	const wanted = preferT * d - prof.length / 2;
	return Math.min(hi, Math.max(lo, wanted));
}

function scaleParams(p: JointParams, f: number): JointParams {
	return { ...p, R: p.R * f, rs: p.rs * f, rh: p.rh * f, c: p.c * f, neck: p.neck * f, wall: p.wall * f, topLen: p.topLen * f };
}

export interface MovingBondOptions {
	rodRadius: number; // poloměr tyčinky ve scénových jednotkách
	rA: number; // poloměr koule atomu A (scénové jednotky, jak se renderuje)
	rB: number;
	mmPerUnit: number; // kolik mm bude 1 scénová jednotka po exportu
	params: JointParams; // v mm
	rodRadialSegments?: number;
	preferT?: number;
}

export interface MovingBond {
	/** Geometrie patřící k atomu A (tyčinka A + stator) – ve světových souřadnicích. */
	sideA: THREE.BufferGeometry[];
	/** Geometrie patřící k atomu B (rotor + tyčinka B). */
	sideB: THREE.BufferGeometry[];
	/** Lokální rámec kloubu + profily (scénové jednotky) pro kontrolu kolizí. */
	frame: {
		start: THREE.Vector3; // začátek kloubu na ose (y = 0)
		dir: THREE.Vector3; // jednotkový směr A -> B (= lokální +Y)
		length: number;
		c: number;
		R: number;
		rotorProfile: THREE.Vector2[];
		statorProfile: THREE.Vector2[];
	};
	params: JointParams; // skutečně použité parametry v mm
}

/** Celá jednoduchá vazba A–B s kloubem, nebo null (kloub se nevejde -> použij pevnou vazbu). */
export function buildMovingBond(A: THREE.Vector3, B: THREE.Vector3, o: MovingBondOptions): MovingBond | null {
	const pMm = paramsForRod(o.rodRadius * o.mmPerUnit, o.params);
	const p = scaleParams(pMm, 1 / o.mmPerUnit);
	const dirV = new THREE.Vector3().subVectors(B, A);
	const d = dirV.length();
	dirV.divideScalar(d);
	const prof = jointProfiles(p);
	const s0 = planJoint(d, o.rA, o.rB, prof, p.c, o.preferT ?? 0.5);
	if (s0 === null) return null;
	const { stator, rotor, length } = createJointGeometries(p);
	const eps = Math.min(0.05 / o.mmPerUnit, p.wall / 4); // malý přesah tyčinky do kloubu
	const seg = o.rodRadialSegments ?? 32;
	const sideA: THREE.BufferGeometry[] = [stator];
	const sideB: THREE.BufferGeometry[] = [rotor];
	if (s0 > eps) {
		const rodA = new THREE.CylinderGeometry(o.rodRadius, o.rodRadius, s0 + eps, seg);
		rodA.translate(0, (s0 + eps) / 2 - s0, 0); // y = -s0 … +eps
		sideA.unshift(rodA);
	}
	const lenB = d - s0 - length + eps;
	if (lenB > 2 * eps) {
		const rodB = new THREE.CylinderGeometry(o.rodRadius, o.rodRadius, lenB, seg);
		rodB.translate(0, length - eps + lenB / 2, 0); // y = length-eps … d-s0
		sideB.push(rodB);
	}

	const start = A.clone().addScaledVector(dirV, s0);
	const m = new THREE.Matrix4().compose(
		start,
		new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirV),
		new THREE.Vector3(1, 1, 1)
	);
	for (const g of [...sideA, ...sideB]) g.applyMatrix4(m);
	return {
		sideA,
		sideB,
		frame: { start, dir: dirV.clone(), length, c: p.c, R: p.R, rotorProfile: prof.rotor, statorProfile: prof.stator },
		params: pMm
	};
}

// ---------- kontrola kolizí s ostatními atomy / vazbami ----------

export interface CollisionAtom { index: number; pos: THREE.Vector3; radius: number }
export interface CollisionBond { a: number; b: number; radius: number }

/**
 * true = kloub nekoliduje se zbytkem molekuly.
 *  - atomy/vazby vázané k A (kromě vazby A–B) nesmí do ROTORU + vůle,
 *  - atomy/vazby vázané k B nesmí do STATORU + vůle,
 *  - vše ostatní nesmí do celého válce kloubu (R + c).
 * Vazby se kontrolují jen mimo koule svých atomů (vzorkováním podél osy).
 */
export function jointIsClear(
	mb: MovingBond,
	atomA: number,
	atomB: number,
	atoms: CollisionAtom[],
	bonds: CollisionBond[]
): boolean {
	const f = mb.frame;
	const toLocal = (p: THREE.Vector3) => {
		const v = p.clone().sub(f.start);
		const y = v.dot(f.dir);
		return new THREE.Vector2(Math.sqrt(Math.max(v.lengthSq() - y * y, 0)), y);
	};
	const keepout: THREE.Vector2[] = [
		new THREE.Vector2(0, 0), new THREE.Vector2(f.R, 0),
		new THREE.Vector2(f.R, f.length), new THREE.Vector2(0, f.length)
	];
	const neighbors = (i: number) =>
		new Set(bonds.flatMap((b) => (b.a === i ? [b.b] : b.b === i ? [b.a] : [])));
	const nA = neighbors(atomA), nB = neighbors(atomB);
	// vrací [polygon, extra vůle] proti kterému se daná věc kontroluje
	const target = (sideA: boolean, sideB: boolean): [THREE.Vector2[], number] =>
		sideA && !sideB ? [f.rotorProfile, f.c] : sideB && !sideA ? [f.statorProfile, f.c] : [keepout, f.c];
	const byIdx = new Map(atoms.map((a) => [a.index, a]));

	for (const a of atoms) {
		if (a.index === atomA || a.index === atomB) continue;
		const [poly, c] = target(nA.has(a.index), nB.has(a.index));
		if (distToPoly(toLocal(a.pos), poly) < a.radius + c) return false;
	}
	for (const b of bonds) {
		const isAB = (b.a === atomA && b.b === atomB) || (b.a === atomB && b.b === atomA);
		if (isAB) continue;
		const pa = byIdx.get(b.a), pb = byIdx.get(b.b);
		if (!pa || !pb) continue;
		const dir = pb.pos.clone().sub(pa.pos);
		const len = dir.length();
		if (len <= pa.radius + pb.radius) continue;
		dir.divideScalar(len);
		const s = pa.pos.clone().addScaledVector(dir, pa.radius);
		const e = pb.pos.clone().addScaledVector(dir, -pb.radius);
		const touchesA = b.a === atomA || b.b === atomA, touchesB = b.a === atomB || b.b === atomB;
		const [poly, c] = target(touchesA, touchesB);
		const N = 32;
		for (let i = 0; i <= N; i++) {
			const q = s.clone().lerp(e, i / N);
			if (distToPoly(toLocal(q), poly) < b.radius + c) return false;
		}
	}
	return true;
}
