import * as THREE from "three";
import JSZip from "jszip";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { CreateAtomsParams, SelectedGeneratorParams, AtomWithBonds } from '$lib/types';

const exporter = new STLExporter();

let group: THREE.Group | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;

interface LocalSelectedGeneratorParams {
    x: number;
    y: number;
    z: number;
    quality: number;
    size: number;
    color: number;
    multiplicationFactor: number;
    coordinates?: AtomWithBonds[];
    originalCoordinates?: AtomWithBonds[];
    groupBondsSeparately?: boolean;
    uniformAtomDiameter?: boolean;
}

export function setupThreeJS(canvas: HTMLCanvasElement) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    // Add alpha: true for transparency support
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff); // scene background for display remains white
    renderer.shadowMap.enabled = true;

    // Lights setup
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.8);
    backLight.position.set(-5, -5, 5).normalize();
    backLight.castShadow = true;
    backLight.shadow.bias = -0.001;
    backLight.shadow.mapSize.width = 1024;
    backLight.shadow.mapSize.height = 1024;
    scene.add(backLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemisphereLight.position.set(0, 10, 0);
    scene.add(hemisphereLight);

    // Add ground plane (optional, commented out)
    // const planeGeometry = new THREE.PlaneGeometry(200, 200);
    // const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -Math.PI / 2;
    // plane.position.y = -1;
    // plane.receiveShadow = true;
    // scene.add(plane);

    const controls = new OrbitControls(camera, renderer.domElement);

    const clearScene = () => {
        const essentialObjects = [ambientLight, directionalLight, backLight, pointLight, hemisphereLight];
        scene!.children = essentialObjects;
    };

    // Inside your setupThreeJS function

    const createAtoms = (params: CreateAtomsParams) => {
        // NOTE: The CreateAtomsParams type will need to be updated to include `uniformAtomDiameter?: boolean;`
        // Add the new parameter here
        const { coordinates, quality, showHydrogens, multiplicationFactor, selectedGenerator, bondDiameterMultiplicationFactor, bondQuality, groupBondsSeparately, uniformAtomDiameter } = params;
        clearScene();

        group = new THREE.Group();
        scene!.add(group);

        const atomGroups: { [atomType: string]: THREE.Group } = {};

        // ---- NEW: Conditionally create a single group for all bonds ----
        let bondsGroup: THREE.Group | null = null;
        if (groupBondsSeparately) {
            bondsGroup = new THREE.Group();
            bondsGroup.name = 'Group_Bonds'; // Set the name for the exporter
            group.add(bondsGroup);
        }
        // ----------------------------------------------------------------

        const filteredCoordinates = showHydrogens ? coordinates : coordinates.filter(({ atomType }) => atomType !== "H");

        if (filteredCoordinates.length > 0) {
            // ---- START OF CORRECTED SECTION ----
            // Calculate the geometric center of the molecule
            const center = filteredCoordinates.reduce(
                (acc, { x, y, z }) => {
                    acc.x += x;
                    acc.y += y;
                    acc.z += z;
                    return acc;
                },
                { x: 0, y: 0, z: 0 }
            );

            const avgX = center.x / filteredCoordinates.length;
            const avgY = center.y / filteredCoordinates.length;
            const avgZ = center.z / filteredCoordinates.length;

            // Create new coordinates centered around the origin (0,0,0)
            const centeredCoordinates = filteredCoordinates.map(coord => ({
                ...coord,
                centeredX: coord.x - avgX,
                centeredY: coord.y - avgY,
                centeredZ: coord.z - avgZ
            }));

            // Position the camera to look at the center of the molecule
            camera!.position.set(0, 0, 10); // Adjust camera distance as needed
            camera!.lookAt(0, 0, 0);
            // ---- END OF CORRECTED SECTION ----

            centeredCoordinates.forEach((atom) => {
                const { atomType, centeredX, centeredY, centeredZ, AtomicRadius, CPKHexColor } = atom;

                // Original size calculation
                let size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;

                // ---- NEW: Handle uniform atom diameter for Ball-and-Stick model ----
                if (selectedGenerator === createBallAndStickMesh && uniformAtomDiameter) {
                    size = 0.6; // Use a constant size for all atoms
                }
                // --------------------------------------------------------------------

                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                // ---- MODIFIED: Handle the new return structure from generators ----
                const { atomMesh, bondMeshes } = selectedGenerator({
                    x: centeredX,
                    y: centeredY,
                    z: centeredZ,
                    quality,
                    size, // Pass the potentially modified size
                    color,
                    multiplicationFactor,
                    bondDiameterMultiplicationFactor,
                    bondQuality,
                    coordinates: centeredCoordinates as AtomWithBonds[],
                    originalCoordinates: filteredCoordinates as AtomWithBonds[],
                    groupBondsSeparately
                });
                // ------------------------------------------------------------------

                if (!atomGroups[atomType]) {
                    const groupForType = new THREE.Group();
                    groupForType.name = `Group_${atomType}`;
                    atomGroups[atomType] = groupForType;
                    group!.add(groupForType);
                }

                // The atom mesh ALWAYS goes into its element-specific group
                atomGroups[atomType].add(atomMesh);

                // ---- NEW: Decide where to put the bonds ----
                if (groupBondsSeparately && bondsGroup) {
                    // If checkbox is on, move bond meshes to the single "Group_Bonds"
                    // We use the spread operator (...) to move the children, not the group container itself
                    bondsGroup.add(...bondMeshes.children);
                } else {
                    // Otherwise, add the bonds to the same group as their parent atom
                    atomGroups[atomType].add(...bondMeshes.children);
                }
                // ---------------------------------------------
            });

            // ---- NEW COLORING LOGIC ----
            // When bonds are part of an atom's group, this ensures all meshes in that group (the atom and its bond halves) share the same color.
            if (!groupBondsSeparately) {
                Object.values(atomGroups).forEach(atomGroup => {
                    // Find the atom sphere in the group to get its color. We assume the first Mesh found is the atom.
                    const representativeAtom = atomGroup.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh | undefined;

                    if (representativeAtom && representativeAtom.material instanceof THREE.MeshStandardMaterial) {
                        const atomColor = representativeAtom.material.color;
                        const sharedMaterial = new THREE.MeshStandardMaterial({ color: atomColor });

                        // Apply this single, shared material to all meshes in the group.
                        atomGroup.traverse((child) => {
                            if (child instanceof THREE.Mesh) {
                                child.material = sharedMaterial;
                            }
                        });
                    }
                });
            }
            // If groupBondsSeparately is true, the bonds were already created grey and are in their own group, so no action is needed.
        }

        console.log('Group created and filled:', group);
    };

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function updateCanvasSize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (renderer && camera) {
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }

    return { animate, updateCanvasSize, createAtoms, clearScene };
}

export const createSphereMesh = (params: LocalSelectedGeneratorParams) => {
    const { x, y, z, quality, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size * multiplicationFactor, quality, quality),
        material
    );
    sphere.position.set(x, y, z);
    sphere.castShadow = true;

    // Return the new structure
    return {
        atomMesh: sphere,
        bondMeshes: new THREE.Group() // Return an empty group for bonds
    };
};

export const createCubeMesh = (params: LocalSelectedGeneratorParams) => {
    const { x, y, z, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size * multiplicationFactor, size * multiplicationFactor, size * multiplicationFactor),
        material
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;

    // Return the new structure
    return {
        atomMesh: cube,
        bondMeshes: new THREE.Group() // Return an empty group for bonds
    };
};

export const createStickMesh = (params: UpdatedLocalSelectedGeneratorParams): { atomMesh: THREE.Mesh, bondMeshes: THREE.Group } => {
    const {
        x,
        y,
        z,
        quality,
        // size, // The atom's own radius ('size') is intentionally ignored in the "Sticks" model.
        color,
        multiplicationFactor,
        coordinates,
        // bondDiameterMultiplicationFactor, // Not used in this model
        // bondQuality // Not used in this model, combined into 'quality'
    } = params;

    // Fallback if coordinates are not provided (e.g., for a single atom with no bonds)
    if (!coordinates) {
        console.warn("Coordinates are required for stick representation; creating a fallback sphere.");
        const fallbackMaterial = new THREE.MeshStandardMaterial({ color });
        // The fallback atom still respects the stick model's visual rules.
        const stickRadius = 0.2 * multiplicationFactor;
        const fallbackAtom = new THREE.Mesh(
            new THREE.SphereGeometry(stickRadius, quality, quality),
            fallbackMaterial
        );
        fallbackAtom.position.set(x, y, z);
        fallbackAtom.castShadow = true;
        return {
            atomMesh: fallbackAtom,
            bondMeshes: new THREE.Group()
        };
    }

    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'Bonds';

    // In the "Sticks" model, the radius for both atoms (spheres) and bonds (cylinders)
    // is uniform and controlled by the multiplication factor. A base of 0.2 is used.
    const stickRadius = 0.2 * multiplicationFactor;

    // The atom "ball" is a sphere with the same radius as the bond "sticks".
    const material = new THREE.MeshStandardMaterial({ color });
    const atomMesh = new THREE.Mesh(
        new THREE.SphereGeometry(stickRadius, quality, quality),
        material
    );
    atomMesh.position.set(x, y, z);
    atomMesh.castShadow = true;

    // Find the current atom's full data to access its bond information.
    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(atom =>
        atom.centeredX !== undefined &&
        atom.centeredY !== undefined &&
        atom.centeredZ !== undefined &&
        Math.abs(atom.centeredX - x) < EPSILON &&
        Math.abs(atom.centeredY - y) < EPSILON &&
        Math.abs(atom.centeredZ - z) < EPSILON
    );

    // If the atom is found and has bonds, create the cylinder meshes for them.
    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach(bond => {
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);

            if (bondedAtom) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );

                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const bondLength = direction.length();
                const halfBondLength = bondLength / 2;

                // Avoid creating a zero-length cylinder.
                if (halfBondLength === 0) return;

                const cylinderGeometry = new THREE.CylinderGeometry(
                    stickRadius,    // top radius
                    stickRadius,    // bottom radius
                    halfBondLength, // height
                    quality,        // radial segments (using the single quality parameter)
                    1               // height segments
                );

                // Shift the cylinder's origin to its base.
                cylinderGeometry.translate(0, halfBondLength / 2, 0);

                // Use a neutral grey material; final color is applied later in createAtoms.
                const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const cylinder = new THREE.Mesh(cylinderGeometry, bondMaterial);

                // Position the cylinder's base at the current atom's center.
                cylinder.position.copy(startPos);

                // Rotate it to point towards the bonded atom.
                cylinder.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );
                cylinder.castShadow = true;

                bondsGroup.add(cylinder);
            }
        });
    }

    return { atomMesh, bondMeshes: bondsGroup };
};

export const createBallAndStickMesh = (params: UpdatedLocalSelectedGeneratorParams): { atomMesh: THREE.Mesh, bondMeshes: THREE.Group } => {
    const {
        x,
        y,
        z,
        quality,
        size,
        color,
        multiplicationFactor,
        coordinates,
        bondDiameterMultiplicationFactor,
        bondQuality
    } = params;

    // Fallback if coordinates are not provided, ensuring the correct return type
    if (!coordinates) {
        console.warn("Coordinates are required for ball-and-stick representation");
        return {
            atomMesh: createSphereMesh(params).atomMesh, // Assuming createSphereMesh is updated to return { atomMesh, bondMeshes }
            bondMeshes: new THREE.Group()
        };
    }

    // This group will hold ONLY the bonds for this atom
    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'Bonds'; // Optional: Give the temporary group a name for debugging

    // The atom sphere is created as a standalone mesh
    const sphereSize = size * multiplicationFactor * 0.4;
    const material = new THREE.MeshStandardMaterial({ color });
    const atomMesh = new THREE.Mesh(
        new THREE.SphereGeometry(sphereSize, quality, quality),
        material
    );
    atomMesh.position.set(x, y, z);
    atomMesh.castShadow = true;

    // Find the full data for the current atom in the coordinates list
    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(atom =>
        atom.centeredX !== undefined &&
        atom.centeredY !== undefined &&
        atom.centeredZ !== undefined &&
        Math.abs(atom.centeredX - x) < EPSILON &&
        Math.abs(atom.centeredY - y) < EPSILON &&
        Math.abs(atom.centeredZ - z) < EPSILON
    );

    // If the atom is found and has bonds, create the 'sticks'
    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach(bond => {
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);

            if (bondedAtom) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );

                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const bondLength = direction.length();

                // This atom will only draw its half of the bond, from its center to the midpoint.
                const halfBondLength = bondLength / 2;

                // Avoid creating a cylinder with zero length (e.g., atom bonded to itself)
                if (halfBondLength === 0) return;

                // Bond radius is proportional to the atom's size for a natural look.
                const bondRadius = 0.5 * (bondDiameterMultiplicationFactor ?? 0.5);//const bondRadius = sphereSize * (bondDiameterMultiplicationFactor ?? 0.5);

                const cylinderGeometry = new THREE.CylinderGeometry(
                    bondRadius,          // top radius
                    bondRadius,          // bottom radius
                    halfBondLength,      // height
                    bondQuality,         // radial segments
                    1                    // height segments
                );

                // Move the cylinder's origin to its base for easy positioning and rotation.
                cylinderGeometry.translate(0, halfBondLength / 2, 0);

                // Bonds are now always created grey. The final coloring is handled in createAtoms.
                const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const cylinder = new THREE.Mesh(cylinderGeometry, bondMaterial);

                // Position the cylinder's base at the center of the current atom.
                cylinder.position.copy(startPos);

                // Rotate the cylinder to point from the current atom towards the bonded atom.
                cylinder.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0), // Default cylinder orientation is along the Y-axis
                    direction.normalize()
                );

                cylinder.castShadow = true;

                // Add the new cylinder to the dedicated bonds group.
                bondsGroup.add(cylinder);
            }
        });
    }

    // Return the atom mesh and the group of bond meshes as separate properties.
    return { atomMesh, bondMeshes: bondsGroup };
};


// Export scene or specific mesh as binary STL
export function exportBinary() {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    let delay = 0;

    group.children.forEach((child, index) => {
        if (child instanceof THREE.Group) {
            const result = exporter.parse(child, { binary: true }) as DataView;

            // Použijeme název skupiny nebo generujeme unikátní název
            const groupName = child.name || `Group_${index}`;
            console.log(`Exporting group: ${groupName}`);

            // Nastavení časového odstupu pro každé stažení
            setTimeout(() => {
                downloadSTL(result.buffer, `${groupName}.stl`);
            }, delay);

            delay += 1000; // Zpoždění 100 ms mezi staženími
        }
    });
}

export function exportBinaryAsZip(
    fileName: string,
    metadata: Record<string, any>
) {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    const zip = new JSZip();

    // Přidání STL souborů do ZIP
    group.children.forEach((child, index) => {
        if (child instanceof THREE.Group) {
            const result = exporter.parse(child, { binary: true }) as DataView;

            const groupName = child.name || `Group_${index}`;
            console.log(`Exporting group: ${groupName}`);

            // Přidání STL do ZIP
            zip.file(`${groupName}.stl`, new Blob([result.buffer as ArrayBuffer], { type: "application/octet-stream" }));
        }
    });

    // Přidání metadat jako textového souboru
    const metadataContent = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

    zip.file("metadata.txt", metadataContent);

    // Generování ZIP a stažení
    zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href); // Uvolnění paměti
        console.log("ZIP was created with metadaty:", fileName);
    }).catch((error) => {
        console.error("Error creating ZIP:", error);
    });
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function roundCoord(val: number): string {
    return Number(val.toFixed(5)).toString();
}

interface GroupGeometryData {
    name: string;
    colorHex: string;
    vertices: number[];
    indices: number[];
}

export async function exportModelAs3MF(
    fileName: string,
    metadata?: Record<string, any>
): Promise<void> {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    group.updateMatrixWorld(true);

    const groupDataList: GroupGeometryData[] = [];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    group.children.forEach((child, index) => {
        if (!(child instanceof THREE.Group || child instanceof THREE.Mesh)) {
            return;
        }

        const groupName = child.name || `Group_${index}`;
        let groupColor = "#808080";

        child.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material) {
                const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
                if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
                    groupColor = `#${mat.color.getHexString().toUpperCase()}`;
                }
            }
        });

        const vertices: number[] = [];
        const indices: number[] = [];
        const v = new THREE.Vector3();

        child.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.geometry) {
                let cleanGeom: THREE.BufferGeometry = obj.geometry.clone();
                cleanGeom.deleteAttribute('uv');
                cleanGeom.deleteAttribute('normal');
                cleanGeom = mergeVertices(cleanGeom, 1e-4);

                const positionAttribute = cleanGeom.getAttribute('position') as THREE.BufferAttribute | undefined;
                if (!positionAttribute) {
                    cleanGeom.dispose();
                    return;
                }

                const indexAttribute = cleanGeom.index;
                const worldMatrix = obj.matrixWorld;
                const baseVertexOffset = vertices.length / 3;

                for (let i = 0; i < positionAttribute.count; i++) {
                    v.fromBufferAttribute(positionAttribute, i);
                    v.applyMatrix4(worldMatrix);
                    vertices.push(v.x, v.y, v.z);

                    if (v.x < minX) minX = v.x;
                    if (v.y < minY) minY = v.y;
                    if (v.z < minZ) minZ = v.z;
                    if (v.x > maxX) maxX = v.x;
                    if (v.y > maxY) maxY = v.y;
                    if (v.z > maxZ) maxZ = v.z;
                }

                if (indexAttribute !== null) {
                    for (let i = 0; i < indexAttribute.count; i++) {
                        indices.push(indexAttribute.getX(i) + baseVertexOffset);
                    }
                } else {
                    for (let i = 0; i < positionAttribute.count; i++) {
                        indices.push(i + baseVertexOffset);
                    }
                }

                cleanGeom.dispose();
            }
        });

        if (indices.length > 0 && vertices.length > 0) {
            groupDataList.push({
                name: groupName,
                colorHex: groupColor,
                vertices,
                indices
            });
        }
    });

    if (groupDataList.length === 0) {
        console.warn("No geometry found to export in 3MF.");
        return;
    }

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="config" ContentType="text/xml" />
  <Default Extension="txt" ContentType="text/plain" />
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    let baseMaterialsXml = '    <basematerials id="1">\n';
    let colorGroupXml = '    <m:colorgroup id="2">\n';
    groupDataList.forEach((data) => {
        baseMaterialsXml += `      <base name="${escapeXml(data.name)}" displaycolor="${data.colorHex}FF" />\n`;
        colorGroupXml += `      <m:color color="${data.colorHex}FF" />\n`;
    });
    baseMaterialsXml += '    </basematerials>\n';
    colorGroupXml += '    </m:colorgroup>\n';

    const objectId = 3;
    const vertexLines: string[] = [];
    const triangleLines: string[] = [];
    const volumeConfigs: string[] = [];

    let globalVertexOffset = 0;
    let globalTriangleOffset = 0;

    groupDataList.forEach((data, i) => {
        const numVertices = data.vertices.length / 3;
        const numTriangles = data.indices.length / 3;
        const firstTriangleId = globalTriangleOffset;
        const lastTriangleId = globalTriangleOffset + numTriangles - 1;

        for (let vIdx = 0; vIdx < data.vertices.length; vIdx += 3) {
            vertexLines.push(
                `          <vertex x="${roundCoord(data.vertices[vIdx])}" y="${roundCoord(data.vertices[vIdx + 1])}" z="${roundCoord(data.vertices[vIdx + 2])}" />`
            );
        }

        for (let tIdx = 0; tIdx < data.indices.length; tIdx += 3) {
            const v1 = data.indices[tIdx] + globalVertexOffset;
            const v2 = data.indices[tIdx + 1] + globalVertexOffset;
            const v3 = data.indices[tIdx + 2] + globalVertexOffset;
            triangleLines.push(
                `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${i}" />`
            );
        }

        volumeConfigs.push(`    <volume firstid="${firstTriangleId}" lastid="${lastTriangleId}">
      <metadata type="volume" key="name" value="${escapeXml(data.name)}"/>
      <metadata type="volume" key="volume_type" value="ModelPart"/>
      <metadata type="volume" key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata type="volume" key="source_object_id" value="${objectId}"/>
      <metadata type="volume" key="source_volume_id" value="${i}"/>
      <metadata type="volume" key="extruder" value="${i + 1}"/>
      <mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </volume>`);

        globalVertexOffset += numVertices;
        globalTriangleOffset += numTriangles;
    });

    const centerX = isFinite(minX) && isFinite(maxX) ? (minX + maxX) / 2 : 0;
    const centerY = isFinite(minY) && isFinite(maxY) ? (minY + maxY) / 2 : 0;
    const offsetX = roundCoord(100 - centerX);
    const offsetY = roundCoord(100 - centerY);
    const offsetZ = roundCoord(isFinite(minZ) ? -minZ : 0);

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">
  <metadata name="slic3rpe:Version3mf">1</metadata>
  <metadata name="Title">${escapeXml(fileName)}</metadata>
  <metadata name="Application">3D-Print-Molecules-WEB</metadata>
  <resources>
${baseMaterialsXml}${colorGroupXml}    <object id="${objectId}" name="${escapeXml(fileName)}" type="model" pid="1" pindex="0">
      <mesh>
        <vertices>
${vertexLines.join('\n')}
        </vertices>
        <triangles>
${triangleLines.join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${offsetX} ${offsetY} ${offsetZ}" printable="1" />
  </build>
</model>`;

    const slic3rPeModelConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="${objectId}" instances_count="1">
    <metadata type="object" key="name" value="${escapeXml(fileName)}"/>
${volumeConfigs.join('\n')}
  </object>
</config>`;

    const colorList = groupDataList.map(d => d.colorHex).join(';');
    const nozzleDiameters = groupDataList.map(() => '0.4').join(',');
    const filamentDiameters = groupDataList.map(() => '1.75').join(',');

    const slic3rPeConfig = `; generated by 3D-Print-Molecules-WEB
; extruder_colour = ${colorList}
; filament_colour = ${colorList}
; nozzle_diameter = ${nozzleDiameters}
; filament_diameter = ${filamentDiameters}
; single_extruder_multi_material = 1
`;

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.folder("_rels")!.file(".rels", relsXml);
    zip.folder("3D")!.file("3dmodel.model", modelXml);

    const metadataFolder = zip.folder("Metadata")!;
    metadataFolder.file("Slic3r_PE_model.config", slic3rPeModelConfig);
    metadataFolder.file("Slic3r_PE.config", slic3rPeConfig);

    if (metadata) {
        const metadataContent = Object.entries(metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
        zip.file("metadata.txt", metadataContent);
    }

    try {
        const content = await zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
            compression: "DEFLATE",
            compressionOptions: { level: 6 }
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.3mf`;
        link.click();
        URL.revokeObjectURL(link.href);
        console.log("3MF was successfully created:", fileName);
    } catch (error) {
        console.error("Error creating 3MF:", error);
    }
}

export function exportModelAsSTL(fileName: string) {
    if (!group) {
        console.warn("No mesh available for export.");
        return;
    }

    // Export celého modelu
    const result = exporter.parse(group, { binary: true }) as DataView;

    // Stáhneme jako jeden STL soubor
    downloadSTL(result.buffer, `${fileName}.stl`);
}

// Helper function to trigger download
function downloadSTL(data: ArrayBufferLike, filename: string) {
    const arrayBuffer = data as ArrayBuffer; // Explicit cast to ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // Cleanup the URL object
    URL.revokeObjectURL(link.href);
}

// Add this new function
export function takeScreenshot(): string | null {
    if (!renderer || !scene || !camera) {
        console.warn("Three.js not initialized");
        return null;
    }
    // Store original clear settings
    const originalClearColor = renderer.getClearColor(new THREE.Color()).getHex();
    const originalAlpha = renderer.getClearAlpha();
    // Set transparent background for the screenshot
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    // Restore original clear settings
    renderer.setClearColor(originalClearColor, originalAlpha);
    return dataUrl;
}

interface UpdatedLocalSelectedGeneratorParams extends LocalSelectedGeneratorParams {
    originalCoordinates?: AtomWithBonds[];
    bondDiameterMultiplicationFactor?: number; // New parameter for bond diameter
    bondQuality?: number; // New parameter for cylinder mesh quality
}