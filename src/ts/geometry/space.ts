import Global from "../global";
import Point from "./point";

/**
 * A namespace for operations on points.
 * @namespace Space
 */
export default abstract class Space {
  /**
   * Calculates the intersection of two segments.
   * Assumes that these segments are coplanar, but not collinear.
   * Ignores the intersection if it lies outside of the segments, or
   * "too close" to the endpoints.
   * @param {Point} a The first endpoint of the first segment.
   * @param {Point} b The second endpoint of the first segment.
   * @param {Point} c The first endpoint of the second segment.
   * @param {Point} d The second endpoint of the second segment.
   * @returns {Point} The intersection point of segments `ab` and `cd`, or
   * `null` if there's none.
   */
  static intersect(a: Point, b: Point, c: Point, d: Point): Point | null {
    //Checks if any of the points are in different dimensional spaces
    if (
      a.dimensions() !== b.dimensions() ||
      a.dimensions() !== c.dimensions() ||
      a.dimensions() !== d.dimensions()
    )
      throw new Error(
        "You can't intersect edges with different amounts of dimensions!"
      );

    //This projects a, b-a, c, d-c onto the a plane
    //Then, adapts the method from https://stackoverflow.com/a/565282 (by Gareth Rees)
    const p = [a.coordinates[Global.index0], a.coordinates[Global.index1]],
      r = [
        b.coordinates[Global.index0] - a.coordinates[Global.index0],
        b.coordinates[Global.index1] - a.coordinates[Global.index1],
      ],
      q = [c.coordinates[Global.index0], c.coordinates[Global.index1]],
      s = [
        d.coordinates[Global.index0] - c.coordinates[Global.index0],
        d.coordinates[Global.index1] - c.coordinates[Global.index1],
      ];

    //If the two lines' slopes are very similar, do nothing.
    //They either not intersect or are too similar for us to care.
    if (Space.sameSlope(r[0], r[1], s[0], s[1])) return null;

    const t =
        ((p[0] - q[0]) * s[1] - (p[1] - q[1]) * s[0]) /
        (s[0] * r[1] - s[1] * r[0]),
      u =
        ((p[0] - q[0]) * r[1] - (p[1] - q[1]) * r[0]) /
        (s[0] * r[1] - s[1] * r[0]);

    //The intersection lies outside of the segments, or at infinity
    //Makes sure that "t" and "u" are both inbetween Global.epsilon and 1
    if (
      t <= Global.epsilon ||
      t >= 1 - Global.epsilon ||
      u <= Global.epsilon ||
      u >= 1 - Global.epsilon
    )
      return null;

    //Returns the point a + t * (b - a).
    const pt: number[] = [];
    for (let i = 0; i < a.dimensions(); i++)
      pt.push(a.coordinates[i] + (b.coordinates[i] - a.coordinates[i]) * t);
    return new Point(pt);
  }

  //Checks if the angle between b - a and c - a is straight to a given precision
  static collinear(a: Point, b: Point, c: Point): boolean {
    if (Point.equal(a, b) || Point.equal(a, c))
      //If "a" is the same as "b" or "c"
      return true;

    //Calculates (b - a) . (c - a), |b - a|, |c - a|.
    //This will be used to calculate the angle between them.
    let dot = 0,
      norm0 = 0,
      norm1 = 0;
    for (let i = 0; i < a.coordinates.length; i++) {
      const sub0 = b.coordinates[i] - a.coordinates[i];
      const sub1 = c.coordinates[i] - a.coordinates[i];
      dot += sub0 * sub1;
      norm0 += sub0 * sub0;
      norm1 += sub1 * sub1;
    }

    //Returns true iff the cosine of the angle between b - a and c - a is at a
    //distance Global.epsilon from 1 or -1.
    return 1 - Math.abs(dot / Math.sqrt(norm0 * norm1)) <= Global.epsilon;
  }

  /**
   * Calculates the Euclidean distance between two points.
   * @param {Point} a The first point.
   * @param {Point} b The second point.
   * @returns {number} The distance between `a` and `b`.
   */
  static distance(a: Point, b: Point): number {
    return Math.sqrt(Space.distanceSq(a, b));
  }

  /**
   * Calculates the area of the triangle determined by three vertices
   * when projected onto a specific plane.
   * @param {Point} a The first of the triangle's vertices.
   * @param {Point} b The first of the triangle's vertices.
   * @param {Point} c The first of the triangle's vertices.
   * @param {number} j The first coordinate of the projection plane.
   * @param {number} k The second coordinate of the projection plane.
   */
  static area(a: Point, b: Point, c: Point, j: number, k: number): number {
    return Math.abs(
      a.coordinates[j] * (b.coordinates[k] - c.coordinates[k]) +
        b.coordinates[j] * (c.coordinates[k] - a.coordinates[k]) +
        c.coordinates[j] * (a.coordinates[k] - b.coordinates[k])
    );
  }

  /**
   * Calculates the squared Euclidean distance between two points.
   * For when you don't need that last square root.
   * @param {Point} a The first point.
   * @param {Point} b The second point.
   * @returns {number} The squared distance between `a` and `b`.
   */
  static distanceSq(a: Point, b: Point): number {
    let res = 0;
    for (let i = 0; i < a.coordinates.length; i++) {
      const t = a.coordinates[i] - b.coordinates[i];
      res += t * t;
    }
    return res;
  }

  /**
   * Returns whether the line from (0, 0) to (a, b) and the line from (0, 0) to
   * (c, d) have the same (neglibly different) slopes
   * @param {number} a The first coordinate.
   * @param {number} a The second coordinate.
   * @param {number} a The third coordinate.
   * @param {number} a The fourth coordinate.
   * @returns {boolean} Whether the slopes are approximately equal or not.
   */
  static sameSlope(a: number, b: number, c: number, d: number): boolean {
    //s is the difference between the angles.
    const s = Math.atan(a / b) - Math.atan(c / d);
    //Returns whether the angles (mod pi) are different by less than
    //Global.epsilon.
    return (s + Math.PI + Global.epsilon) % Math.PI < 2 * Global.epsilon;
  }
}
