import * as THREE from "three";

export function makeRoundedRectShape(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

export function makeRoundedCardFaceGeometry(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(makeRoundedRectShape(width, height, radius), 18);
  const position = geometry.attributes.position;
  const uvs: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    uvs.push((position.getX(index) + width / 2) / width, (position.getY(index) + height / 2) / height);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function makeFlatRoundedCardBodyGeometry(
  width: number,
  height: number,
  radius: number,
  depth: number,
) {
  const geometry = new THREE.ExtrudeGeometry(
    makeRoundedRectShape(width, height, radius),
    {
      depth,
      bevelEnabled: false,
      curveSegments: 18,
      steps: 1,
    },
  );

  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}
