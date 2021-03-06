/**
 * Contains methods to take various products between polytopes.
 *
 * @packageDocumentation
 * @module Product
 * @category Polytope methods
 */

import type ConstructionNode from "../../Data structures/Construction/base";
import {
  Multiprism as CNMultiprism,
  Multipyramid as CNMultipyramid,
  Multitegum as CNMultitegum,
} from "../../Data structures/Construction/Node";
import CNType from "../../Data structures/Construction/Type";
import Point from "../../geometry/Point";
import { ElementList, PolytopeB, PolytopeC } from "../types";
import * as Build from "./Build";

/**
 * Calculates the prism product (Cartesian product) of a set of polytopes.
 * Vertices are the products of vertices, edges are the products of vertices
 * with edges or viceversa, and so on.
 *
 * @param P The list of polytopes to "multiply" together.
 */
export const prism = function (...P: PolytopeB[]): PolytopeB {
  return _product(P, CNType.Multiprism, _prism);
};

/**
 * Helper function for [[`Polytope.prismProduct`]].
 * Is the one actually performing the product.
 * Takes the prism product of two polytopes.
 *
 * @param P The first polytope to multiply.
 * @param Q The second polytope to multiply.
 */
const _prism = function (P: PolytopeB, Q: PolytopeB): PolytopeB {
  // Deals with the point, nullitope cases.
  if (P.dimensions === 0) return Q;
  if (Q.dimensions === 0) return P;

  const P_ = P.toPolytopeC();
  const Q_ = Q.toPolytopeC();

  if (!P_.elementList[0] || !Q_.elementList[0]) return Build.nullitope();

  const newElementList: ElementList = [[]];
  const memoizer: number[][] = [];

  // Adds vertices.
  for (let i = 0; i < P_.elementList[0].length; i++) {
    for (let j = 0; j < Q_.elementList[0].length; j++) {
      newElementList[0].push(
        Point.product(P_.elementList[0][i], Q_.elementList[0][j])
      );
    }
  }

  // Fills up newElementList.
  for (let i = 1; i <= P.dimensions + Q.dimensions; i++) {
    newElementList.push([]);
  }

  // The dimensions of the subelements we're multiplying.
  for (let m = 0; m <= P.dimensions; m++) {
    for (let n = m === 0 ? 1 : 0; n <= Q.dimensions; n++) {
      // The indices of the elements we're multiplying.
      for (let i = 0; i < P_.elementList[m].length; i++) {
        for (let j = 0; j < Q_.elementList[n].length; j++) {
          // Adds the Cartesian product of the ith m-element and the j-th
          // n-element to the newElementList.
          // The elements of this product are the prism products of each of the
          // first polytope's facets with the other polytope, and viceversa.
          const indices: number[] = [];

          // Vertices don't have facets!
          if (m !== 0) {
            for (
              let k = 0;
              k < (P_.elementList[m] as number[][])[i].length;
              k++
            ) {
              indices.push(
                getIndexOfPrismProduct(
                  m - 1,
                  P_.elementList[m][i][k],
                  n,
                  j,
                  P_,
                  Q_,
                  memoizer
                )
              );
            }
          }
          if (n !== 0) {
            for (
              let k = 0;
              k < (Q_.elementList[n] as number[][])[j].length;
              k++
            ) {
              indices.push(
                getIndexOfPrismProduct(
                  m,
                  i,
                  n - 1,
                  Q_.elementList[n][j][k],
                  P_,
                  Q_,
                  memoizer
                )
              );
            }
          }

          (newElementList[m + n] as number[][]).push(indices);
        }
      }
    }
  }

  // The construction gets added in the main function.
  return new PolytopeC(newElementList);
};

/**
 * Helper function for [[`Polytope.prismProduct`]].
 * Gets the index of the product of the ith m-element of P
 * and the jth n-element of Q in the new polytope.
 * Takes into account the order in which the elements are calculated and
 * added.
 *
 * @param m The dimension of an element on the first polytope.
 * @param i The index of an element on the first polytope.
 * @param n The dimension of an element on the second polytope.
 * @param j The index of an element on the second polytope.
 * @param P The first polytope to multiply.
 * @param Q The second polytope to multiply.
 * @param memoizer An array to store past calculations.
 * @returns The index described above.
 */
const getIndexOfPrismProduct = function (
  m: number,
  i: number,
  n: number,
  j: number,
  P: PolytopeC,
  Q: PolytopeC,
  memoizer: number[][]
): number {
  // Recall that the elements of a single dimension are added in order
  // vertex * facet, edge * ridge, ...
  // memoizer[m][n] counts the number of such elements that we have to skip
  // before we reach the multiplication we actually care about.
  // This number is found recursively, so we memoize to calculate it more
  // efficiently.
  // offset calculates the index of our product within the products of elements
  // of the same dimensions, simply by recalling that this last ordering is
  // lexicographic.
  const offset = i * Q.elementList[n].length + j;

  if (memoizer[m]) {
    if (memoizer[m][n]) return memoizer[m][n] + offset;
  } else memoizer[m] = [];

  if (m === 0 || n === Q.elementList.length - 1) memoizer[m][n] = 0;
  else {
    memoizer[m][n] =
      memoizer[m - 1][n + 1] +
      P.elementList[m - 1].length * Q.elementList[n + 1].length;
  }
  return memoizer[m][n] + offset;
};

// Polytope._tegumProduct, but also supports P being an array.
export const tegum = function (...P: PolytopeB[]): PolytopeB {
  return _product(P, CNType.Multitegum, _tegum);
};

// Calculates the tegum product, or rather the dual of the Cartesian product,
// of P and Q.
// Edges are the products of vertices, faces are the products of vertices with
// edges or viceversa, and so on.
const _tegum = function (P: PolytopeB, Q: PolytopeB): PolytopeB {
  // Deals with the point, nullitope cases.
  const P_ = P.toPolytopeC();
  const Q_ = Q.toPolytopeC();

  if (P.dimensions <= 0 || !Q_.elementList[0]) return Q;
  if (Q.dimensions <= 0 || !P_.elementList[0]) return P;

  const newElementList: ElementList = [[]];
  const memoizer: number[][] = [];

  // Adds vertices.
  for (let i = 0; i < Q_.elementList[0].length; i++) {
    newElementList[0].push(
      Point.padLeft(Q_.elementList[0][i], P.spaceDimensions)
    );
  }
  for (let i = 0; i < P_.elementList[0].length; i++) {
    newElementList[0].push(
      Point.padRight(P_.elementList[0][i], Q.spaceDimensions)
    );
  }

  // Fills up newElementList.
  for (let i = 1; i <= P.dimensions + Q.dimensions; i++) {
    newElementList.push([]);
  }

  // The dimensions of the subelements we're multiplying.
  for (let m = -1; m < P.dimensions; m++) {
    let mDimCount: number;
    // Every polytope has a single nullitope.
    if (m === -1) mDimCount = 1;
    else mDimCount = P_.elementList[m].length;

    for (let n = -1; n < Q.dimensions; n++) {
      let nDimCount: number;
      // We don't care about adding the nullitope,
      // and we already dealt with vertices.
      if (m + n < 0) continue;

      // Same thing for n down here.
      if (n === -1) nDimCount = 1;
      else nDimCount = Q_.elementList[n].length;

      // The indices of the elements we're multiplying.
      for (let i = 0; i < mDimCount; i++) {
        let iElCount: number;

        // Nullitopes have no subelements.
        if (m === -1) iElCount = 0;
        // Points have only a single nullitope as a subelement.
        else if (m === 0) iElCount = 1;
        else iElCount = (P_.elementList[m] as number[][])[i].length;

        for (let j = 0; j < nDimCount; j++) {
          let jElCount: number;
          // Same thing for n down here.
          if (n === -1) jElCount = 0;
          else if (n === 0) jElCount = 1;
          else jElCount = (Q_.elementList[n] as number[][])[j].length;

          // Adds the pyramid product of the ith m-element and the j-th
          // n-element to the newElementList.
          // The elements of this product are the pyramid products of each of
          // the first polytope's facets with the other polytope, and
          // viceversa.
          // The pyramid product of a polytope and the nullitope is just the
          // polytope itself.
          const indices: number[] = [];

          // This loop won't be entered if m === -1.
          for (let k = 0; k < iElCount; k++) {
            let elIndx: number;
            // A vertex has only a single nullitope, we index it as "the zeroth
            // nullitope".
            if (m === 0) elIndx = 0;
            // We retrieve the index of the element's kth subelement.
            else elIndx = P_.elementList[m][i][k];

            indices.push(
              getIndexOfTegumProduct(
                m - 1,
                elIndx,
                n,
                j,
                P_,
                Q_,
                memoizer,
                true
              )
            );
          }
          // Same thing for n down here.
          for (let k = 0; k < jElCount; k++) {
            let elIndx: number;
            if (n === 0) elIndx = 0;
            else elIndx = Q_.elementList[n][j][k];

            indices.push(
              getIndexOfTegumProduct(
                m,
                i,
                n - 1,
                elIndx,
                P_,
                Q_,
                memoizer,
                true
              )
            );
          }

          (newElementList[m + n + 1] as number[][]).push(indices);
        }
      }
    }
  }

  // Calculating the components is a special case.
  // We'll just tegum multiply the compounds of the first polytope with the
  // compounds of the second.
  // m must be at least 0, since we already dealt with the case where P was a
  // Point.
  const m = P_.elementList.length - 1;
  const mDimCount = P_.elementList[m].length;
  const n = Q_.elementList.length - 1;
  const nDimCount = Q_.elementList[n].length;

  // The indices of the elements we're multiplying.
  for (let i = 0; i < mDimCount; i++) {
    let iElCount: number;
    // Points have only a single nullitope as a subelement.
    if (m === 0) iElCount = 1;
    else iElCount = (P_.elementList[m] as number[][])[i].length;

    for (let j = 0; j < nDimCount; j++) {
      let jElCount: number;
      // Same thing for n down here.
      if (n === 0) jElCount = 1;
      else jElCount = (Q_.elementList[n] as number[][])[j].length;

      // Adds the pyramid product of the ith m-element and the j-th n-element
      // to the newElementList.
      // The elements of this product are the pyramid products of each of the
      // first polytope's facets with the other polytope, and viceversa.
      // The pyramid product of a polytope and the nullitope is just the
      // polytope itself.
      const indices: number[] = [];

      for (let k = 0; k < iElCount; k++) {
        let elIndx: number;
        // A vertex has only a single nullitope, we index it as "the zeroth
        // nullitope".
        if (m === 0) elIndx = 0;
        // We retrieve the index of the element's kth subelement.
        else elIndx = P_.elementList[m][i][k];

        for (let l = 0; l < jElCount; l++) {
          let elIndx2: number;
          // Same thing for n.
          if (n === 0) elIndx2 = 0;
          else elIndx2 = Q_.elementList[n][j][k];

          indices.push(
            getIndexOfTegumProduct(
              m - 1,
              elIndx,
              n - 1,
              elIndx2,
              P_,
              Q_,
              memoizer,
              true
            )
          );
        }
      }

      (newElementList[m + n] as number[][]).push(indices);
    }
  }

  // The construction gets added in the main function.
  return new PolytopeC(newElementList);
};

// Polytope._pyramidProduct, but also supports P being an array.
export const pyramid = function (...P: PolytopeB[]): PolytopeB {
  return _product(P, CNType.Multipyramid, _pyramid);
};

// Calculates the pyramid product of P and Q.
// Edges are the products of vertices, faces are the products of vertices with
// edges or viceversa, and so on.
// Very similar to the tegum code.
const _pyramid = function (P: PolytopeB, Q: PolytopeB): PolytopeB {
  const P_ = P.toPolytopeC();
  const Q_ = Q.toPolytopeC();

  if (P.dimensions === -1 || !P_.elementList[0]) return Q;
  if (Q.dimensions === -1 || !Q_.elementList[0]) return P;

  // Pass this as a parameter somehow.
  let height = 1;

  const newElementList: ElementList = [[]];
  const memoizer: number[][] = [];

  // Adds vertices.
  for (let i = 0; i < Q_.elementList[0].length; i++) {
    newElementList[0].push(
      Point.padLeft(Q_.elementList[0][i], P.spaceDimensions).addCoordinate(
        height
      )
    );
  }
  height = -height; // Super trivial optimization.
  for (let i = 0; i < P_.elementList[0].length; i++) {
    newElementList[0].push(
      Point.padRight(P_.elementList[0][i], Q.spaceDimensions).addCoordinate(
        height
      )
    );
  }

  // Fills up newElementList.
  for (let i = 1; i <= P.dimensions + Q.dimensions + 1; i++) {
    newElementList.push([]);
  }

  // The dimensions of the subelements we're multiplying.
  for (let m = -1; m <= P.dimensions; m++) {
    // Every polytope has a single nullitope.
    let mDimCount: number;
    if (m === -1) mDimCount = 1;
    else mDimCount = P_.elementList[m].length;

    for (let n = -1; n <= Q.dimensions; n++) {
      // We don't care about adding the nullitope,
      // and we already dealt with vertices.
      if (m + n < 0) continue;

      // Same thing for n down here.
      let nDimCount: number;
      if (n === -1) nDimCount = 1;
      else nDimCount = Q_.elementList[n].length;

      // The indices of the elements we're multiplying.
      for (let i = 0; i < mDimCount; i++) {
        // Nullitopes have no subelements.
        let iElCount: number;
        if (m === -1) iElCount = 0;
        // Points have only a single nullitope as a subelement.
        else if (m === 0) iElCount = 1;
        else iElCount = (P_.elementList[m] as number[][])[i].length;

        for (let j = 0; j < nDimCount; j++) {
          // Same thing for n down here.
          let jElCount: number;
          if (n === -1) jElCount = 0;
          else if (n === 0) jElCount = 1;
          else jElCount = (Q_.elementList[n] as number[][])[j].length;

          // Adds the pyramid product of the ith m-element and the j-th
          // n-element to the newElementList.
          // The elements of this product are the pyramid products of each of
          // the first polytope's facets with the other polytope, and
          // viceversa.
          // The pyramid product of a polytope and the nullitope is just the
          // polytope itself.
          const indices: number[] = [];

          // This loop won't be entered if m = -1.
          for (let k = 0; k < iElCount; k++) {
            // A vertex has only a single nullitope, we index it as "the zeroth
            // nullitope".
            let elIndx: number;
            if (m === 0) elIndx = 0;
            // We retrieve the index of the element's kth subelement.
            else elIndx = P_.elementList[m][i][k];

            // We use an ever-so-slightly modified version of the tegum product
            // function, since it's so similar to what we need.
            indices.push(
              getIndexOfTegumProduct(
                m - 1,
                elIndx,
                n,
                j,
                P_,
                Q_,
                memoizer,
                false
              )
            );
          }
          // Same thing for n down here.
          for (let k = 0; k < jElCount; k++) {
            let elIndx: number;
            if (n === 0) elIndx = 0;
            else elIndx = Q_.elementList[n][j][k];

            indices.push(
              getIndexOfTegumProduct(
                m,
                i,
                n - 1,
                elIndx,
                P_,
                Q_,
                memoizer,
                false
              )
            );
          }

          (newElementList[m + n + 1] as number[][]).push(indices);
        }
      }
    }
  }

  // The construction gets added in the main function.
  return new PolytopeC(newElementList);
};

// Helper function for tegumProduct and pyramidProduct.
// Gets the index of the product of the ith m-element and the jth n-element in
// the new polytope.
// Takes into account the order in which the elements are calculated and added.
// The only difference between the tegum case and the pyramid case is that for
// pyramids, we need to consider an extra column in memoizer.
const getIndexOfTegumProduct = function (
  m: number,
  i: number,
  n: number,
  j: number,
  P: PolytopeC,
  Q: PolytopeC,
  memoizer: number[][],
  tegumMode: boolean
): number {
  // Recall that the elements of a single dimension are added in order
  // nullitope * facet, vertex * ridge, ...
  // memoizer[m][n] counts the number of such elements that we have to skip
  // before we reach the multiplication we actually care about.
  // This number is found recursively, so we memoize to calculate it more
  // efficiently.
  // offset calculates the index of our product within the products of elements
  // of the same dimensions, simply by recalling that this last ordering is
  // lexicographic.
  let offset: number;
  if (m === -1) offset = j;
  else if (n === -1) offset = i;
  else offset = i * Q.elementList[n].length + j;

  m++;
  n++; // To avoid wacky negative indices
  if (memoizer[m]) {
    if (memoizer[m][n]) return memoizer[m][n] + offset;
  } else memoizer[m] = [];

  if (m === 0 || n === Q.elementList.length - (tegumMode ? 1 : 0)) {
    memoizer[m][n] = 0;
  } else if (m === 1) {
    memoizer[m][n] = memoizer[m - 1][n + 1] + Q.elementList[n].length;
  } else {
    memoizer[m][n] =
      memoizer[m - 1][n + 1] +
      P.elementList[m - 2].length * Q.elementList[n].length;
  }
  return memoizer[m][n] + offset;
};

/**
 * Helper function for [[`prismProduct`]], [[`tegumProduct`]], and
 * [[`pyramidProduct`]].
 *
 * @param P An array of polytopes to "multiply."
 * @param type The [[`type` | ConstructionNode Type]] corresponding
 * to the product operation.
 * @param fun The function used to perform the product.
 * @returns The resulting product.
 */
const _product = function (
  P: PolytopeB[],
  type: CNType,
  fun: (P: PolytopeB, Q: PolytopeB) => PolytopeB
): PolytopeB {
  let res = P.pop();
  if (!res) return Build.nullitope();

  const constructions: ConstructionNode<unknown>[] = [];
  constructions.push(res.construction);

  while (P.length) {
    const pop = P.pop() as PolytopeB;
    // Stores the constructions of the elements of P in a temporary array.
    constructions.push(pop.construction);
    res = fun(pop, res);
  }

  switch (type) {
    case CNType.Multiprism:
      res.construction = new CNMultiprism(constructions);
      break;
    case CNType.Multitegum:
      res.construction = new CNMultitegum(constructions);
      break;
    case CNType.Multipyramid:
      res.construction = new CNMultipyramid(constructions);
      break;
  }
  return res;
};

/**
 * Extrudes a polytope into a prism.
 *
 * @param height The height of the prism.
 * @returns The resulting prism.
 */
export const extrudeToPrism = function (
  polytope: PolytopeB,
  height = 1
): PolytopeB {
  return prism(polytope.toPolytopeC(), Build.dyad(height));
};
