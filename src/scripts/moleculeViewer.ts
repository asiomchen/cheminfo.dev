import type { RDKitLoader, RDKitModule } from "@rdkit/rdkit";
import rdkitWasmUrl from "@rdkit/rdkit/dist/RDKit_minimal.wasm?url";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type MoleculeSource = {
  format: "smiles" | "sdf";
  value: string;
};
type HydrogenMode = "preserve" | "add" | "remove";
type RDKitAtom = { z?: number };
type RDKitBond = { atoms: [number, number]; bo?: number };
type RDKitConformer = {
  dim: number;
  coords: Array<[number, number, number?]>;
};
type RDKitMolecule = {
  atoms: RDKitAtom[];
  bonds: RDKitBond[];
  conformers: RDKitConformer[];
};
type RDKitJSON = { molecules: RDKitMolecule[] };

type ViewerElements = {
  canvas: HTMLCanvasElement;
  controls: HTMLElement;
  hint: HTMLElement;
  resetButton: HTMLButtonElement;
  source: HTMLScriptElement;
  spinButton: HTMLButtonElement;
  status: HTMLElement;
};

const atomStyles: Record<number, { color: number; radius: number }> = {
  1: { color: 0xd9dddc, radius: 0.22 },
  6: { color: 0x555a59, radius: 0.34 },
  7: { color: 0x315ed1, radius: 0.38 },
  8: { color: 0xde3e35, radius: 0.39 },
  9: { color: 0x63b451, radius: 0.38 },
  15: { color: 0xe58a2d, radius: 0.44 },
  16: { color: 0xe6bd26, radius: 0.46 },
  17: { color: 0x4fa84b, radius: 0.46 },
  35: { color: 0x9f3731, radius: 0.5 },
  53: { color: 0x6f4697, radius: 0.56 },
};

const defaultAtomStyle = { color: 0x78a28f, radius: 0.38 };
const initializedViewers = new WeakSet<HTMLElement>();
let rdkitPromise: Promise<RDKitModule> | undefined;

function getElements(root: HTMLElement): ViewerElements | undefined {
  const canvas = root.querySelector<HTMLCanvasElement>(".viewer-canvas");
  const controls = root.querySelector<HTMLElement>("[data-viewer-controls]");
  const hint = root.querySelector<HTMLElement>("[data-viewer-hint]");
  const resetButton = root.querySelector<HTMLButtonElement>(
    "[data-viewer-reset]"
  );
  const source = root.querySelector<HTMLScriptElement>(
    "[data-molecule-source]"
  );
  const spinButton =
    root.querySelector<HTMLButtonElement>("[data-viewer-spin]");
  const status = root.querySelector<HTMLElement>("[data-viewer-status]");

  if (
    !canvas ||
    !controls ||
    !hint ||
    !resetButton ||
    !source ||
    !spinButton ||
    !status
  ) {
    return undefined;
  }

  return { canvas, controls, hint, resetButton, source, spinButton, status };
}

function readSource(element: HTMLScriptElement): MoleculeSource {
  const source = JSON.parse(element.textContent ?? "") as MoleculeSource;
  if (
    !["smiles", "sdf"].includes(source.format) ||
    typeof source.value !== "string" ||
    source.value.trim() === ""
  ) {
    throw new Error("Invalid molecule source");
  }
  return source;
}

function makeBond(
  start: THREE.Vector3,
  end: THREE.Vector3,
  geometry: THREE.CylinderGeometry,
  material: THREE.MeshStandardMaterial,
  offset?: THREE.Vector3
) {
  const from = start.clone().add(offset ?? new THREE.Vector3());
  const to = end.clone().add(offset ?? new THREE.Vector3());
  const direction = to.clone().sub(from);
  const length = direction.length();
  const bond = new THREE.Mesh(geometry, material);

  bond.position.copy(from).add(to).multiplyScalar(0.5);
  bond.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  bond.scale.set(1, length, 1);
  return bond;
}

function buildMolecule(
  data: RDKitMolecule,
  bondMaterial: THREE.MeshStandardMaterial
) {
  const group = new THREE.Group();
  const conformer = data.conformers[0];
  const coords = conformer?.coords;

  if (!coords || (conformer.dim !== 2 && conformer.dim !== 3)) {
    throw new Error("Molecule does not contain display coordinates");
  }

  const atomGeometry = new THREE.SphereGeometry(1, 28, 20);
  const bondGeometry = new THREE.CylinderGeometry(0.075, 0.075, 1, 14);
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const positions = coords.map(([x, y, z]) => new THREE.Vector3(x, y, z ?? 0));

  data.atoms.forEach((atom, index) => {
    const atomicNumber = atom.z ?? 6;
    const style = atomStyles[atomicNumber] ?? defaultAtomStyle;
    let material = materials.get(atomicNumber);

    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: style.color,
        metalness: 0.02,
        roughness: 0.5,
      });
      materials.set(atomicNumber, material);
    }

    const sphere = new THREE.Mesh(atomGeometry, material);
    sphere.position.copy(positions[index]);
    sphere.scale.setScalar(style.radius);
    group.add(sphere);
  });

  for (const bond of data.bonds) {
    const start = positions[bond.atoms[0]];
    const end = positions[bond.atoms[1]];
    const order = Math.max(1, Math.round(bond.bo ?? 1));

    if (order === 1) {
      group.add(makeBond(start, end, bondGeometry, bondMaterial));
      continue;
    }

    const direction = end.clone().sub(start).normalize();
    const reference =
      Math.abs(direction.z) < 0.85
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, reference)
      .normalize()
      .multiplyScalar(0.11);
    const offsets =
      order >= 3
        ? [perpendicular, new THREE.Vector3(), perpendicular.clone().negate()]
        : [perpendicular, perpendicular.clone().negate()];

    offsets.forEach(offset => {
      group.add(makeBond(start, end, bondGeometry, bondMaterial, offset));
    });
  }

  const center = new THREE.Box3()
    .setFromObject(group)
    .getCenter(new THREE.Vector3());
  group.position.sub(center);
  return group;
}

async function getMoleculeData(
  source: MoleculeSource,
  hydrogenMode: HydrogenMode
) {
  rdkitPromise ??= import("@rdkit/rdkit").then(module => {
    const initRDKitModule = (module.default ??
      module) as unknown as RDKitLoader;
    return initRDKitModule({ locateFile: () => rdkitWasmUrl });
  });
  const RDKit = await rdkitPromise;
  let molecule = RDKit.get_mol(source.value);

  if (!molecule?.is_valid()) {
    molecule?.delete();
    throw new Error("RDKit could not parse the molecule");
  }

  try {
    if (Number(molecule.has_coords()) === 0 && !molecule.set_new_coords(true)) {
      throw new Error("RDKit could not generate molecule coordinates");
    }

    const inputDimension = (JSON.parse(molecule.get_json()) as RDKitJSON)
      .molecules[0]?.conformers[0]?.dim;

    if (hydrogenMode !== "preserve") {
      const transformedMolBlock =
        hydrogenMode === "add" ? molecule.add_hs() : molecule.remove_hs();
      const transformedMolecule = RDKit.get_mol(transformedMolBlock);

      if (!transformedMolecule?.is_valid()) {
        transformedMolecule?.delete();
        throw new Error("RDKit could not transform molecule hydrogens");
      }

      molecule.delete();
      molecule = transformedMolecule;

      // RDKit adds explicit hydrogens at the origin in a 2D mol block. Re-run
      // the 2D depiction after reparsing so their bonds have valid endpoints.
      // Keep 3D coordinates untouched: regenerating them would flatten an SDF
      // conformer and replace source geometry with a depiction.
      if (
        hydrogenMode === "add" &&
        inputDimension === 2 &&
        !molecule.set_new_coords(true)
      ) {
        throw new Error("RDKit could not position added hydrogens");
      }
    }

    const parsed = JSON.parse(molecule.get_json()) as RDKitJSON;
    const data = parsed.molecules[0];
    if (!data) throw new Error("RDKit returned no molecule data");
    return data;
  } finally {
    molecule.delete();
  }
}

function fitCamera(
  camera: THREE.PerspectiveCamera,
  orbit: OrbitControls,
  sphere: THREE.Sphere,
  width: number,
  height: number,
  viewPadding: number
) {
  camera.aspect = width / height;
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov =
    2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const limitingHalfFov = Math.min(verticalFov, horizontalFov) / 2;
  const distance = (sphere.radius / Math.sin(limitingHalfFov)) * viewPadding;
  const direction = camera.position.clone().sub(orbit.target);

  if (direction.lengthSq() === 0) direction.set(0, 0.04, 1);
  direction.normalize();
  orbit.target.copy(sphere.center);
  camera.position.copy(sphere.center).addScaledVector(direction, distance);
  camera.near = Math.max(0.01, distance - sphere.radius * 2.2);
  camera.far = distance + sphere.radius * 4;
  camera.updateProjectionMatrix();
  orbit.minDistance = distance * 0.55;
  orbit.maxDistance = distance * 2.2;
  orbit.update(0);
  return camera.position.clone();
}

function updateSpinButton(
  root: HTMLElement,
  button: HTMLButtonElement,
  spinning: boolean
) {
  const pauseLabel = root.dataset.pauseLabel ?? "Pause rotation";
  const playLabel = root.dataset.playLabel ?? "Start rotation";
  const label = spinning ? pauseLabel : playLabel;

  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-pressed", String(spinning));
}

async function initViewer(root: HTMLElement) {
  if (initializedViewers.has(root)) return;
  initializedViewers.add(root);

  const elements = getElements(root);
  if (!elements) return;

  const { canvas, controls, hint, resetButton, source, spinButton, status } =
    elements;
  let renderer: THREE.WebGLRenderer | undefined;
  let handleThemeChange: ((event: Event) => void) | undefined;
  let frameId = 0;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.04, 1);
    const orbit = new OrbitControls(camera, canvas);
    const bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x262b2a,
      metalness: 0.02,
      roughness: 0.58,
    });
    const updateTheme = (theme: string | undefined) => {
      bondMaterial.color.set(theme === "dark" ? 0xaab4b1 : 0x262b2a);
    };
    handleThemeChange = (event: Event) => {
      updateTheme((event as CustomEvent<{ theme?: string }>).detail.theme);
    };
    updateTheme(document.documentElement.dataset.theme);
    document.addEventListener("site:theme-change", handleThemeChange);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x476462, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(6, 8, 10);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xa8d6cf, 1.15);
    fillLight.position.set(-7, -3, 5);
    scene.add(fillLight);

    const molecule = buildMolecule(
      await getMoleculeData(
        readSource(source),
        (root.dataset.hydrogens ?? "preserve") as HydrogenMode
      ),
      bondMaterial
    );
    molecule.rotation.set(-0.18, -0.08, -0.03);
    scene.add(molecule);

    const sphere = new THREE.Box3()
      .setFromObject(molecule)
      .getBoundingSphere(new THREE.Sphere());
    const viewPadding = Math.max(1, Number(root.dataset.viewPadding) || 1.1);
    let initialPosition = camera.position.clone();

    orbit.enableDamping = true;
    orbit.dampingFactor = 0.07;
    orbit.enablePan = true;
    orbit.autoRotate = root.dataset.autoRotate === "true";
    const rotationDegreesPerSecond = Math.max(
      Number.EPSILON,
      Number(root.dataset.rotationSpeed) || 10
    );
    orbit.autoRotateSpeed = rotationDegreesPerSecond / 6;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer?.setSize(width, height, false);
      initialPosition = fitCamera(
        camera,
        orbit,
        sphere,
        width,
        height,
        viewPadding
      );
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let previousFrameTime: number | undefined;
    let isVisible = false;
    let isRendering = false;
    const render = (frameTime: number) => {
      if (!isVisible) {
        isRendering = false;
        frameId = 0;
        return;
      }

      const deltaTime =
        previousFrameTime === undefined
          ? 0
          : Math.min((frameTime - previousFrameTime) / 1000, 0.1);
      previousFrameTime = frameTime;
      orbit.update(deltaTime);
      renderer?.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    const startRendering = () => {
      if (isRendering) return;
      isRendering = true;
      root.dataset.viewerActive = "true";
      previousFrameTime = undefined;
      frameId = window.requestAnimationFrame(render);
    };
    const stopRendering = () => {
      isVisible = false;
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      isRendering = false;
      root.dataset.viewerActive = "false";
      previousFrameTime = undefined;
    };
    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            isVisible = entry.isIntersecting;
            if (isVisible) startRendering();
            else stopRendering();
          })
        : undefined;
    if (intersectionObserver) {
      intersectionObserver.observe(root);
    } else {
      isVisible = true;
      startRendering();
    }
    renderer.render(scene, camera);

    updateSpinButton(root, spinButton, orbit.autoRotate);
    spinButton.addEventListener("click", () => {
      orbit.autoRotate = !orbit.autoRotate;
      updateSpinButton(root, spinButton, orbit.autoRotate);
    });
    resetButton.addEventListener("click", () => {
      camera.position.copy(initialPosition);
      orbit.target.copy(sphere.center);
      orbit.update(0);
    });

    document.addEventListener(
      "astro:before-swap",
      () => {
        window.cancelAnimationFrame(frameId);
        intersectionObserver?.disconnect();
        resizeObserver.disconnect();
        if (handleThemeChange) {
          document.removeEventListener("site:theme-change", handleThemeChange);
        }
        orbit.dispose();
        renderer?.dispose();
      },
      { once: true }
    );

    status.hidden = true;
    controls.hidden = false;
    hint.hidden = false;
  } catch {
    if (handleThemeChange) {
      document.removeEventListener("site:theme-change", handleThemeChange);
    }
    status.dataset.error = "true";
    status.lastChild?.remove();
    status.append(
      document.createTextNode(root.dataset.errorLabel ?? "Viewer unavailable")
    );
    hint.hidden = true;
    renderer?.dispose();
  }
}

function initMoleculeViewers() {
  document
    .querySelectorAll<HTMLElement>("[data-molecule-viewer]")
    .forEach(root => void initViewer(root));
}

initMoleculeViewers();
document.addEventListener("astro:page-load", initMoleculeViewers);
