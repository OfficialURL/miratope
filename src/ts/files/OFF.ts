import { PolytopeB } from "../polytopes/types";
import * as Message from "../Translation/Basic/Message";
import { Language } from "../Translation/Language";
import * as Library from "./Library";

export interface OFFOptions {
  comments?: boolean;
}

/**
 * Saves the current polytope as an OFF file.
 *
 * @param polytope The polytope to be saved.
 * @param options The file saving options.
 */
export const saveAsOFF = function (
  polytope: PolytopeB,
  options: OFFOptions = {}
): void {
  const P = polytope.toPolytopeC();

  // Maybe automatically project the polytope?
  if (P.spaceDimensions > P.dimensions) {
    throw new Error(
      "The OFF format does not support polytopes in spaces with more dimensions than themselves."
    );
  }

  // The contexts of the OFF file, as an array of plaintext strings.
  const data: string[] = [];
  // I should be using precise counts here.
  const pluralAndUppercase = { count: 1000, uppercase: true };
  const comments = options.comments;

  // The element counts of the polytope, as strings.
  const elementCounts: number[] = [];
  for (let i = 0; i < P.elementList.length; i++) {
    elementCounts.push(P.elementList[i].length);
  }

  // Writes the element counts, and optionally,
  // leaves a comment listing their names in order.
  switch (P.dimensions) {
    case -1: // LMAO
      data.push("-1OFF");
      break;
    case 0: // LOL
      data.push("0OFF");
      break;
    case 1: // Also LOL
      data.push("1OFF\n");
      if (comments) {
        data.push("# ", Language.element(0, pluralAndUppercase), "\n");
      }
      data.push(elementCounts[0].toString(), "\n");
      break;
    case 2:
      data.push("2OFF\n");
      if (comments) {
        data.push(
          "# ",
          Language.element(0, pluralAndUppercase),
          ", ",
          Message.get("misc/component", pluralAndUppercase),
          "\n"
        );
      }
      data.push(
        elementCounts[0].toString(),
        " ",
        elementCounts[2].toString(),
        "\n"
      );
      break;
    case 3:
      data.push("OFF\n"); // For compatibility with Stella.
      if (comments) {
        data.push(
          "# ",
          Language.element(0, pluralAndUppercase),
          ", ",
          Language.element(2, pluralAndUppercase),
          ", ",
          Language.element(1, pluralAndUppercase),
          "\n"
        );
      }
      data.push(
        elementCounts[0].toString(),
        " ",
        elementCounts[2].toString(),
        " ",
        elementCounts[1].toString(),
        "\n"
      );
      break;
    default:
      data.push(P.dimensions.toString(), "OFF\n");
      if (comments) {
        data.push(
          "# ",
          Language.element(0, pluralAndUppercase),
          ", ",
          Language.element(2, pluralAndUppercase),
          ", ",
          Language.element(1, pluralAndUppercase)
        );
        for (let i = 3; i < P.dimensions; i++) {
          data.push(", ", Language.element(i, pluralAndUppercase));
        }
        data.push("\n");
      }
      data.push(
        elementCounts[0].toString(),
        " ",
        elementCounts[2].toString(),
        " ",
        elementCounts[1].toString(),
        " "
      );
      for (let i = 3; i < P.dimensions - 1; i++) {
        data.push(elementCounts[i].toString(), " ");
      }
      data.push(elementCounts[P.dimensions - 1].toString(), "\n");
  }

  // Adds vertices. Fills in zeros if spaceDimensions < dimensions.
  if (comments)
    data.push("\n# ", Language.element(0, pluralAndUppercase), "\n");

  if (P.elementList[0]) {
    for (let i = 0; i < P.elementList[0].length; i++) {
      for (let j = 0; j < P.dimensions - 1; j++) {
        const coord = P.elementList[0][i].coordinates[j];
        if (coord === undefined) data.push("0 ");
        else data.push(coord.toString(), " ");
      }
      const coord = P.elementList[0][i].coordinates[P.dimensions - 1];
      if (coord === undefined) data.push("0\n");
      else data.push(coord.toString(), "\n");
    }
  }

  // Adds faces, or copmonents for compound polygons.
  if (P.elementList[2]) {
    if (comments) {
      if (P.dimensions === 2) {
        data.push(
          "\n# ",
          Message.get("misc/component", pluralAndUppercase),
          "\n"
        );
      } else data.push("\n# ", Language.element(2, pluralAndUppercase), "\n");
    }
    for (let i = 0; i < elementCounts[2]; i++) {
      const vertices = P.faceToVertices(i);
      data.push(P.elementList[2][i].length.toString());
      for (let j = 0; j < P.elementList[2][i].length; j++) {
        data.push(" ", vertices[j].toString());
      }
      data.push("\n");
    }
  }

  // Adds the rest of the elements.
  for (let d = 3; d < P.dimensions; d++) {
    if (comments) {
      data.push("\n# ", Language.element(d, pluralAndUppercase), "\n");
    }
    for (let i = 0; i < P.elementList[d].length; i++) {
      const len: number = (P.elementList[d] as number[][])[i].length;
      data.push(len.toString());
      for (let j = 0; j < len; j++) data.push(" ", P.elementList[d][i][j]);
      data.push("\n");
    }
  }

  Library.setFileName(Message.firstToUpper(P.getName()) + ".off");
  Library.saveBlob(new Blob(data, { type: "text/plain" }));
};
