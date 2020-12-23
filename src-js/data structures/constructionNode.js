"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructionNode = exports.ConstructionNodeType = void 0;
const translation_1 = require("../translation/translation");
/**
 * An object containing the possible types of {@link ConstructionNode|ConstructionNodes}.
 * @enum {number}
 * @namespace ConstructionNodeType
 */
var ConstructionNodeType;
(function (ConstructionNodeType) {
    /**
     * The corresponding ConstructionNode has two children `[n, d]`,
     * representing the number of facets `n`
     * and the number of dimensions `d` of the polytope.
     * Its name is generated by {@linkcode Translation.plain}.
     */
    ConstructionNodeType[ConstructionNodeType["Plain"] = 0] = "Plain";
    /**
     * The corresponding ConstructionNode has two children `[n, d]`, representing
     * the regular polygon {`n`/`d`}.
     * Its name is generated by {@linkcode Translation.regularPolygonName}.
     */
    ConstructionNodeType[ConstructionNodeType["Polygon"] = 1] = "Polygon";
    /**
     * The corresponding ConstructionNode has an array with the factors of a prism
     * product as children.
     * Its name is generated by {@linkcode Translation.multiFamily}.
     */
    ConstructionNodeType[ConstructionNodeType["Multiprism"] = 2] = "Multiprism";
    /**
     * The corresponding ConstructionNode has an array with the factors of a tegum
     * product as children.
     * Its name is generated by {@linkcode Translation.multiFamily}.
     */
    ConstructionNodeType[ConstructionNodeType["Multitegum"] = 3] = "Multitegum";
    /**
     * The corresponding ConstructionNode has an array with the factors of a
     * pyramid product as children.
     * Its name is generated by {@linkcode Translation.multiFamily}.
     */
    ConstructionNodeType[ConstructionNodeType["Multipyramid"] = 4] = "Multipyramid";
    /**
     * The corresponding ConstructionNode has a single child representing the
     * antiprismatic base
     * Its name is generated by {@linkcode Translation.familyMember}.
     */
    ConstructionNodeType[ConstructionNodeType["Antiprism"] = 5] = "Antiprism";
    /**
     * The corresponding ConstructionNode has a single child representing the
     * pyramidal base.
     * Its name is generated by {@linkcode Translation.familyMember}.
     */
    ConstructionNodeType[ConstructionNodeType["Pyramid"] = 6] = "Pyramid";
    /**
     * The corresponding ConstructionNode has a single child representing the
     * cupoidal base.
     * Its name is generated by {@linkcode Translation.familyMember}.
     */
    ConstructionNodeType[ConstructionNodeType["Cupola"] = 7] = "Cupola";
    /**
     * The corresponding ConstructionNode has two children `[n, d]`, representing
     * the regular polygonal base {`n`/`d`} of a cuploid.
     * Its name is generated by {@linkcode Translation.familyMember}.
     */
    ConstructionNodeType[ConstructionNodeType["Cuploid"] = 8] = "Cuploid";
    /**
     * The corresponding ConstructionNode has two children `[n, d]`, representing
     * the regular polygonal base {`n`/`d`} of a cupolaic blend.
     * Its name is generated by {@linkcode Translation.familyMember}.
     */
    ConstructionNodeType[ConstructionNodeType["CupolaicBlend"] = 9] = "CupolaicBlend";
    /**
     * The corresponding ConstructionNode has a polytope's "code name" as a child.
     * Used for polytopes whose names are in loadMessages.js.
     * Can be translated.
     * Its name is generated by {@linkcode Translation.get}.
     */
    ConstructionNodeType[ConstructionNodeType["Codename"] = 10] = "Codename";
    /**
     * The corresponding ConstructionNode has a polytope's name as a child.
     * The default for imported polytopes,
     * or polytopes not built out of anything else whose name is known.
     * Can **not** be translated.
     * Its name is just the ConstructionNode's child itslf.
     */
    ConstructionNodeType[ConstructionNodeType["Name"] = 11] = "Name";
    /**
     * The corresponding ConstructionNode has the dimension of a hypercube as a
     * child.
     * Its name is generated by {@linkcode Translation.hypercube}.
     */
    ConstructionNodeType[ConstructionNodeType["Hypercube"] = 12] = "Hypercube";
    /**
     * The corresponding ConstructionNode has the dimension of a simplex as a
     * child.
     * Its name is generated by {@linkcode Translation.simplex}.
     */
    ConstructionNodeType[ConstructionNodeType["Simplex"] = 13] = "Simplex";
    /**
     * The corresponding ConstructionNode has the dimension of an orthoplex as a
     * child.
     * Its name is generated by {@linkcode Translation.cross}.
     */
    ConstructionNodeType[ConstructionNodeType["Cross"] = 14] = "Cross";
})(ConstructionNodeType = exports.ConstructionNodeType || (exports.ConstructionNodeType = {}));
;
var PolytopeType;
(function (PolytopeType) {
    PolytopeType[PolytopeType["C"] = 0] = "C";
    PolytopeType[PolytopeType["S"] = 1] = "S";
})(PolytopeType || (PolytopeType = {}));
;
class ConstructionNode {
    /**
     * Creates a new ConstructionNode.
     * @constructor
     * @classdesc A ConstructionNode represents how a polytope has been built up.
     * ConstructionNodes come in various types, and always have at least one child.
     * Depending on the node type, these children can either be single objects,
     * or arrays of ConstructionNodes or other objects.<br />
     * &emsp;The possible node types and their descriptions are given in
     * {@link ConstructionNodeType}.
     * @param {ConstructionNodeType} type The ConstructionNode type.
     * @param {ChildrenType} children
     * The child or children of the node. The type of this variable depends on `type`.
     */
    constructor(type, children) {
        this.type = type;
        this.children = children;
        this.setGenders();
    }
    ;
    /**
     * Gets the name of a ConstructionNode's polytope based on its type.
     * Recursively calls itself on the ConstructionNode's children when possible.
     * @returns {string} The name of the polytope associated to the ConstructionNode.
     * @see [Polytope.prototype.getName]{@linkcode Polytope#getName}
     * @example
     * //"great heptagram"
     * Polytope.regularPolygon(7,3).constructione.getName();
     *
     * //"pentachoric prism"
     * Polytope.simplex(4).extrudeToPrism(1).construction.getName();
     *
     * //"pentagonal bipyramid"
     * Polytope.tegumProduct(Polytope.regularPolygon(5), Polytope.dyad()).construction.getName();
     */
    getName() {
        switch (this.type) {
            case ConstructionNodeType.Plain:
                return translation_1.Translation.plainName(this.children[0], this.children[1]);
            case ConstructionNodeType.Multiprism:
                this._mergeChildren();
                return ConstructionNode.multiFamily(this.children, "family/prism", "shape/dyad", "family/prism", this.gender);
            case ConstructionNodeType.Multitegum:
                this._mergeChildren();
                return ConstructionNode.multiFamily(this.children, "family/tegum", "shape/dyad", "family/bipyramid", this.gender);
            case ConstructionNodeType.Multipyramid:
                this._mergeChildren();
                return ConstructionNode.multiFamily(this.children, "family/pyramid", "shape/point", "family/pyramid", this.gender);
            case ConstructionNodeType.Antiprism:
                return ConstructionNode.familyMember(this.children, "family/antiprism", this.gender);
            case ConstructionNodeType.Pyramid:
                return ConstructionNode.familyMember(this.children, "family/pyramid", this.gender);
            case ConstructionNodeType.Cupola:
                return ConstructionNode.familyMember(this.children, "family/cupola", this.gender);
            case ConstructionNodeType.Cuploid:
                return ConstructionNode.familyMember(this.children[0], "family/cuploid", this.gender);
            case ConstructionNodeType.CupolaicBlend:
                return ConstructionNode.familyMember(this.children[0], "family/cupolaicBlend", this.gender);
            case ConstructionNodeType.Polygon:
                return translation_1.Translation.regularPolygonName(this.children[0], this.children[1], { gender: this.gender });
            case ConstructionNodeType.Codename:
                return translation_1.Translation.get("shape/" + this.children);
            case ConstructionNodeType.Name:
                return this.children;
            case ConstructionNodeType.Hypercube:
                return translation_1.Translation.hypercube(this.children);
            case ConstructionNodeType.Simplex:
                return translation_1.Translation.simplex(this.children);
            case ConstructionNodeType.Cross:
                return translation_1.Translation.cross(this.children);
            default:
                throw new Error("Not yet implemented!");
        }
    }
    ;
    /**
     * Sets the grammatical gender of the noun representing the root node's type
     * as the gender of all children nodes.
     * Is automatically called whenever the
     * [ConstructionNode constructor]{@link ConstructionNode}
     * is called.
     * @example
     * Translation.setLanguage("es");
     *
     * //setGenders() is automatically called when the polytope is generated.
     * //As a result, even though the word "cúpula" is femenine in Spanish,
     * //the final result will have the gender of the word "prisma",
     * //which is masculine.
     * var P = Polytope.cupola(5, 3).extrudeToPrism();
     *
     * //"prisma cupoidal pentagrámico cruzado"
     * console.log(P.getName());
     */
    setGenders() {
        if (!translation_1.Translation.genderedLanguage)
            return;
        switch (this.type) {
            case ConstructionNodeType.Polygon: //The gender of the plain polygon names
            case ConstructionNodeType.Plain: //The gender of the plain polytope names
            case ConstructionNodeType.Multiprism: //The gender of the word "multiprism"
            case ConstructionNodeType.Antiprism: //The gender of the word "antiprism"
            case ConstructionNodeType.Multitegum: //The gender of the word "multitegum"
                switch (translation_1.Translation.language) {
                    case "es":
                        this.gender = "male";
                        break;
                    case "de":
                        this.gender = "neuter";
                        break;
                    default: break;
                }
                break;
            case ConstructionNodeType.Pyramid: //The gender of the word "pyramid"
            case ConstructionNodeType.Cupola: //The gender of the word "cupola"
                switch (translation_1.Translation.language) {
                    case "es":
                    case "de":
                        this.gender = "female";
                        break;
                    default: break;
                }
                break;
            case ConstructionNodeType.CupolaicBlend: //The gender of the word "cupolaic blend"
                switch (translation_1.Translation.language) {
                    case "es":
                        this.gender = "female";
                        break;
                    default: break;
                }
                break;
            case ConstructionNodeType.Cuploid: //The gender of the word "cuploid"
                switch (translation_1.Translation.language) {
                    case "es":
                        this.gender = "male";
                        break;
                    default: break;
                }
                break;
        }
        this._setGenders();
    }
    ;
    /**
     * Auxiliary function for [ConstructionNode.prototype.setGenders]{@linkcode ConstructionNode#setGenders}.
     * Once the root node's gender has been found, it is recursively passed down
     * to its succesive children.
     * @private
     */
    _setGenders() {
        //If the node has a single child:
        if (!this.children.length && this.children._setGenders) {
            this.children.gender = this.gender;
            this.children._setGenders();
        }
        //If the node has an array of children:
        else {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (child._setGenders) {
                    child.gender = this.gender;
                    child._setGenders();
                }
            }
        }
    }
    ;
    /**
     * A multiprism of multiprisms is just a larger multiprism,
     * a multitegum of multitegums is just a larger multitegum, etc.
     * This function removes children nodes of the same type
     * and replaces them by their children.
     * @private
     */
    _mergeChildren() {
        var oldLength = this.children.length;
        for (var i = 0; i < oldLength; i++) {
            if (this.children[i].type === this.type) {
                for (var j = 0; j < this.children[i].children.length - 1; j++)
                    this.children.push(this.children[i].children.pop());
                this.children[i] = this.children[i].children.pop();
            }
        }
    }
    ;
    //Converts a nodeC into its the corresponding member of the specified family's name.
    static familyMember(node, family, gender) {
        return translation_1.Translation.addAdjective(translation_1.Translation.toAdjective(node.getName(), gender), translation_1.Translation.get(family));
    }
    ;
    //Converts a set of ConstructionNodes into their prism product/tegum product/pyramid product's name.
    //The family is which product is used ("prism", "tegum", "pyramid").
    //specialFactor is an element that, when in the product, is considered differently.
    //specialFactorModify specifies what this element becomes into within the product.
    //e.g. for a multiprism, specialFactor = "dyad", specialFactorModify = "prism".
    //For a multipyramid, specialFactor = "point", specialFactorModify = "pyramid".
    static multiFamily(nodes, family, specialFactor, specialFactorModify, gender) {
        let names = [];
        const FAMILY = translation_1.Translation.get(family), FAMILYADJ = translation_1.Translation.toAdjective(FAMILY, gender), SPECIAL = translation_1.Translation.get(specialFactor), SPECIALMOD = translation_1.Translation.get(specialFactorModify), SPECIALMODADJ = translation_1.Translation.toAdjective(SPECIALMOD, gender);
        let specialCount = 0, tempName, concatName, allNamesSame = true;
        //Counts special factors.
        for (let i = 0; i < nodes.length; i++) {
            tempName = nodes[i].getName();
            if (tempName === SPECIAL)
                specialCount++;
            else
                names.push(tempName);
        }
        let prefix; //The prefix before [family], e.g. *duo*[family], *trio*[family], ...
        switch (names.length) {
            //All special factors.
            case 0:
                names.push(SPECIAL);
                specialCount--;
            /*prefix = ""; //Fun fact: this code works the same
            break; //without these two lines!*/
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
                prefix = translation_1.Translation.greekPrefix(names.length);
                break;
        }
        //names cannot be empty.
        tempName = names.pop();
        concatName = translation_1.Translation.toAdjective(tempName, gender);
        while (names.length > 0) {
            concatName += "-" + translation_1.Translation.toAdjective(names[names.length - 1], gender);
            if (names.pop() !== tempName)
                allNamesSame = false;
        }
        if (!specialCount) {
            //X multi[family]
            if (allNamesSame)
                return translation_1.Translation.addAdjective(translation_1.Translation.toAdjective(tempName, gender), prefix + FAMILY);
            //X-Y-Z multi[family]
            return translation_1.Translation.addAdjective(concatName, prefix + FAMILY);
        }
        //Same as before, but adds as many ...[family-adj] [family]	as needed at the end.
        if (allNamesSame)
            concatName = translation_1.Translation.toAdjective(tempName, gender);
        //We aren't calling a single polytope X an "X mono[family]", are we?
        if (prefix)
            concatName = translation_1.Translation.addAdjective(concatName, prefix + FAMILYADJ);
        while (--specialCount)
            concatName = translation_1.Translation.addAdjective(concatName, SPECIALMODADJ);
        return translation_1.Translation.addAdjective(concatName, SPECIALMOD);
    }
    ;
}
exports.ConstructionNode = ConstructionNode;
//# sourceMappingURL=constructionNode.js.map