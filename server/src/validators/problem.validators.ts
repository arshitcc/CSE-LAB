import { body } from "express-validator";
import { Difficulty } from "../generated/prisma";

const createProblemValidators = () => {
  return [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Problem Title is required")
      .isLength({ min: 5, max: 100 })
      .withMessage("Problem Title must be between 5 and 100 characters"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Problem Description is required")
      .isLength({ min: 5, max: 1000 })
      .withMessage("Problem Description must be between 5 and 100 characters"),

    body("difficulty")
      .trim()
      .notEmpty()
      .withMessage("Problem Difficulty is required")
      .isIn(Object.values(Difficulty))
      .withMessage("Problem Difficulty must be Easy, Medium or Hard"),

    body("tags")
      .isArray()
      .withMessage("Tags must be an array")
      .custom((tags) => tags.every((tag: string) => tag?.trim().length > 0))
      .withMessage("Tags must not be empty"),

    body("hints")
      .optional()
      .isArray()
      .withMessage("Hints must be an array")
      .custom((hints: string[]) => {
        // custom always run even if optional
        if (!hints) return true;
        return hints.every((hint) => hint?.trim().length > 0);
      })
      .withMessage("Each hint must be a non-empty string"),

    body("examples")
      .isArray()
      .withMessage("Examples must be an array")
      .custom(
        (
          examples: Array<{
            input: string;
            output: string;
            explaination?: string;
          }>,
        ) =>
          examples.every(
            (example) =>
              example.input?.trim().length > 0 &&
              example.output?.trim().length > 0,
          ),
      )
      .withMessage("Provide Valid Input and Output examples"),

    body("constraints")
      .isArray()
      .withMessage("Constraints must be an array")
      .custom((constraints: string[]) =>
        constraints.every((constraint) => constraint?.trim().length > 0),
      )
      .withMessage("Provide Valid String"),

    body("testCases")
      .isArray()
      .withMessage("Testcases must be an array")
      .custom((testcases: Array<{ input: string; expectedOutput: string }>) =>
        testcases.every(
          (testcase) =>
            testcase.input?.trim().length > 0 &&
            testcase.expectedOutput?.trim().length > 0,
        ),
      )
      .withMessage("Provide Valid Input and Output testcases"),

    body("preCodeSnippets")
      .isArray()
      .withMessage("Pre Code Snippets must be an array")
      .custom((preCodeSnippets: { language: string; preCode: string }[]) =>
        preCodeSnippets.every(
          (preCodeSnippet) =>
            preCodeSnippet.language?.trim().length > 0 &&
            preCodeSnippet.preCode?.trim().length > 0,
        ),
      )
      .withMessage("Provide Valid Language and Pre-Code Snippets"),

    body("referenceSolutions")
      .isArray()
      .withMessage("Reference Solutions must be an array")
      .custom((referenceSolutions: { language: string; solutionCode: string }[]) =>
        referenceSolutions.every(
          (referenceSolution) =>
            referenceSolution.language?.trim().length > 0 &&
            referenceSolution.solutionCode?.trim().length > 0,
        ),
      )
      .withMessage("Provide Valid Language and Reference Solutions"),
  ];
};

export { createProblemValidators };
