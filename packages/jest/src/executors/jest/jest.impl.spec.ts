import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

let runCLI = jest.fn();
jest.mock('jest', () => ({
  runCLI,
}));

import { jestExecutor } from './jest.impl';
import { JestExecutorOptions } from './schema';

describe('Jest Executor', () => {
  let mockContext: ExecutorContext;
  const defaultOptions: Omit<JestExecutorOptions, 'jestConfig'> = {
    testPathPattern: [],
  };

  beforeEach(async () => {
    runCLI.mockReturnValue(
      Promise.resolve({
        results: {
          success: true,
        },
      })
    );

    mockContext = {
      root: '/root',
      projectName: 'proj',
      workspace: {
        version: 2,
        projects: {
          proj: {
            root: 'proj',
            targets: {
              test: {
                executor: '@nrwl/jest:jest',
              },
            },
          },
        },
      },
      target: {
        executor: '@nrwl/jest:jest',
      },
      cwd: '/root',
      isVerbose: true,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('when the jest config file is untouched', () => {
    beforeEach(() => {
      jest.mock(
        '/root/jest.config.js',
        () => ({
          transform: {
            '^.+\\.[tj]sx?$': 'ts-jest',
          },
        }),
        { virtual: true }
      );
    });

    it('should send appropriate options to jestCLI', async () => {
      await jestExecutor(
        {
          ...defaultOptions,
          jestConfig: './jest.config.js',
          watch: false,
        },
        mockContext
      );
      expect(runCLI).toHaveBeenCalledWith(
        jasmine.objectContaining({
          _: [],
          testPathPattern: [],
          watch: false,
        }),
        ['/root/jest.config.js']
      );
    });

    it('should send appropriate options to jestCLI when testFile is specified', async () => {
      await jestExecutor(
        {
          testFile: 'lib.spec.ts',
          jestConfig: './jest.config.js',
          codeCoverage: false,
          runInBand: true,
          testNamePattern: 'should load',
          testPathPattern: ['/test/path'],
          colors: false,
          reporters: ['/test/path'],
          verbose: false,
          coverageReporters: ['test'],
          coverageDirectory: '/test/coverage',
          watch: false,
        },
        mockContext
      );

      expect(runCLI).toHaveBeenCalledWith(
        jasmine.objectContaining({
          _: ['lib.spec.ts'],
          coverage: false,
          runInBand: true,
          testNamePattern: 'should load',
          testPathPattern: ['/test/path'],
          colors: false,
          reporters: ['/test/path'],
          verbose: false,
          coverageReporters: ['test'],
          coverageDirectory: '/root/test/coverage',
          watch: false,
        }),
        ['/root/jest.config.js']
      );
    });

    it('should send appropriate options to jestCLI when findRelatedTests is specified', async () => {
      await jestExecutor(
        {
          ...defaultOptions,
          findRelatedTests: 'file1.ts,file2.ts',
          jestConfig: './jest.config.js',
          codeCoverage: false,
          runInBand: true,
          testNamePattern: 'should load',
          watch: false,
        },
        mockContext
      );

      expect(runCLI).toHaveBeenCalledWith(
        jasmine.objectContaining({
          _: ['file1.ts', 'file2.ts'],
          coverage: false,
          findRelatedTests: true,
          runInBand: true,
          testNamePattern: 'should load',
          testPathPattern: [],
          watch: false,
        }),
        ['/root/jest.config.js']
      );
    });

    it('should send other options to jestCLI', async () => {
      await jestExecutor(
        {
          jestConfig: './jest.config.js',
          codeCoverage: true,
          bail: 1,
          color: false,
          ci: true,
          detectOpenHandles: true,
          json: true,
          maxWorkers: 2,
          onlyChanged: true,
          outputFile: 'abc.txt',
          passWithNoTests: true,
          showConfig: true,
          silent: true,
          testNamePattern: 'test',
          testPathPattern: ['/test/path'],
          colors: false,
          reporters: ['/test/path'],
          verbose: false,
          coverageReporters: ['test'],
          coverageDirectory: '/test/coverage',
          testResultsProcessor: 'results-processor',
          updateSnapshot: true,
          useStderr: true,
          watch: false,
          watchAll: false,
          testLocationInResults: true,
        },
        mockContext
      );
      expect(runCLI).toHaveBeenCalledWith(
        {
          _: [],
          coverage: true,
          bail: 1,
          color: false,
          ci: true,
          detectOpenHandles: true,
          json: true,
          maxWorkers: 2,
          onlyChanged: true,
          outputFile: 'abc.txt',
          passWithNoTests: true,
          showConfig: true,
          silent: true,
          testNamePattern: 'test',
          testPathPattern: ['/test/path'],
          colors: false,
          verbose: false,
          reporters: ['/test/path'],
          coverageReporters: ['test'],
          coverageDirectory: '/root/test/coverage',
          testResultsProcessor: 'results-processor',
          updateSnapshot: true,
          useStderr: true,
          watch: false,
          watchAll: false,
          testLocationInResults: true,
        },
        ['/root/jest.config.js']
      );
    });

    it('should support passing string type for maxWorkers option to jestCLI', async () => {
      await jestExecutor(
        {
          ...defaultOptions,
          jestConfig: './jest.config.js',
          maxWorkers: '50%',
        },
        mockContext
      );
      expect(runCLI).toHaveBeenCalledWith(
        {
          _: [],
          maxWorkers: '50%',
          testPathPattern: [],
        },
        ['/root/jest.config.js']
      );
    });

    it('should send the main to runCLI', async () => {
      await jestExecutor(
        {
          ...defaultOptions,
          jestConfig: './jest.config.js',
          setupFile: './test-setup.ts',
          watch: false,
        },
        mockContext
      );
      expect(runCLI).toHaveBeenCalledWith(
        jasmine.objectContaining({
          _: [],
          setupFilesAfterEnv: ['/root/test-setup.ts'],
          testPathPattern: [],
          watch: false,
        }),
        ['/root/jest.config.js']
      );
    });

    describe('when the jest config file has been modified', () => {
      beforeAll(() => {
        jest.doMock(
          '/root/jest.config.js',
          () => ({
            transform: {
              '^.+\\.[tj]sx?$': 'ts-jest',
            },
            globals: { hereToStay: true, 'ts-jest': { diagnostics: false } },
          }),
          { virtual: true }
        );
      });

      it('should merge the globals property from jest config', async () => {
        await jestExecutor(
          {
            ...defaultOptions,
            jestConfig: './jest.config.js',
            setupFile: './test-setup.ts',
            watch: false,
          },
          mockContext
        );

        expect(runCLI).toHaveBeenCalledWith(
          jasmine.objectContaining({
            _: [],
            setupFilesAfterEnv: ['/root/test-setup.ts'],
            testPathPattern: [],
            watch: false,
          }),
          ['/root/jest.config.js']
        );
      });
    });

    describe('when we use babel-jest', () => {
      beforeEach(() => {
        jest.doMock(
          '/root/jest.config.js',
          () => ({
            transform: {
              '^.+\\.[tj]sx?$': 'babel-jest',
            },
          }),
          { virtual: true }
        );
      });

      it('should send appropriate options to jestCLI', async () => {
        const options: JestExecutorOptions = {
          ...defaultOptions,
          jestConfig: './jest.config.js',
          watch: false,
        };

        await jestExecutor(options, mockContext);
        expect(runCLI).toHaveBeenCalledWith(
          jasmine.objectContaining({
            _: [],
            testPathPattern: [],
            watch: false,
          }),
          ['/root/jest.config.js']
        );
      });
    });

    describe('when the user tries to use babel-jest AND ts-jest', () => {
      beforeEach(() => {
        jest.doMock(
          '/root/jest.config.js',
          () => ({
            transform: {
              '^.+\\.tsx?$': 'ts-jest',
              '^.+\\.jsx?$': 'babel-jest',
            },
          }),
          { virtual: true }
        );
      });

      it('should throw an appropriate error', async () => {
        const options: JestExecutorOptions = {
          jestConfig: './jest.config.js',
          watch: false,
        };

        try {
          await jestExecutor(options, mockContext);
        } catch (e) {
          expect(e.message).toMatch(
            /Using babel-jest and ts-jest together is not supported/
          );
        }
      });
    });
  });
});
