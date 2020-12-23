"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolytopeBuild = void 0;
const constructionNode_1 = require("../../data structures/constructionNode");
const point_1 = require("../../geometry/point");
const polytopeTypes_1 = require("../polytopeTypes");
class PolytopeBuild {
    /**
     * Simple auxiliary function to get the length of a regular polygon's vertex figure.
     * @param {number} n The number of sides of the polygon.
     * @param {number} d The winding number of the polygon.
     */
    static verfLength(n, d) {
        if (d === undefined)
            d = 1;
        return 2 * Math.cos(Math.PI / (n / d));
    }
    ;
    /**
     * Creates the null polytope.
     * @returns {Polytope} An instance of the null polytope.
     */
    static nullitope() {
        return new polytopeTypes_1.PolytopeC([], new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Codename, "nullitope"));
    }
    ;
    /**
     * Creates the point polytope.
     * @returns An instance of the point polytope.
     */
    static point() {
        return new polytopeTypes_1.PolytopeC([[new point_1.Point([])]], new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Codename, "point"));
    }
    ;
    /**
     * Creates a dyad (line segment) of a specified length.
     * @param {number} length The length of the dyad.
     * @returns A dyad of the specified length.
     */
    static dyad(length) {
        //The dyad's length defaults to 1.
        //Note that the variable name length is actually a misnomer, and will store half of the length instead.
        if (length === undefined)
            length = 0.5;
        else
            length /= 2;
        return new polytopeTypes_1.PolytopeC([[new point_1.Point([-length]), new point_1.Point([length])], [[0, 1]]], new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Codename, "dyad"));
    }
    ;
    //Builds a polygon from the vertices given in order.
    static polygon(points) {
        let newElementList = [[], [], [[]]];
        let i;
        for (i = 0; i < points.length - 1; i++) {
            newElementList[0].push(points[i]);
            newElementList[1].push([i, i + 1]);
            newElementList[2][0].push(i);
        }
        newElementList[0].push(points[i]);
        newElementList[1].push([i, 0]);
        newElementList[2][0].push(i);
        return new polytopeTypes_1.PolytopeC(newElementList, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [points.length, 1]));
    }
    ;
    /**
     * Builds a regular polygon with a given edge length.
     * @param {number} n The number of sides of the regular polygon.
     * @param {number} d The winding number of the regluar polygon.
     * @param {number} [s=1] The edge length of the regular polygon.
     * @returns {Polytope} The regular polygon.
     */
    static regularPolygon(n, d, s) {
        let gcd;
        if (d === undefined) {
            d = 1;
            gcd = 1;
        }
        else
            gcd = Math.gcd(n, d);
        if (s === undefined)
            s = 1;
        let els = [[], [], []], n_gcd = n / gcd, counter = 0, components, x = 0, y = d, t = 2 * Math.PI / n, angle = 0, invRad = 2 * Math.sin(Math.PI * d / n) / s; //1 / the circumradius.
        for (let i = 0; i < n; i++) {
            els[0].push(new point_1.Point([Math.cos(angle) / invRad, Math.sin(angle) / invRad])); //Vertices
            angle += t;
        }
        //i is the component number.
        for (let i = 0; i < gcd; i++) {
            //x and y keep track of the vertices that are being connected.
            components = [];
            //j is the edge.
            for (let j = 0; j < n_gcd; j++) {
                els[1].push([x, y]); //Edges
                x = y;
                y += d;
                if (y >= n)
                    y -= n;
                components.push(counter++); //Components
            }
            els[2].push(components);
            x++;
            y++;
        }
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d]));
    }
    ;
    //Builds a Grünbaumian n/d star with edge lenth s.
    //In the future, should be replaced by the PolytopeS version.
    static regularPolygonG(n, d, s) {
        if (d === undefined)
            d = 1;
        if (s === undefined)
            s = 1;
        let els = [[], [], [[]]];
        let angle = 0, t = Math.PI * d / n, invRad = 2 * Math.sin(t) / s; //1 / the circumradius
        for (let i = 0; i < n; i++) {
            els[0].push(new point_1.Point([Math.cos(angle) / invRad, Math.sin(angle) / invRad])); //Vertices
            els[2][0].push(i); //Face.
            angle += 2 * t;
        }
        for (let i = 0; i < n - 1; i++)
            els[1].push([i, i + 1]); //Edges
        els[1].push([els[0].length - 1, 0]);
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d]));
    }
    ;
    /**
     * Builds a semiuniform polygon with `n` sides and "absolute turning number" `d`
     * with some given edge lengths.
     * The absolute turning number is the number `d` such that
     * the sum of the angles of the polygon is `π(n - 2d)`.
     * The bowtie is generated by the special case of `n = 4`, `d = 0`, for lack of
     * better parameters.
     * @param {number} n The number of sides of the semiuniform polygon.
     * @param {number} [d=1] The "absolute turning number", as defined above.
     * @param {number} [a=1] The first edge length of the polygon.
     * @param {number} [b=1] The second edge length of the polygon.
     * @return {Polytope} The resulting semiregular polygon.
     */
    static semiregularPolygon(n, d = 1, a = 1, b = 1) {
        //If n = 4, d = 0, a bowtie is created.
        //Idk if there are more natural parameters for the bowtie.
        if (n === 4 && d === 0) {
            //If a > b, swaps b and a.
            if (a > b) {
                var t = a;
                a = b;
                b = t;
            }
            b = Math.sqrt(b * b - a * a) / 2;
            a /= 2;
            return new polytopeTypes_1.PolytopeC([
                [new point_1.Point([-a, b]), new point_1.Point([a, b]), new point_1.Point([-a, -b]), new point_1.Point([a, -b])],
                [[0, 1], [1, 2], [2, 3], [3, 0]],
                [[0, 1, 2, 3]]
            ], new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Codename, "bowtie"));
        }
        //The angles and sides of a triangle made by three adjacent vertices.
        //Also, the circumdiameter 2R.
        let gamma = Math.PI * (1 - 2 * d / n), c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(gamma)), R = c / Math.sin(gamma) / 2, 
        //The sine rule doesn't work here, since asin is ambiguous in [0, π/2].
        //Instead, we use the more complicated cosine rule.
        alpha = 2 * Math.acos((b * b + c * c - a * a) / (2 * b * c)), //is actually 2α.
        beta = 2 * Math.acos((a * a + c * c - b * b) / (2 * a * c)), //is actually 2β.
        //Some more variables
        angle = 0;
        let els = [[], [], [[]]];
        for (let i = 0; i < n / 2; i++) {
            //Side a.
            els[0].push(new point_1.Point([Math.cos(angle) * R, Math.sin(angle) * R])); //Vertices
            els[2][0].push(2 * i); //Face.
            angle += alpha;
            //Side b
            els[0].push(new point_1.Point([Math.cos(angle) * R, Math.sin(angle) * R])); //Vertices
            els[2][0].push(2 * i + 1); //Face.
            angle += beta;
        }
        for (let i = 0; i < n - 1; i++)
            els[1].push([i, i + 1]); //Edges
        els[1].push([els[0].length - 1, 0]);
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d]));
    }
    ;
    //Builds a hypercube in the specified amount of dimensions.
    //Positioned in the standard orientation with edge length 1.
    //In the future, will be replaced by the PolytopeS version.
    static hypercube(dimensions) {
        let els = [[]];
        for (let i = 0; i < dimensions; i++)
            els.push([]);
        //Mapping from pairs of the indices below to indices of the corresponding els.
        let locations = [];
        //i and i^j are the indices of the vertices of the current subelement.
        //i^j is used instead of j to ensure that facets of els
        //are generated before the corresponding element.
        for (let i = 0; i < Math.pow(2, dimensions); i++) {
            for (let j = 0; j < Math.pow(2, dimensions); j++) {
                //If the indices are the same, this is a vertex
                if (i == 0) {
                    let coordinates = [];
                    for (let k = 1; k <= dimensions; k++)
                        coordinates.push(j % (Math.pow(2, k)) < Math.pow(2, k - 1) ? 0.5 : -0.5);
                    locations[j] = [els[0].length];
                    els[0].push(new point_1.Point(coordinates));
                    continue;
                }
                //To avoid redundancy, i^j should be >=i using the obvious partial ordering on bitstrings.
                //This is equivalent to i and j being disjoint
                if ((j & i) != 0)
                    continue;
                //Everything else is a higher-dimensional element
                let elementDimension = 0;
                let difference = i; //Notice that i !== 0.
                let differences = [];
                do {
                    elementDimension++;
                    differences.push(difference & ~(difference - 1));
                    difference = difference & (difference - 1);
                } while (difference > 0);
                let facets = [];
                //facets connected to i
                for (var k = 0; k < differences.length; k++)
                    facets.push(locations[j][i ^ differences[k]]);
                //facets connected to i^j
                for (var k = 0; k < differences.length; k++)
                    facets.push(locations[j ^ differences[k]][i ^ differences[k]]);
                locations[j][i] = els[elementDimension].length;
                els[elementDimension].push(facets);
            }
        }
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Hypercube, dimensions));
    }
    ;
    //Builds a simplex in the specified amount of dimensions.
    //Implements the more complicated coordinates in the space of the same dimension.
    //In the future, will be replaced by the PolytopeS version.
    static simplex(dimensions) {
        let vertices = [];
        //Memoizes some square roots, tiny optimization.
        let aux = [Infinity];
        for (var i = 1; i <= dimensions; i++)
            aux.push(1 / Math.sqrt(2 * i * (i + 1)));
        //Adds vertices.
        for (var i = 0; i <= dimensions; i++) {
            let coordinates = [];
            for (var j = 1; j <= dimensions; j++) {
                if (j > i)
                    coordinates.push(-aux[j]);
                else if (j === i)
                    coordinates.push(j * aux[j]);
                else
                    coordinates.push(0);
            }
            vertices.push(new point_1.Point(coordinates));
        }
        //Adds higher dimensional elements.
        let els = [vertices];
        for (let i = 1; i <= dimensions; i++)
            els.push([]);
        let locations = [];
        for (let i = 0; i < dimensions + 1; i++)
            locations[Math.pow(2, i)] = i;
        for (let i = 1; i < Math.pow(2, dimensions + 1); i++) {
            //Vertices were generated earlier
            if (!(i & (i - 1)))
                continue;
            let elementDimension = -1;
            let t = i;
            let elemVertices = [];
            do {
                elementDimension++;
                elemVertices.push(t & ~(t - 1));
                t = t & (t - 1);
            } while (t > 0);
            let facets = [];
            for (var k = 0; k < elemVertices.length; k++)
                facets.push(locations[i ^ elemVertices[k]]);
            locations[i] = els[elementDimension].length;
            els[elementDimension].push(facets);
        }
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Simplex, dimensions));
    }
    ;
    //Builds a cross-polytope in the specified amount of dimensions.
    //Positioned in the standard orientation with edge length 1.
    //In the future, will be replaced by the PolytopeS version.
    static cross(dimensions) {
        //i is the set of nonzero dimensions, j is the set of negative dimensions
        let els = [[]];
        for (let i = 0; i < dimensions; i++)
            els.push([]);
        let locations = [];
        //The full polytope is best handled separately
        for (let i = 1; i < Math.pow(2, dimensions); i++) {
            for (let j = 0; j < Math.pow(2, dimensions); j++) {
                //No negative zero dimensions
                if ((i & j) != j)
                    continue;
                if (!j)
                    locations[i] = [];
                if (!(i & (i - 1))) {
                    let coordinates = [];
                    let sign = j ? -1 : 1;
                    for (let k = 0; k < dimensions; k++)
                        coordinates.push((Math.pow(2, k)) == i ? sign * Math.SQRT1_2 : 0);
                    locations[i][j] = els[0].length;
                    els[0].push(new point_1.Point(coordinates));
                    continue;
                }
                let elementDimension = -1;
                let t = i;
                let elemVertices = [];
                do {
                    elementDimension++;
                    elemVertices.push(t & ~(t - 1));
                    t = t & (t - 1);
                } while (t > 0);
                let facets = [];
                for (var k = 0; k < elemVertices.length; k++)
                    facets.push(locations[i ^ elemVertices[k]][j & ~elemVertices[k]]);
                locations[i][j] = els[elementDimension].length;
                els[elementDimension].push(facets);
            }
        }
        let facets = [];
        for (var i = 0; i < els[dimensions - 1].length; i++) {
            facets.push(i);
        }
        els[dimensions].push(facets);
        return new polytopeTypes_1.PolytopeC(els, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Cross, dimensions));
    }
    ;
    //Creates a uniform {n / d} antiprism.
    //Only meant for when (n, d) = 1.
    static uniformAntiprism(n, d) {
        if (d === undefined)
            d = 1;
        let x = n / d, scale = 2 * Math.sin(Math.PI / x), //Guarantees an unit edge length polytope.
        height = Math.sqrt((Math.cos(Math.PI / x) - Math.cos(2 * Math.PI / x)) / 2) / scale; //Half of the distance between bases.
        let base1 = [], base2 = [], newElementList = [[], [], [base1, base2], [[]]];
        let i = 0; //The edges in the bases.
        while (i < 2 * (n - 1)) {
            //Vertices.
            newElementList[0].push(new point_1.Point([Math.cos(Math.PI * (i / x)) / scale, Math.sin(Math.PI * (i / x)) / scale, height]));
            //Equatorial edges, top & bottom edges.
            newElementList[1].push([i, i + 1], [i, i + 2]);
            //Triangular faces.
            newElementList[2].push([2 * i, 2 * i + 1, 2 * i + 2]);
            //Polygonal faces.
            base1.push(2 * i + 1);
            i++;
            //Same thing down here:
            newElementList[0].push(new point_1.Point([Math.cos(Math.PI * (i / x)) / scale, Math.sin(Math.PI * (i / x)) / scale, -height]));
            newElementList[1].push([i, i + 1]);
            newElementList[1].push([i, i + 2]);
            newElementList[2].push([2 * i, 2 * i + 1, 2 * i + 2]);
            base2.push(2 * i + 1);
            i++;
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([Math.cos(Math.PI * (i / x)) / scale, Math.sin(Math.PI * (i / x)) / scale, height]));
        newElementList[1].push([i, i + 1]);
        newElementList[1].push([i, 0]);
        newElementList[2].push([2 * i, 2 * i + 1, 2 * i + 2]);
        base1.push(2 * i + 1);
        i++;
        newElementList[0].push(new point_1.Point([Math.cos(Math.PI * (i / x)) / scale, Math.sin(Math.PI * (i / x)) / scale, -height]));
        newElementList[1].push([i, 0], [i, 1]);
        newElementList[2].push([2 * i, 2 * i + 1, 0]);
        base2.push(2 * i + 1);
        //Adds component.
        for (i = 0; i < 2 * (n + 1); i++)
            newElementList[3][0].push(i);
        return new polytopeTypes_1.PolytopeC(newElementList, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Antiprism, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d])));
    }
    ;
    //Creates an {n / d} cupola with regular faces.
    static cupola(n, d) {
        if (d === undefined)
            d = 1;
        let x = n / d, r1 = 1 / (2 * Math.sin(Math.PI / x)), //Radius of the smaller base.
        r2 = 1 / (2 * Math.sin(Math.PI / (2 * x))), //Radius of the larger base.
        t = 1 / (2 * Math.tan(Math.PI / x)) - 1 / (2 * Math.tan(Math.PI / (2 * x))), //Temporary variable.
        h0 = Math.sqrt(1 - t * t), //Distance between bases.
        h1 = ((r2 * r2 - r1 * r1) / h0 + h0) / 2, //Distance between circumcenter and smaller base.
        h2 = h1 - h0; //Distance between circumcenter and larger base.
        let base1 = [], base2 = [], newElementList = [[], [], [base1, base2], [[]]]; //List of elements of the cupola.
        let i;
        for (i = 0; i < n - 1; i++) {
            //Small base's vertices.
            newElementList[0].push(new point_1.Point([r1 * Math.cos(2 * Math.PI * (i / x)), r1 * Math.sin(2 * Math.PI * (i / x)), h1]));
            //Small base's edges.
            newElementList[1].push([i, i + 1]);
            //Connecting edges.
            newElementList[1].push([i, n + 2 * i]);
            newElementList[1].push([i, n + 2 * i + 1]);
            //Triangles.
            newElementList[2].push([3 * i + 1, 3 * i + 2, 3 * n + 2 * i]);
            //Squares.
            newElementList[2].push([3 * i + 2, 3 * n + 2 * i + 1, 3 * i + 4, 3 * i]);
            //Small base.
            base1.push(3 * i);
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r1 * Math.cos(2 * Math.PI * (i / x)), r1 * Math.sin(2 * Math.PI * (i / x)), h1]));
        newElementList[1].push([i, 0]);
        newElementList[1].push([i, n + 2 * i]);
        newElementList[1].push([i, n + 2 * i + 1]);
        newElementList[2].push([3 * i + 1, 3 * i + 2, 3 * n + 2 * i]);
        newElementList[2].push([3 * i + 2, 3 * n + 2 * i + 1, 1, 3 * i]);
        base1.push(3 * i);
        for (i = 0; i < 2 * n - 1; i++) {
            //Big base's vertices.
            newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
            //Big base's edges.
            newElementList[1].push([n + i, n + i + 1]);
            //Big base.
            base2.push(3 * n + i);
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
        newElementList[1].push([n + i, n]);
        base2.push(3 * n + i);
        for (i = 0; i < 2 * n + 2; i++)
            newElementList[3][0].push(i);
        return new polytopeTypes_1.PolytopeC(newElementList, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Cupola, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d])));
    }
    ;
    //Creates an {n / d} cuploid with regular faces.
    static cuploid(n, d) {
        if (d === undefined)
            d = 1;
        let x = n / d, r1 = 1 / (2 * Math.sin(Math.PI / x)), //Radius of the smaller base.
        r2 = 1 / (2 * Math.sin(Math.PI / (2 * x))), //Radius of the larger base.
        t = 1 / (2 * Math.tan(Math.PI / x)) - 1 / (2 * Math.tan(Math.PI / (2 * x))), //Temporary variable.
        h0 = Math.sqrt(1 - t * t), //Distance between bases.
        h1 = ((r2 * r2 - r1 * r1) / h0 + h0) / 2, //Distance between circumcenter and smaller base.
        h2 = h1 - h0; //Distance between circumcenter and larger base.
        let base = [], newElementList = [[], [], [base], [[]]]; //List of elements of the cupola.
        let i;
        for (i = 0; i < n - 1; i++) {
            //Small base's vertices.
            newElementList[0].push(new point_1.Point([r1 * Math.cos(2 * Math.PI * (i / x)), r1 * Math.sin(2 * Math.PI * (i / x)), h1]));
            //Small base's edges.
            newElementList[1].push([i, i + 1]);
            //Connecting edges.
            newElementList[1].push([i, n + (2 * i) % n]);
            newElementList[1].push([i, n + (2 * i + 1) % n]);
            //Triangles.
            newElementList[2].push([3 * i + 1, 3 * i + 2, 3 * n + (2 * i) % n]);
            //Squares.
            newElementList[2].push([3 * i + 2, 3 * n + (2 * i + 1) % n, 3 * i + 4, 3 * i]);
            //Small base.
            base.push(3 * i);
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r1 * Math.cos(2 * Math.PI * (i / x)), r1 * Math.sin(2 * Math.PI * (i / x)), h1]));
        newElementList[1].push([i, 0]);
        newElementList[1].push([i, 2 * i]);
        newElementList[1].push([i, 2 * i + 1]);
        newElementList[2].push([3 * i + 1, 3 * i + 2, 2 * n + 2 * i]);
        newElementList[2].push([3 * i + 2, 2 * n + 2 * i + 1, 1, 3 * i]);
        base.push(3 * i);
        for (i = 0; i < n - 1; i++) {
            //Big base's vertices.
            newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
            //Big base's edges.
            newElementList[1].push([n + i, n + i + 1]);
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
        newElementList[1].push([n + i, n]);
        for (i = 0; i < 2 * n + 1; i++)
            newElementList[3][0].push(i);
        return new polytopeTypes_1.PolytopeC(newElementList, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Cuploid, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d])));
    }
    ;
    //Creates an {n / d} cupolaic blend with regular faces.
    static cupolaicBlend(n, d) {
        if (d === undefined)
            d = 1;
        let x = n / d, r1 = 1 / (2 * Math.sin(Math.PI / x)), //Radius of the smaller base.
        r2 = 1 / (2 * Math.sin(Math.PI / (2 * x))), //Radius of the larger base.
        t = 1 / (2 * Math.tan(Math.PI / x)) - 1 / (2 * Math.tan(Math.PI / (2 * x))), //Temporary variable.
        h0 = Math.sqrt(1 - t * t), //Distance between bases.
        h1 = ((r2 * r2 - r1 * r1) / h0 + h0) / 2, //Distance between circumcenter and smaller base.
        h2 = h1 - h0; //Distance between circumcenter and larger base.
        let base1 = [], base2 = [], newElementList = [[], [], [base1, base2], [[]]]; //List of elements of the cupola.
        let even = true;
        let i;
        for (i = 0; i < 2 * (n - 1); i++) {
            //Small bases' vertices.
            newElementList[0].push(new point_1.Point([r1 * Math.cos(Math.PI * (i / x)), r1 * Math.sin(Math.PI * (i / x)), h1]));
            //Small bases' edges.
            newElementList[1].push([i, i + 2]);
            //Connecting edges.
            newElementList[1].push([i, 2 * n + i]);
            newElementList[1].push([i, 2 * n + i + 1]);
            //Triangles.
            newElementList[2].push([3 * i + 1, 3 * i + 2, 6 * n + i]);
            //Squares.
            newElementList[2].push([3 * i + 2, 6 * n + i + 1, 3 * i + 7, 3 * i]);
            //Small base.
            if (even)
                base1.push(3 * i);
            else
                base2.push(3 * i);
            even = !even;
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r1 * Math.cos(Math.PI * (i / x)), r1 * Math.sin(Math.PI * (i / x)), h1]));
        newElementList[1].push([i, 0]);
        newElementList[1].push([i, 2 * n + i]);
        newElementList[1].push([i, 2 * n + i + 1]);
        newElementList[2].push([3 * i + 1, 3 * i + 2, 6 * n + i]);
        newElementList[2].push([3 * i + 2, 6 * n + i + 1, 1, 3 * i]);
        base1.push(3 * i);
        i++;
        newElementList[0].push(new point_1.Point([r1 * Math.cos(Math.PI * (i / x)), r1 * Math.sin(Math.PI * (i / x)), h1]));
        newElementList[1].push([i, 1]);
        newElementList[1].push([i, 2 * n + i]);
        newElementList[1].push([i, 2 * n]);
        newElementList[2].push([3 * i + 1, 3 * i + 2, 6 * n + i]);
        newElementList[2].push([3 * i + 2, 6 * n, 4, 3 * i]);
        base2.push(3 * i);
        for (i = 0; i < 2 * n - 1; i++) {
            //Big base's vertices.
            newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
            //Big base's edges.
            newElementList[1].push([2 * n + i, 2 * n + i + 1]);
        }
        //Adds last elements.
        newElementList[0].push(new point_1.Point([r2 * Math.cos(Math.PI * ((i - 0.5) / x)), r2 * Math.sin(Math.PI * ((i - 0.5) / x)), h2]));
        newElementList[1].push([2 * n + i, 2 * n]);
        for (i = 0; i < 2 * n + 1; i++)
            newElementList[3][0].push(i);
        return new polytopeTypes_1.PolytopeC(newElementList, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.CupolaicBlend, new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Polygon, [n, d])));
    }
    ;
}
exports.PolytopeBuild = PolytopeBuild;
//Extrudes a polytope to a pyramid with an apex at the specified point.
//Constructs pyramids out of elements recursively.
//The ith n-element in the original polytope gets extruded to the
//(i+[(n+1)-elements in the original polytope])th element in the new polytope.
/*
//Generates the petrie dual of a polytope
petrial(): Polytope{
  gNodes = this.polytopeToGraph();
  var faces = [];
  var edges = [];
  var edgeCount = [];
  for(var f = 0; f < this.elementList[2].length; f++) {
    adjVerts = this.adjacentEls(2, f, 2);
    build_faces:
    for(sVert in adjVerts) {
      var nVert = undefined
      while(nVert != sVert) {
        //Oh god, this one definition relies on so many things being in sync
        nEdge = [this.elementList[0].indexOf(sVert), gNodes[this.elementList[0].indexOf(sVert)].neighbors[0].value];
        //newEdge is an array of the indexes of the points that make up the new edge: [a, b]
        switch(edgeCount[nEdge.toString()]) {
          case undefined:
            edgeCount[nEdge.toString()] = 1;
            edges.push(nEdge);
            break;
          case 1:
            edgeCount[nEdge.toString()] = 2;
            break;
          case 2:
            break build_faces;
        };
        nVert = nEdge[1];
        //Select nEdge's adjacent face
        //Set f to the index of newEdge's adjacent face
      }

    }
  }
};
*/
/**
 * Returns the subelements that are adjacent to an element of elementList d layers down.
 * @param {number} type The index of the type of element in newElementList.
 * @param {number} elem The index of the element selected.
 * @param {number} d The subelement type (type-d) you want from elem.
 * @returns {Point | number[]} The adjacent subelements in an array.
 * @todo Check the typing (I don't trust that I did it correctly -- URL).
 */
/*adjacentEls(type: number, elem: number, d: number): Point | number[] {
  let down = 1;
  let P = this.toPolytopeC();
  let subels = P.elementList[type][elem];
  let subelsTemp: Point | number[] = [];
  while(down < d) {
    down++;
    for(let i in subels)
      subelsTemp = [...new Set(subelsTemp.concat(P.elementList[type - 1][i]))];
    subels = subelsTemp;
    type--;
  }
  return subels;
};


*/
//Builds a n/d star with edge length s.
//If n and d are not coprime, a regular polygon compound is made instead.
//In the future, should be replaced by the PolytopeS version.
/*
//Returns if two elements of the same type are adjacent
//TODO: maybe adjust this so it works for elements of different types too?
Polytope.checkAdjacent = function(otherelement) {
  return this.some(item => otherelement.includes(item));
}
*/
/**
 * Extrudes a polytope into a pyramid.
 * @param  {(Point|number)} apex The apex of the pyramid, or its height.
 * @returns {Polytope} The resulting pyramid.
 */
polytopeTypes_1.PolytopeB.prototype.extrudeToPyramid = function (apex) {
    let P = this.toPolytopeC();
    if (!P.elementList[0])
        return new polytopeTypes_1.PolytopeC([[new point_1.Point([])]]);
    let els, i;
    //If the height was passed instead, builds a point from there.
    if (typeof apex === 'number') {
        let newApex = [];
        for (let i = 0; i < P.dimensions; i++)
            newApex.push(0);
        newApex.push(apex);
        apex = new point_1.Point(newApex);
    }
    P.dimensions++;
    P.elementList.push([]);
    let oldElNumbers = [];
    for (i = 0; i <= P.dimensions; i++)
        oldElNumbers.push(P.elementList[i].length);
    //Adds apex.
    P.elementList[0].push(apex);
    P.setSpaceDimensions(Math.max(apex.dimensions(), P.spaceDimensions));
    //Adds edges.
    if (P.elementList[1]) {
        for (i = 0; i < oldElNumbers[0]; i++)
            P.elementList[1].push([i, oldElNumbers[0]]);
    }
    //Adds remaining elements.
    for (var d = 2; d <= P.dimensions; d++) {
        for (i = 0; i < oldElNumbers[d - 1]; i++) {
            els = [i];
            for (var j = 0; j < P.elementList[d - 1][i].length; j++)
                els.push(P.elementList[d - 1][i][j] + oldElNumbers[d - 1]);
            P.elementList[d].push(els);
        }
    }
    var construction = new constructionNode_1.ConstructionNode(constructionNode_1.ConstructionNodeType.Pyramid, P.construction);
    P.construction = construction;
    return P;
};
//# sourceMappingURL=polytopeBuild.js.map