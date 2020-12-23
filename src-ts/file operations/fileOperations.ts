import * as JSZip from "jszip";
import { ConstructionNode, ConstructionNodeType } from "../data structures/constructionNode";
import { GraphNode } from "../data structures/graphNode";
import { Point } from "../geometry/point";
import { PolytopeBuild } from "../polytopes/classes/polytopeBuild";
import { ElementList, PolytopeC } from "../polytopes/polytopeTypes";
import { Translation } from "../translation/translation";
import { Caret } from "./caret";

export abstract class FileOperations {
  /**
   * Helper function for {@link Polytope.openFile},
   * and more specifically for {@link Polytope._OFFReaderOnload}.
   * Checks whether two arrays have a common element using a dictionary.
   * @private
   * @param {number[]} a The first array to check.
   * @param {number[]} b The second array to check.
   * @returns {boolean} Whether the arrays have a common element or not.
   */
  static checkCommonElements(a: number[], b: number[]): boolean {
    let vals: boolean[] = [];
    vals[a[0]] = true;

    let i: number;
    for(i = 1; i < a.length; i++) {
      if(vals[a[i]])
        return true;
      vals[a[i]] = true;
    }

    for(i = 0; i < b.length - 1; i++) {
      if(vals[b[i]])
        return true;
      vals[b[i]] = true;
    }

    return !!vals[b[i]];
  };

  //Saves the file with the given data, the given MIME type, and the given extension.
  static saveBlob(blob: Blob) {
  	var fileName = globalThis.fileName.replace("/", "_");
  	if(navigator.msSaveOrOpenBlob)
  		navigator.msSaveOrOpenBlob(blob, fileName);
  	else {
  		let a: HTMLAnchorElement = document.getElementById("download") as HTMLAnchorElement;
  		a.href = window.URL.createObjectURL(blob);
  		a.download = fileName;
  		a.click();
  		window.URL.revokeObjectURL(a.href);
  	}
  };

  /**
   * Opens a file and stores it into the global variable `P`.
   * @param {Event | string} e Either the event triggered by the import button,
   * or a local filepath.
   * @todo Replace P by scene.polytope or something similar.
   * @todo Add support for more file formats.
   * @todo Rewrite the code with npm's fs.
   */
  static openFile(e: Event | string) {
    //If e is an event.
    if(e instanceof Event) {
      let files = (<HTMLInputElement>e.target).files;
      if(!files) return;
    	let file = files[0];
    	if (!file) return;

    	let reader = new FileReader();

    	//File name of imported polytope.
      //Stored in a global variable so it can be accessed from Polytope._readerOnload.
      globalThis.fileName = file.name;

      //Extracts the filename and extension.
      var i = globalThis.fileName.lastIndexOf("."),
      ext = globalThis.fileName.substr(i + 1); //Extension of file.
      globalThis.fileName = globalThis.fileName.substr(0, i); //Removes extension from file name.
      if(Translation.language !== "de")
        globalThis.fileName = Translation.firstToLower(globalThis.fileName); //Lowercase name.

        //Handles the file according to its extension.
        switch(ext) {
          case "off":
            reader.onload = function(e: ProgressEvent<FileReader>) {
              FileOperations.onloadOFF((e.target as FileReader).result as string);
            }
      			reader.readAsText(file);
            break;
          case "ggb":
      			reader.onload = function(e: ProgressEvent<FileReader>) {
              if(e.target!.result)
                JSZip.loadAsync(e.target!.result).then(
                  function(zip: any) {
                    zip.file("geogebra.xml").async("string").then(
                      FileOperations.onloadGGB
                    )
                  }
                );
            };
      			reader.readAsArrayBuffer(file);
            break;
        }
    }
    //If e is a string.
    else {
      globalThis.fileName = e;

      //Extracts the filename and extension.
      var i = globalThis.fileName.lastIndexOf("."),
      ext = globalThis.fileName.substr(i + 1); //Extension of file.
      globalThis.fileName = globalThis.fileName.substr(0, i); //Removes extension from file name.
      if(Translation.language !== "de")
        globalThis.fileName = Translation.firstToLower(globalThis.fileName); //Lowercase name.

      //Reads the file as an OFF file.
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        //this.status === 0 is for debug purposes only!
        if (this.readyState === 4 && this.status === 200)
          FileOperations.onloadOFF(this.responseText);
      };
      xhttp.open("GET", e, true);
      xhttp.send();
    }
  };

  /**
   * A GGB file is really just a ZIP file in disguise.
   * This ZIP file contains an XML called geogebra.xml.
   * This function will be called with this XML's data as a string.
   * It will store the 3D polyhedron into the global variable `P`.
   * @summary Stores the polyhedron described by an XML file
   * into the global variable `P`.
   * @private
   * @param {string} contents The contents of the file.
   * @todo Load the polyhedron into a scene,
   * instead of loading it into a global variable.
   */
  static onloadGGB(contents: string) {
  	const caret = new Caret(contents);
    let elementList: ElementList = [[], [], [], []];
    let vertDict: {[key: string]: number} = {}; //Dictionary to convert from GeoGebra point names to indices.
    let edgeDict: {[key: number]: number} = {}; //Dictionary to convert from edges to indices.
    const lst = ['<element type="point"', '<element type="point3d"', '<command name="Polygon">'];

    WHILELOOP:
    while(true) {
      switch(caret.skipToStringList(lst)) {
        case -1: //EOF.
          break WHILELOOP;
        case 0: { //Reading a 2D point.
          //Reads the point name.
          caret.skipToString('label="');
          vertDict[caret.readUntil('"')] = elementList[0].length;

          //Reads the coordinates.
          caret.skipToString('<coords x="');
          let x = caret.readNumber(); caret.advance(5);
          let y = caret.readNumber(); caret.advance(5);
          let z = caret.readNumber(); caret.advance(5);
          x /= z; y /= z; z /= z;

          elementList[0].push(new Point([x, y, 0]));
          break;
        }
        case 1: { //Reading a 3D point.
          //Reads the point name.
          caret.skipToString('label="');
          vertDict[caret.readUntil('"')] = elementList[0].length;

          //Reads the coordinates.
          caret.skipToString('<coords x="');
          let x = caret.readNumber(); caret.advance(5);
          let y = caret.readNumber(); caret.advance(5);
          let z = caret.readNumber(); caret.advance(5);
          let w = caret.readNumber(); caret.advance(5);
          x /= w; y /= w; z /= w;

          elementList[0].push(new Point([x, y, z]));
          break;
        }
        case 2: { //Reading a polygon.
          //Reads vertex names.
          caret.skipToString('<input a0=');
          let verts: number[] = [];
          while(caret.getChar() !== '/') {
            caret.skipToChar('"'); caret.increment();
            var str = caret.readUntil('"');
            verts.push(vertDict[str]);
            caret.increment();
          }
          verts.push(verts[0]); //Simulates a cyclic order.

          //Adds edges.
          let edges: number[] = [];
          for(let i = 0; i < verts.length - 1; i++) {
            //Orders the edge, so that their key (identifier) is unique.
            let edge: [number, number] = [verts[i], verts[i + 1]];
            if(edge[0] > edge[1]) {
              let t = edge[0];
              edge[0] = edge[1];
              edge[1] = t;
            }

            //Adds the edge to elementList if needed.
            let key: string = edge[0] + "_" + edge[1];
            if(edgeDict[key] === undefined) {
              edgeDict[key] = elementList[1].length;
              elementList[1].push(edge);
            }

            edges.push(edgeDict[key]);
          }

          //Adds faces.
          elementList[2].push(edges);
          break;
        }
      }
    }

    //Gets components.
    //Graph of incidences between facets.
    let graph: GraphNode<number>[] = [];
    let facets = elementList[2];
    for(let i = 0; i < facets.length; i++)
      graph.push(new GraphNode(i));

    //Calculates incidences.
    for(let i = 0; i < facets.length; i++)
      for(let j = i + 1; j < facets.length; j++)
        if(FileOperations.checkCommonElements(facets[i], facets[j]))
          graph[i].connectTo(graph[j]);

    //Gets components.
    for(let i = 0; i < facets.length; i++) {
      let component = graph[i].getComponent();
      if(component)
        elementList[3].push(component);
    }

    globalThis.P = new PolytopeC(elementList);
  };

  /**
   * Helper function for {@link Polytope.openFile}.
   * Is called when an OFF file is loaded.
   * @private
   * @param {string} contents The contents of the file.
   */
  static onloadOFF(contents: string): void {
  	let caret = new Caret(contents); //Caret for reading the OFF file.
  	let dimensions = caret.readNumber(); //The number of dimensions of the OFF file's polytope.
  	let edgeList: number[] = []; //A dictionary mapping hashes of pairs of integers to edge indices.
  	let elementCount: number[] = []; //The amount of vertices, edges, faces... elementCount[1] goes unused except for the special case of 2D components.
  	let elementList: ElementList = [[]]; //The elements of the described polytope.

  	//The file just starts with OFF.
  	if(isNaN(dimensions))
  		dimensions = 3;

  	//Checks that the word OFF is the next thing on the file.
  	if(caret.readWord() !== "OFF")
  		caret.throwError("invalidFile");

  	//Nullitope
  	if(dimensions === -1) {
  		globalThis.P = PolytopeBuild.nullitope();
  		return;
  	}

  	//Point
  	if(dimensions === 0) {
  		globalThis.P = PolytopeBuild.point();
  		return;
  	}

  	//Reads vertex amount.
  	if(dimensions >= 1) {
  		elementCount.push(caret.readNumber());
  		elementList.push([]);
  	}

  	//Reads face and edge amounts.
  	if(dimensions >= 3) {
  		elementCount.push(0, caret.readNumber());
  		caret.readWord(); //We *can't* actually care about the edge amount, since Stella itself ignores it.
  		elementList.push([], []);
  	}

  	//Reads component amount in the special 2OFF case.
  	else if(dimensions === 2) {
  		elementCount.push(0, caret.readNumber());
  		elementList.push([]);
  	}

  	//Reads higher element amounts.
  	for(let i = 3; i < dimensions; i++) {
  		elementCount.push(caret.readNumber());
  		elementList.push([]);
  	}

  	//Adds vertices.
  	for(let i = 0; i < elementCount[0]; i++) {
  		let coords: number[] = [];
  		for(let j = 0; j < dimensions; j++)
  			coords.push(caret.readNumber());
  		elementList[0].push(new Point(coords));
  	}

  	if(dimensions >= 2) {
  		//Adds faces and edges (or compounds in the special case).
  		for(let i = 0; i < elementCount[2]; i++) {
  			let indices: number[] = [];
  			let face: number[] = [];
  			let elCount = caret.readNumber();

  			//Retrieves vertices.
  			for(let j = 0; j < elCount; j++)
  				indices.push(caret.readNumber());

  			//Creates edges.
  			for(let j = 0; j < elCount - 1; j++) {
  				//Orders the edge's vertices.
  				let x = indices[j];
  				let y = indices[j + 1];
  				if(x < y) {
  					let t = x;
  					x = y;
  					y = t;
  				}
  				let t = (x + y + 1) * (x + y) / 2 + y; //Cantor pairing function.
  				if(edgeList[t] === undefined) {
  					edgeList[t] = elementList[1].length;
  					elementList[1].push([x, y]);
  				}
  				face.push(edgeList[t]);
  			}
  			//Last edge.
  			let x = indices[0];
  			let y = indices[indices.length - 1];
  			if(x < y) {
  				let t = x;
  				x = y;
  				y = t;
  			}
  			let t = (x + y + 1) * (x + y) / 2 + y; //Cantor pairing function.
  			if(edgeList[t] === undefined) {
  				edgeList[t] = elementList[1].length;
  				elementList[1].push([x, y]);
  			}
  			face.push(edgeList[t]);

  			elementList[2].push(face);
  		}
  	}

  	//Adds higher-dimensional elements.
  	for(let i = 3; i < dimensions; i++) {
  		for(let j = 0; j < elementCount[i]; j++) {
  			let indices: number[] = [];
  			let elCount = caret.readNumber();
  			for(let t = 0; t < elCount; t++)
  				indices.push(caret.readNumber());
  			(elementList[i] as number[][]).push(indices);
  		}
  	}

  	//Gets components. The 1D case is trivial.
  	if(dimensions === 1) {
  		elementList[1].push([]);
  		for(let i = 0; i < elementCount[0]; i++)
  			elementList[1][0].push(i);
  	}

  	//Gets components in higher dimensions, except in 2D, where they've already been retrieved.
  	else if(dimensions >= 3) {
  		//Graph of incidences between facets.
  		let graph: GraphNode<number>[] = [];
  		let facets: number[][] = elementList[dimensions - 1] as number[][];
  		for(let i = 0; i < facets.length; i++)
  			graph.push(new GraphNode(i));

  		//Calculates incidences.
  		for(let i = 0; i < facets.length; i++)
  			for(let j = i + 1; j < facets.length; j++)
  				if(FileOperations.checkCommonElements(facets[i], facets[j]))
  					graph[i].connectTo(graph[j]);

  		//Gets components.
  		for(let i = 0; i < facets.length; i++) {
  			let component = graph[i].getComponent();
  			if(component)
  				(elementList[elementList.length - 1] as number[][]).push(component);
  		}
  	}

  	globalThis.P = new PolytopeC(
  		elementList,
  		new ConstructionNode(
  			ConstructionNodeType.Name,
  			globalThis.fileName
  		)
  	);
  };
}