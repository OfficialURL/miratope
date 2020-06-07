"use strict";

//Represents a polytope as a convex hull.
//Will be merged with PolytopeC.
class PolytopeV extends Polytope {
	constructor(vertices, dimensions) {
		super();
		this.vertices = vertices;
		this.dimensions = dimensions; //Is not necessarily the number of dimensions of the vertices!
	}
	
	//Calculates the centroid as the average of the vertices.
	centroid() {
		var res = this.vertices[0].clone();
		for(var i = 1; i < this.vertices.length; i++)
			res.add(this.vertices[i]);
		res.divideBy(this.vertices.length);
		return res;
	}
}

//Represents a polytope as a list of elements, in ascending order of dimensions, similar to (but not the same as) an OFF file.
//We don't only store the facets, because we don't want to deal with O(2^n) code.
//Subelements stored as indices.
class PolytopeC extends Polytope {
	constructor(elementList, dimensions) {
		super();
		this.elementList = elementList;
		this.dimensions = dimensions;
	}
	
	//Builds a hypercube in the specified amount of dimensions.
	//Positioned in the standard orientation with edge length 1.
	static hypercube(dimensions) {
		var els = []; //Elements is a reserved word.
		for(var i = 0; i <= dimensions; i++)
			els.push([]);
		//Mapping from pairs of the indices below to indices of the corresponding els.
		var locations = {};
		//i and i^j are the indices of the vertices of the current subelement.
		//i^j is used instead of j to ensure that facets of els
		//are generated before the corresponding element.
		for(var i = 0; i < 2 ** dimensions; i++) {
			for(var j = 0; j < 2 ** dimensions; j++) {
				//If the indices are the same, this is a vertex
				if(i == 0) {
					var coordinates = [];
					for(var k = 1; k <= dimensions; k++) 
						coordinates.push(j % (2 ** k) < 2 ** (k - 1) ? 0.5 : -0.5);
					locations[j] = {0:els[0].length};
					els[0].push(new Point(coordinates));
					continue;
				}
				//To avoid redundancy, i^j should be >=i using the obvious partial ordering on bitstrings.
				//This is equivalent to i and j being disjoint
				if((j & i) != 0)
					continue;
				//Everything else is a higher-dimensional element
				var elementDimension = 0;
				var difference = i;
				var differences = [];
				while(difference > 0) {
					elementDimension++;
					differences.push(difference & ~(difference - 1));
					difference = difference & (difference - 1);
				}
				var facets = [];
				//facets connected to i
				for(var k = 0; k < differences.length; k++)
					facets.push(locations[j][i ^ differences[k]]);
				//facets connected to i^j
				for(var k = 0; k < differences.length; k++)
					facets.push(locations[j ^ differences[k]][i ^ differences[k]]);
				locations[j][i] = els[elementDimension].length;
				els[elementDimension].push(facets);
			}
		}

		return new PolytopeC(els, dimensions);
	}
	
	//Builds a simplex in the specified amount of dimensions.
	//Implements the more complicated coordinates in the space of the same dimension.
	static simplex(dimensions) {
		var vertices = [];
		var aux = [Infinity]; //Memoizes some square roots, tiny optimization.
		for(var i = 1; i <= dimensions; i++) 
			aux.push(1/Math.sqrt(2 * i * (i + 1)));
		
		for(var i = 0; i <= dimensions ; i++) {
			var coordinates = [];
			for(var j = 1; j <= dimensions; j++) {
				if(j > i)
					coordinates.push(-aux[j]);
				else if(j === i)
					coordinates.push(j*aux[j]);
				else
					coordinates.push(0);
			}
			vertices.push(new Point(coordinates));
		}

		var els = [vertices];
		for(var i = 1; i <= dimensions; i++)
			els.push([]);
		var locations = {};
		for(var i = 0; i < dimensions + 1; i++)
			locations[2 ** i] = i;
		for(var i = 1; i < 2**(dimensions + 1); i++) {
			//Vertices were generated earlier
			if (!(i & (i - 1)))
				continue;
			var elementDimension = -1;
			var t = i;
			var elemVertices = [];
			while(t > 0) {
				elementDimension++;
				elemVertices.push(t & ~(t - 1));
				t = t & (t - 1);
			}
			var facets = [];
			for(var k = 0; k < elemVertices.length; k++)
				facets.push(locations[i ^ elemVertices[k]]);
			locations[i] = els[elementDimension].length;
			els[elementDimension].push(facets);
		}
		
		return new PolytopeC(els, dimensions);
	}
	
	//Builds a cross-polytope in the specified amount of dimensions.
	//Positioned in the standard orientation with edge length 1.
	static cross(dimensions) {
		//i is the set of nonzero dimensions, j is the set of negative dimensions
		var els = [];
		for(var i = 0; i <= dimensions; i++)
			els.push([]);
		var locations = {};
		//The full polytope is best handled separately
		for(var i = 1; i < 2 ** dimensions; i++) {
			for(var j = 0; j < 2 ** dimensions; j++) {
				//No negative zero dimensions
				if((i & j) != j)
					continue;
				if(!j)
					locations[i] = {};
				if(!(i & (i - 1))) {
					var coordinates = [];
					var sign = j ? -1 : 1;
					for(var k = 0; k < dimensions; k++) 
						coordinates.push((2 ** k) == i ? sign * Math.SQRT1_2 : 0);
					locations[i][j] = els[0].length;
					els[0].push(new Point(coordinates));
					continue;
				}
				var elementDimension = -1;
				var t = i;
				var elemVertices = [];
				while(t > 0) {
					elementDimension++;
					elemVertices.push(t & ~(t - 1));
					t = t & (t - 1);
				}
				var facets = [];
				for(var k = 0; k < elemVertices.length; k++)
					facets.push(locations[i ^ elemVertices[k]][j & ~elemVertices[k]]);
				locations[i][j] = els[elementDimension].length;
				els[elementDimension].push(facets);
			}
		}
		var facets = [];
		for(var i = 0; i < els[dimensions - 1].length; i++) {
			facets.push(i);
		}
		els[dimensions].push(facets);
		
		return new PolytopeC(els, dimensions);
	}
	
	//Calculates the centroid as the average of the vertices.
	centroid() {		
		var res = this.elementList[0][0].clone();
		for(var i = 1; i < this.elementList[0].length; i++)
			res.add(this.elementList[0][i]);
		res.divideBy(this.elementList[0].length);
		return res;
	}
	
	//Made with 3D polyhedra in mind.
	//Will probably have to implement other more complicated stuff for other dimensions.
	//Implements Bentley-Ottmann, based on the implementation at
	//http://geomalgorithms.com/a09-_intersect-3.html#Bentley-Ottmann-Algorithm
	//combined with the simplification algorithm at
	//https://web.archive.org/web/20100805164131if_/http://www.cis.southalabama.edu/~hain/general/Theses/Subramaniam_thesis.pdf	
	//to triangulate general polygons.
	//Uses arraya for EQ and SL, but AVL Trees or something similar would be much more efficient.
	//NOT YET FULLY IMPLEMENTED!
	renderTo(scene) {
		//"Cuts" edgeA and edgeB at the intersection point, adds the new directed edges according to the simplification algorithm.
		//Edges are in format [vertex1, vertex2].
		function divide(edgeA, edgeB) {
			//No point in doing anything if any of the arguments doesn't exist, or if the intersection is already its own point.
			if(edgeA === undefined || edgeB === undefined || edgeA[0].value === edgeB[0].value || edgeA[0].value === edgeB[1].value || edgeA[1].value === edgeB[0].value || edgeA[1].value === edgeB[1].value)
				return;
			
			//No point in doing anything if the intersection is non-existent.
			var inter = Space.intersect(edgeA[0].value, edgeA[1].value, edgeB[0].value, edgeB[1].value);
			if(inter === null) 
				return;
			
			//Add the intersection and a point at "infinitesimal distance" to the vertex list.
			//(I don't think they actually have to be different in my implementation of the algorithm).
			var newNode1 = new DLLNode(inter); var newNode2 = new DLLNode(inter);
			vertexDLL.push(newNode1); vertexDLL.push(newNode2);
			
			//Re-links the vertices.
			edgeA[0].linkToNext(newNode1);
			newNode1.linkToNext(edgeB[1]);
			edgeB[0].linkToNext(newNode2);
			newNode2.linkToNext(edgeA[1]);

			Sorts.binaryInsert(EQ, newNode1, EQSort);
			Sorts.binaryInsert(EQ, newNode2, EQSort);
		}
		
		//Converts an element of the sweepline in the format described below to a directed edge in the format [vertex1, vertex2].
		function SLToEdge(el) {
			if(el === undefined)
				return undefined;
			if(el[1] === 0)
				return [el[0], el[0].node0];
			return [el[0].node1, el[0]];
		}
		
		//Deletes el from the sweep line.
		//Implemented as a modified binary search, but really, SL should be a tree.
		function SLDelete(el) {
			var compareFunction = function(a, b){return Space.lineCompare(a[0].value, a[0].getNode(a[1]).value, b[0].value, b[0].getNode(b[1]).value, E.value.coordinates[0] - eps);};
			var lo = 0;
			var hi = SL.length - 1;
			var mid;
			
			//Finds lowest equivalent element.
			while (lo <= hi) {
				mid = Math.floor((lo + hi) / 2);
				
				if (compareFunction(SL[mid], el) >= 0) 
					hi = mid - 1;
				else if (compareFunction(SL[mid], el) < 0)
					lo = mid + 1;
			}
			
			while(mid < SL.length) {
				if((SL[mid][0] === el[0] && SL[mid][1] === el[1]) || 
					(SL[mid][1] === 0 && SL[mid][0].node0 === el[0]) ||
					el[0].node0 === SL[mid][0]) {
					SL.splice(mid, 1); return;
				}
				else
					mid++;
			}
			
			throw new Error("Element not found!");
		}
							
		//For each face:
		for(var i = 0; i < this.elementList[2].length; i++){
			//Enumerates the vertices in order.
			//A doubly linked list does the job easily.
			var vertexDLL = [];
			for(var j = 0; j < this.elementList[2][i].length; j++) {
				var edge = this.elementList[1][this.elementList[2][i][j]];
				if(vertexDLL[edge[0]] === undefined)
					vertexDLL[edge[0]] = new DLLNode(edge[0]);
				if(vertexDLL[edge[1]] === undefined)
					vertexDLL[edge[1]] = new DLLNode(edge[1]);
				
				vertexDLL[edge[0]].linkTo(vertexDLL[edge[1]]);				
			}			
			
			//Cycle of vertex indices.
			//"this.elementList[1][this.elementList[2][i][0]][0]" is just some vertex index.
			var cycle = vertexDLL[this.elementList[1][this.elementList[2][i][0]][0]].getCycle();
			
			//Reuses vertexDLL for the polygon's vertices and the new vertices created.
			//node0 is always the "next" vertex.
			vertexDLL = [new DLLNode(this.elementList[0][cycle[0]])];
			for(var j = 0; j < cycle.length - 1; j++) {
				vertexDLL[j + 1] = new DLLNode(this.elementList[0][cycle[j + 1]]);			
				vertexDLL[j].linkToNext(vertexDLL[j + 1]);
			}						
			vertexDLL[vertexDLL.length - 1].linkToNext(vertexDLL[0]);
			
			//Event queue for Bentley-Ottmann, stores vertices.
			var EQ = [vertexDLL[vertexDLL.length - 1]];
			for(var j = 0; j < cycle.length - 1; j++)
				EQ.push(vertexDLL[j]);
			
			//Sorts EQ by inverse lexicographic order of the vertices (EQ is read backwards at the moment).
			var EQSort = function(a, b){return -Point.lexicographic(a.value, b.value);};
			Sorts.quickSort(EQ, 0, EQ.length - 1, EQSort);
			
			//Sweep line for Bentley-Ottmann, in format [leftmostVertex, rightNodeIndex].
			//rightNodeIndex is 0 if leftmostVertex.node0.value is to the right of leftmostVertex.value, 1 otherwise.
			//This format is useful because an edge on the sweep line can only be cut to the right.
			var SL = [];
			
			//Bentley-Ottmann:
			while(EQ.length !== 0) {
				var E = EQ.pop(); //The next "event" in the event queue.
				
				//Runs this code on both edges adjacent to E's vertex.
				for(var j = 0; j <= 1; j++) {
					var edgeSL = [E, j]; //E's edge in the SL format.
					//Vertex E is a left endpoint of the edge:
					if((Point.lexicographic(E.value, E.getNode(j).value) < 0)) {
						var pos = Sorts.binaryInsert(SL, edgeSL,
							function(a, b){return Space.lineCompare(a[0].value, a[0].getNode(a[1]).value, b[0].value, b[0].getNode(b[1]).value, E.value.coordinates[0] + eps);});
						
						var edge = SLToEdge(edgeSL); //E's edge in the format [vertex1, vertex2].
						divide(edge, SLToEdge(SL[pos - 1])); //Checks for an intersection with the edge below edgeE.
						divide(edge, SLToEdge(SL[pos + 1])); //Checks for an intersection with the edge above edgeE.
					}
					//Vertex E is a right endpoint of the edge:
					else {
						SLDelete(edgeSL);
						divide(SLToEdge(SL[pos]), SLToEdge(SL[pos - 1])); //Checks for an intersection between the edges below and above edgeE.
					}
				}
			}			
			
			//Polygons as ordered sets of vertices.
			var polygons = [];
			
			//Retrieves polygonal paths from edges.
			//Could be optimized somewhat, I think (do we need to traverse the list twice?), but I first need to check that it works in concept.
			for(var j = 0; j < vertexDLL.length; j++) {
				if(!vertexDLL[j].traversed)
					polygons.push(vertexDLL[j].getCycle());
			}
			console.log(polygons);
		}		
	}
}
