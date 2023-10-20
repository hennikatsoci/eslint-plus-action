"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintChangedFiles = void 0;
const tslib_1 = require("tslib");
const eslint_1 = require("eslint");
const fs_1 = require("./fs");
const api_1 = require("./api");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const markdown_1 = require("./utils/markdown");
function lintChangedFiles(client, data) {
    var _a, e_1, _b, _c;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const eslintConfig = {
            extensions: data.eslint.extensions,
            ignore: data.eslint.useEslintIgnore,
            useEslintrc: data.eslint.useEslintrc,
            rulePaths: data.eslint.rulePaths,
            errorOnUnmatchedPattern: data.eslint.errorOnUnmatchedPattern,
            fix: data.eslint.fix,
            overrideConfigFile: data.eslint.configFile,
        };
        console.log('[ESLINT] Run With Configuration ', eslintConfig);
        const eslint = new eslint_1.ESLint(eslintConfig);
        const updateCheck = yield (0, api_1.createCheck)(client, data);
        try {
            for (var _d = true, _e = tslib_1.__asyncValues((0, fs_1.getChangedFiles)(client, data)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const changed = _c;
                if (changed.length === 0) {
                    break;
                }
                const results = yield eslint.lintFiles(changed);
                const output = (0, utils_1.processLintResults)(eslint, results, data);
                if (output.annotations && output.annotations.length > 0) {
                    const annotations = [...(output.annotations || [])];
                    const batches = [];
                    while (annotations.length > 0) {
                        batches.push(annotations.splice(0, constants_1.GITHUB_ANNOTATION_LIMIT));
                    }
                    yield Promise.all(batches.map((batch) => updateCheck({
                        status: 'in_progress',
                        output: {
                            title: constants_1.NAME,
                            summary: `${data.state.errorCount} error(s) found so far`,
                            annotations: data.reportSuggestions
                                ? batch.map((annotation) => {
                                    return Object.assign(Object.assign({}, annotation), { message: `${annotation.message}\n\n${(0, markdown_1.getAnnotationSuggestions)(annotation)}` });
                                })
                                : batch,
                        },
                    })));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        data.state.conclusion = data.state.errorCount > 0 ? 'failure' : 'success';
        yield updateCheck({
            conclusion: data.state.conclusion,
            status: 'completed',
            completed_at: new Date().toISOString(),
            output: {
                title: 'Checks Complete',
                summary: (0, markdown_1.getLintSummary)(data) + (0, markdown_1.getIgnoredFilesSummary)(data, true),
            },
        });
    });
}
exports.lintChangedFiles = lintChangedFiles;
