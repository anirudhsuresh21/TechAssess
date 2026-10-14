import vm from 'vm';

export interface CodeExecutionResult {
  passed: boolean;
  testCaseResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
  }>;
  totalPassed: number;
  totalCases: number;
  executionTimeMs: number;
}

/**
 * Isolated JS code execution sandbox for algorithmic questions.
 * Enforces a strict timeout (1500ms), isolated context (no access to require, process, fs, fetch, network).
 */
export async function executeCandidateCode(
  code: string,
  testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>
): Promise<CodeExecutionResult> {
  const startTime = Date.now();
  const results = [];
  let passedCount = 0;

  for (const tc of testCases) {
    let actualOutput = '';
    let hasError = false;
    let errorMessage = '';

    try {
      // Create fresh sandbox with zero network/fs access
      const sandboxLogs: string[] = [];
      const sandbox = {
        console: {
          log: (...args: any[]) => {
            sandboxLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          },
        },
        input: tc.input,
      };

      const context = vm.createContext(sandbox);

      // Wrapper script
      const scriptCode = `
        ${code}
        if (typeof solution === 'function') {
          const res = solution(input);
          if (res !== undefined) console.log(res);
        }
      `;

      const script = new vm.Script(scriptCode);
      script.runInContext(context, {
        timeout: 1500, // strict 1.5s execution limit
        displayErrors: true,
      });

      actualOutput = sandboxLogs.join('\n').trim();
    } catch (err: any) {
      hasError = true;
      errorMessage = err.message || 'Execution error';
      actualOutput = `Error: ${errorMessage}`;
    }

    const expectedTrimmed = tc.expectedOutput.trim();
    const passed = !hasError && actualOutput === expectedTrimmed;

    if (passed) passedCount++;

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      passed,
      error: hasError ? errorMessage : undefined,
    });
  }

  return {
    passed: passedCount === testCases.length,
    testCaseResults: results,
    totalPassed: passedCount,
    totalCases: testCases.length,
    executionTimeMs: Date.now() - startTime,
  };
}
