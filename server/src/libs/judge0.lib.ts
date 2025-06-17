import axios from "axios";
import { Submission } from "../generated/prisma";
import { JUDGE0_API_URL } from "../utils/env";
import { ApiError } from "../utils/api-error";
import http from "http";

const getLanguageId = (language: string) => {
  const supportedLanguages = {
    PYTHON: 71,
    C: 50,
    CPP: 54,
    JAVA: 62,
    JAVASCRIPT: 63,
  };

  return supportedLanguages[
    language.toUpperCase() as keyof typeof supportedLanguages
  ];
};

interface Judge0SubmissionFormat {
  language_id: number;
  source_code: string;
  stdin: string;
  expected_output: string;
}

interface Judge0SubmissionResultFormat {
  stdout: string;
  time: string;
  memory: string;
  stderr: string;
  token: string;
  compile_output: string;
  message: string;
  status: {
    id: number;
    description: string;
  };
}

const createBatchSubmission = async (submissions: Judge0SubmissionFormat[]) => {
  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,
    { submissions }, {proxy : false, httpAgent : new http.Agent({ keepAlive: true })}
  );

  return response.data as Array<{ token: string }>;
};

const getBatchSubmission = async (
  tokens: string[],
  testCases: { input: string; output: string }[],
) => {
  while (true) {
    const joinedTokens = tokens.join(",");
    const response = await axios.get(`${JUDGE0_API_URL}/submissions/batch`, {
      params: {
        tokens: joinedTokens,
        base64_encoded: false,
      },
    });

    const submissionResults = response.data.submissions;

    submissionResults.some(
      (submission: Judge0SubmissionResultFormat, index: number) => {
        if (submission.status.id > 3) {
          throw new ApiError(
            400,
            `${submission.status.description} for test case ${
              index + 1
            } out of ${testCases.length}`,
            {
              input: testCases[index].input,
              expectedOutput: testCases[index].output,
            },
          );
        }
      },
    );

    const isAllExecuted = submissionResults.every(
      (submission: Judge0SubmissionResultFormat) => submission.status.id > 2,
    );

    if (isAllExecuted) return submissionResults;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export { getLanguageId, createBatchSubmission, getBatchSubmission };
