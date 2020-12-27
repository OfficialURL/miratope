import { Translation } from "../translation/translation";

/** An enumeration containing the possible types of [[`ConstructionNode`]]s.
 */
export enum Type {
  /**
   * The corresponding ConstructionNode has two children `[n, d]`,
   * representing the number of facets `n`
   * and the number of dimensions `d` of the polytope.
   * Its name is generated by {@linkcode Translation.plain}.
   */
  Plain,

  /**
   * The corresponding ConstructionNode has two children `[n, d]`, representing
   * the regular polygon {`n`/`d`}.
   * Its name is generated by {@linkcode Translation.regularPolygonName}.
   */
  Polygon,

  /**
   * The corresponding ConstructionNode has an array with the factors of a prism
   * product as children.
   * Its name is generated by {@linkcode Translation.multiFamily}.
   */
  Multiprism,

  /**
   * The corresponding ConstructionNode has an array with the factors of a tegum
   * product as children.
   * Its name is generated by {@linkcode Translation.multiFamily}.
   */
  Multitegum,

  /**
   * The corresponding ConstructionNode has an array with the factors of a
   * pyramid product as children.
   * Its name is generated by {@linkcode Translation.multiFamily}.
   */
  Multipyramid,

  /**
   * The corresponding ConstructionNode has a single child representing the
   * antiprismatic base.
   * Its name is generated by {@linkcode ConstructionNode.familyMember}.
   */
  Antiprism,

  /**
   * The corresponding ConstructionNode has a single child representing the
   * pyramidal base.
   * Its name is generated by {@linkcode ConstructionNode.familyMember}.
   */
  Pyramid,

  /**
   * The corresponding ConstructionNode has a single child representing the
   * cupoidal base.
   * Its name is generated by {@linkcode ConstructionNode.familyMember}.
   */
  Cupola,

  /**
   * The corresponding ConstructionNode has a single child representing the
   * cuploidal base.
   * Its name is generated by {@linkcode ConstructionNode.familyMember}.
   */
  Cuploid,

  /**
   * The corresponding ConstructionNode has a single child representing the
   * cupolaic blend base.
   * Its name is generated by {@linkcode ConstructionNode.familyMember}.
   */
  CupolaicBlend,

  /**
   * The corresponding ConstructionNode has a polytope's "code name" as a child.
   * Used for polytopes whose names are in loadMessages.js.
   * Can be translated.
   * Its name is generated by {@linkcode Translation.get}.
   */
  Codename,

  /**
   * The corresponding ConstructionNode has a polytope's name as a child.
   * The default for imported polytopes,
   * or polytopes not built out of anything else whose name is known.
   * Can **not** be translated.
   * Its name is just the ConstructionNode's child itslf.
   */
  Name,

  /**
   * The corresponding ConstructionNode has the dimension of a hypercube as a
   * child.
   * Its name is generated by [[`Translation.hypercube`]].
   */
  Hypercube,

  /**
   * The corresponding ConstructionNode has the dimension of a simplex as a
   * child.
   * Its name is generated by [[`Translation.simplex`]].
   */
  Simplex,

  /**
   * The corresponding ConstructionNode has the dimension of an orthoplex as a
   * child.
   * Its name is generated by [[`Translation.cross`]].
   */
  Cross,
}

export default abstract class ConstructionNode<T> {
  /** The type of `ConstructionNode`. */
  abstract readonly type: Type;
  /** The "child" of the node, stores information about the construction of a
   * polytope. The exact information it stores depends on the [[`type`]]. */
  abstract child: T;
  abstract polytope: unknown;
  abstract gender: string = "";

  /** Returns the name of the polytope represented by the `ConstructionNode`.
   */
  abstract getName(): string;

  /** Assigns its own gender to its children, whenever the children are
  `ConstructionNodes` too. */
  abstract setGenders(gender: string): void;

  /**
   * A multiprism of multiprisms is just a larger multiprism,
   * a multitegum of multitegums is just a larger multitegum, etc.
   * This function removes children nodes of the same type
   * and replaces them by their children.
   * @private
   */
  _mergeChildren(): void {
    //If the children are an array.
    if (this.child instanceof Array) {
      const oldLength = this.child.length;

      //For each of the array's members:
      for (let i = 0; i < oldLength; i++) {
        //If the child is of the same type of construction node:
        if (this.child[i].type === this.type) {
          const child = this.child[i].child;

          //If the child is an array (this should always be true):
          if (child instanceof Array) {
            //Flatten the children array.
            for (let j = 0; j < child.length - 1; j++)
              this.child.push(child.pop());
            this.child[i] = child.pop();
          }
        }
      }
    } else
      throw new Error(
        "__mergeChildren can only be called in a product ConstructionNode!"
      );
  }

  /**
   * Converts a ConstructionNode into the corresponding member of the specified
   * family's name.
   *
   * @param family The code for the family's name.
   * @param gender The gramattical gender of the resulting expression.
   * @example
   * do.yes();
   */
  static familyMember(
    node: ConstructionNode<unknown>,
    family: string,
    gender: string
  ): string {
    return Translation.addAdjective(
      Translation.toAdjective(node.getName(), gender),
      Translation.get(family)
    );
  }

  //Converts a set of ConstructionNodes into their prism product/tegum product/
  //pyramid product's name.
  //The family is which product is used ("prism", "tegum", "pyramid").
  //specialFactor is an element that, when in the product, is considered
  //differently.
  //specialFactorModify specifies what this element becomes into within the
  //product.
  //e.g. in a multiprism, specialFactor = "dyad", specialFactorModify = "prism".
  //In a multipyramid, specialFactor = "point", specialFactorModify = "pyramid".
  static multiFamily(
    nodes: ConstructionNode<unknown>[],
    family: string,
    specialFactor: string,
    specialFactorModify: string,
    gender: string
  ): string {
    const names: string[] = [];
    const FAMILY = Translation.get(family),
      FAMILYADJ = Translation.toAdjective(FAMILY, gender),
      SPECIAL = Translation.get(specialFactor),
      SPECIALMOD = Translation.get(specialFactorModify),
      SPECIALMODADJ = Translation.toAdjective(SPECIALMOD, gender);
    let specialCount = 0,
      tempName: string,
      concatName: string,
      allNamesSame = true;

    //Counts special factors.
    for (let i = 0; i < nodes.length; i++) {
      tempName = nodes[i].getName();
      if (tempName === SPECIAL) specialCount++;
      else names.push(tempName);
    }

    //The prefix before [family], e.g. *duo*[family], *trio*[family], ...
    let prefix: string;
    switch (names.length) {
      //All special factors.
      case 0:
        names.push(SPECIAL);
        specialCount--;
        prefix = "";
        break;
      case 1:
        prefix = "";
        break;
      case 2:
        prefix = "duo";
        break;
      case 3:
        prefix = "trio";
        break;
      default:
        prefix = Translation.greekPrefix(names.length);
        break;
    }

    //names cannot be empty.
    tempName = names.pop() as string;
    concatName = Translation.toAdjective(tempName, gender);

    while (names.length > 0) {
      concatName +=
        "-" + Translation.toAdjective(names[names.length - 1], gender);
      if (names.pop() !== tempName) allNamesSame = false;
    }

    if (!specialCount) {
      //X multi[family]
      if (allNamesSame)
        return Translation.addAdjective(
          Translation.toAdjective(tempName, gender),
          prefix + FAMILY
        );

      //X-Y-Z multi[family]
      return Translation.addAdjective(concatName, prefix + FAMILY);
    }

    //Same as before, but adds as many ...[family-adj] [family]	as needed at the
    //end.
    if (allNamesSame) concatName = Translation.toAdjective(tempName, gender);

    //We aren't calling a single polytope X an "X mono[family]", are we?
    if (prefix)
      concatName = Translation.addAdjective(concatName, prefix + FAMILYADJ);

    while (--specialCount)
      concatName = Translation.addAdjective(concatName, SPECIALMODADJ);

    return Translation.addAdjective(concatName, SPECIALMOD);
  }
}

/**
 * A ConstructionNode of [[`Type.Plain`]] type.
 *
 * @category ConstructionNode Type
 */
export class Plain extends ConstructionNode<[number, number]> {
  readonly type = Type.Plain;
  child: [number, number];
  polytope: unknown;
  gender: string;

  constructor(child: [number, number]) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      case "de":
        this.gender = "neuter";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return Translation.plainName(this.child[0], this.child[1]);
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Polygon`]] type.
 *
 * @category ConstructionNode Type
 */
export class Polygon extends ConstructionNode<[number, number]> {
  readonly type = Type.Polygon;
  child: [number, number];
  polytope: unknown;
  gender: string;

  constructor(child: [number, number]) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      case "de":
        this.gender = "neuter";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return Translation.regularPolygonName(this.child[0], this.child[1], {
      gender: this.gender,
    });
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Multiprism`]] type.
 *
 * @category ConstructionNode Type
 */
export class Multiprism extends ConstructionNode<ConstructionNode<unknown>[]> {
  readonly type = Type.Multiprism;
  child: ConstructionNode<unknown>[];
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>[]) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      case "de":
        this.gender = "neuter";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    this._mergeChildren();
    return ConstructionNode.multiFamily(
      this.child,
      "family/prism",
      "shape/dyad",
      "family/prism",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    for (let i = 0; i < this.child.length; i++)
      this.child[i].setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Multitegum`]] type.
 *
 * @category ConstructionNode Type
 */
export class Multitegum extends ConstructionNode<ConstructionNode<unknown>[]> {
  readonly type = Type.Multitegum;
  child: ConstructionNode<unknown>[];
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>[]) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      case "de":
        this.gender = "neuter";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    this._mergeChildren();
    return ConstructionNode.multiFamily(
      this.child,
      "family/tegum",
      "shape/dyad",
      "family/bipyramid",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    for (let i = 0; i < this.child.length; i++)
      this.child[i].setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Multipyramid`]] type.
 *
 * @category ConstructionNode Type
 */
export class Multipyramid extends ConstructionNode<
  ConstructionNode<unknown>[]
> {
  readonly type = Type.Multipyramid;
  child: ConstructionNode<unknown>[];
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>[]) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
      case "de":
        this.gender = "female";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    this._mergeChildren();
    return ConstructionNode.multiFamily(
      this.child,
      "family/pyramid",
      "shape/point",
      "family/pyramid",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    for (let i = 0; i < this.child.length; i++)
      this.child[i].setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Antiprism`]] type.
 *
 * @category ConstructionNode Type
 */
export class Antiprism extends ConstructionNode<ConstructionNode<unknown>> {
  readonly type = Type.Antiprism;
  child: ConstructionNode<unknown>;
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      case "de":
        this.gender = "neuter";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return ConstructionNode.familyMember(
      this.child,
      "family/antiprism",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    this.child.setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Pyramid`]] type.
 *
 * @category ConstructionNode Type
 */
export class Pyramid extends ConstructionNode<ConstructionNode<unknown>> {
  readonly type = Type.Pyramid;
  child: ConstructionNode<unknown>;
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
      case "de":
        this.gender = "female";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return ConstructionNode.familyMember(
      this.child,
      "family/pyramid",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    this.child.setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Cupola`]] type.
 *
 * @category ConstructionNode Type
 */
export class Cupola extends ConstructionNode<ConstructionNode<unknown>> {
  readonly type = Type.Cupola;
  child: ConstructionNode<unknown>;
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
      case "de":
        this.gender = "female";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return ConstructionNode.familyMember(
      this.child,
      "family/cupola",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    this.child.setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.Cuploid`]] type.
 *
 * @category ConstructionNode Type
 */
export class Cuploid extends ConstructionNode<ConstructionNode<unknown>> {
  readonly type = Type.Cuploid;
  child: ConstructionNode<unknown>;
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
        this.gender = "male";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return ConstructionNode.familyMember(
      this.child,
      "family/cuploid",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
    this.child.setGenders(gender);
  }
}

/**
 * A ConstructionNode of [[`Type.CupolaicBlend`]] type.
 *
 * @category ConstructionNode Type
 */
export class CupolaicBlend extends ConstructionNode<ConstructionNode<unknown>> {
  readonly type = Type.CupolaicBlend;
  child: ConstructionNode<unknown>;
  polytope: unknown;
  gender: string;

  constructor(child: ConstructionNode<unknown>) {
    super();
    this.child = child;
    switch (Translation.language) {
      case "es":
      case "de":
        this.gender = "female";
        break;
      default:
        this.gender = "";
    }
  }

  getName(): string {
    return ConstructionNode.familyMember(
      this.child,
      "family/cupolaicBlend",
      this.gender
    );
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Codename`]] type.
 *
 * @category ConstructionNode Type
 */
export class Codename extends ConstructionNode<string> {
  readonly type = Type.Codename;
  child: string;
  polytope: unknown;
  gender: string;

  constructor(child: string) {
    super();
    this.child = child;
    this.gender = "";
  }

  getName(): string {
    return Translation.get("shape/" + this.child, { gender: this.gender });
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Name`]] type.
 *
 * @category ConstructionNode Type
 */
export class Name extends ConstructionNode<string> {
  readonly type = Type.Codename;
  child: string;
  polytope: unknown;
  gender: string;

  constructor(child: string) {
    super();
    this.child = child;
    this.gender = "";
  }

  getName(): string {
    return this.child;
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Hypercube`]] type.
 *
 * @category ConstructionNode Type
 */
export class Hypercube extends ConstructionNode<number> {
  readonly type = Type.Hypercube;
  child: number;
  polytope: unknown;
  gender: string;

  constructor(child: number) {
    super();
    this.child = child;
    this.gender = "";
  }

  getName(): string {
    return Translation.hypercube(this.child);
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Simplex`]] type.
 *
 * @category ConstructionNode Type
 */
export class Simplex extends ConstructionNode<number> {
  readonly type = Type.Simplex;
  child: number;
  polytope: unknown;
  gender: string;

  constructor(child: number) {
    super();
    this.child = child;
    this.gender = "";
  }

  getName(): string {
    return Translation.simplex(this.child);
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}

/**
 * A ConstructionNode of [[`Type.Cross`]] type.
 *
 * @category ConstructionNode Type
 */
export class Cross extends ConstructionNode<number> {
  readonly type = Type.Cross;
  child: number;
  polytope: unknown;
  gender: string;

  constructor(child: number) {
    super();
    this.child = child;
    this.gender = "";
  }

  getName(): string {
    return Translation.cross(this.child);
  }

  setGenders(gender: string): void {
    this.gender = gender;
  }
}
