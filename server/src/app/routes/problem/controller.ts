import { CustomRequest } from "../auth/controller";
import { Response } from "express";
import asyncHandler from "../../../utils/async-handler";
import { ApiResponse } from "../../../utils/api-response";
import { ApiError } from "../../../utils/api-error";
import { uploadFile } from "../../../utils/cloudinary";
import { db } from "../../../db/db";
import {
  createBatchSubmission,
  getBatchSubmission,
  getLanguageId,
} from "../../../libs/judge0.lib";

const createProblem = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const {
      title,
      description,
      difficulty,
      tags,
      hints,
      examples,
      constraints,
      testCases,
      preCodeSnippets,
      referenceSolutions,
    } = req.body;


    const existingProblem = await db.problem.findFirst({
      where: {
        title,
      },
    });

    if(existingProblem){
      throw new ApiError(400, "Problem already exists");
    }

    // let judge0SubmissionsResult = {};

    // for (let referenceSolution of referenceSolutions) {
    //   const languageId = getLanguageId(
    //     referenceSolution.language.toUpperCase(),
    //   );

    //   if (!languageId) {
    //     throw new ApiError(
    //       400,
    //       `${referenceSolution.language} is not a supported language.`,
    //     );
    //   }

    //   const judge0SubmissionsFormat = testCases.map(
    //     ({
    //       input,
    //       expectedOutput,
    //     }: {
    //       input: string;
    //       expectedOutput: string;
    //     }) => ({
    //       language_id: languageId,
    //       source_code: referenceSolution.solutionCode,
    //       stdin: input,
    //       expected_output: expectedOutput,
    //     }),
    //   );


    //   const submissionTokens = await createBatchSubmission(
    //     judge0SubmissionsFormat,
    //   );

    //   const tokens = submissionTokens.map((res) => res.token);

    //   judge0SubmissionsResult = await getBatchSubmission(tokens, testCases);
    // }

    const attachmentsPaths = req.files as Express.Multer.File[];

    let attachments = [];
    if (attachmentsPaths && attachmentsPaths.length > 0) {
      for (const file of attachmentsPaths) {
        const attachment = await uploadFile(file.path);
        attachments.push(attachment);
      }
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        hints,
        attachments,
        examples,
        constraints,
        testCases,
        preCodeSnippets,
        referenceSolutions,
        createdById: req.user.id,
      },
    });

    if (!newProblem) {
      throw new ApiError(500, "Something went wrong while creating problem");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Problem created successfully",
          newProblem,
        ),
      );
  },
);

const updateProblem = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { problemId } = req.params;

    const {
      title,
      description,
      difficulty,
      tags,
      hints,
      examples,
      constraints,
      testCases,
      preCodeSnippets,
      referenceSolutions,
    } = req.body;

    // let judge0SubmissionsResult = {};

    // for (let referenceSolution of referenceSolutions) {
    //   const languageId = getLanguageId(
    //     referenceSolution.language.toUpperCase(),
    //   );

    //   if (!languageId) {
    //     throw new ApiError(
    //       400,
    //       `${referenceSolution.language} is not a supported language.`,
    //     );
    //   }

    //   const judge0SubmissionsFormat = testCases.map(
    //     ({
    //       input,
    //       expectedOutput,
    //     }: {
    //       input: string;
    //       expectedOutput: string;
    //     }) => ({
    //       language_id: languageId,
    //       source_code: referenceSolution.code,
    //       stdin: input,
    //       expected_output: expectedOutput,
    //     }),
    //   );

    //   const submissionTokens = await createBatchSubmission(
    //     judge0SubmissionsFormat,
    //   );
    //   const tokens = submissionTokens.map((res) => res.token);
    //   judge0SubmissionsResult = await getBatchSubmission(tokens, testCases);
    // }

    const updatedProblem = await db.problem.update({
      where: {
        id: problemId,
      },
      data: {
        title,
        description,
        difficulty,
        tags,
        hints,
        examples,
        constraints,
        testCases,
        preCodeSnippets,
        referenceSolutions,
      },
    });

    if (!updatedProblem) {
      throw new ApiError(500, "Something went wrong while updating problem");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Problem updated successfully",
          updatedProblem,
        ),
      );
  },
);

const deleteProblem = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { problemId } = req.params;

    const deletedProblem = await db.problem.delete({
      where: {
        id: problemId,
      },
    });

    if (!deletedProblem) {
      throw new ApiError(500, "Something went wrong while deleting problem");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Problem deleted successfully"));
  },
);

const getProblemById = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { problemId } = req.params;

    const problem = await db.problem.findUnique({
      where: {
        id: problemId,
      },
    });

    if (!problem) {
      throw new ApiError(404, "Problem not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Problem fetched successfully", problem),
      );
  },
);

const getAllProblems = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { page, limit } = req.query;

    const problems = await db.problem.findMany({
      skip: (Number(page) - 1) * Number(limit || 10),
      take: Number(limit || 10),
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!problems) {
      throw new ApiError(500, "Something went wrong while fetching problems");
    }

    if (!problems.length) {
      throw new ApiError(404, "No problems found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Problems fetched successfully", problems),
      );
  },
);

const getUserSolvedProblems = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { page, limit } = req.query;

    const problems = await db.problem.findMany({
      skip: (Number(page) - 1) * Number(limit || 10),
      take: Number(limit || 10),
      where: {
        solvedBy: {
          some: {
            userId: req.user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!problems) {
      throw new ApiError(500, "Something went wrong while fetching problems");
    }

    if (!problems.length) {
      throw new ApiError(404, "No problems found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Problems fetched successfully", problems),
      );
  },
);

export {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblems,
  getUserSolvedProblems,
};
