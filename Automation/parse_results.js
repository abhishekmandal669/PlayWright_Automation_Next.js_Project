const fs = require('fs');
const path = require('path');

try {
  let filePath = path.join(__dirname, 'test_results.json');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    filePath = path.join(__dirname, 'test-results.json');
  }

  let content = fs.readFileSync(filePath);
  let jsonStr = '';
  if (content[0] === 0xff && content[1] === 0xfe) {
    jsonStr = content.toString('utf16le');
  } else {
    jsonStr = content.toString('utf8');
  }

  const jsonStart = jsonStr.indexOf('{');
  if (jsonStart !== -1) {
    jsonStr = jsonStr.substring(jsonStart);
  }

  const data = JSON.parse(jsonStr);

  const failures = [];
  const passed = [];
  const flaky = [];

  function processSuite(suite) {
    if (suite.suites) {
      suite.suites.forEach(processSuite);
    }
    if (suite.specs) {
      suite.specs.forEach(spec => {
        spec.tests.forEach(t => {
          const isFlaky = t.status === 'flaky';
          const isFailed = t.status === 'unexpected';
          const isPassed = t.status === 'expected';

          if (isFailed) {
            const lastResult = t.results[t.results.length - 1];
            const errorMsg = (lastResult.error && (lastResult.error.message || lastResult.error.value)) || 'Unknown error';
            failures.push({
              file: spec.file,
              line: spec.line,
              title: spec.title,
              fullTitle: `${suite.title} > ${spec.title}`,
              error: errorMsg.replace(/\u001b\[[0-9;]*m/g, '').trim(),
            });
          } else if (isFlaky) {
            flaky.push({
              file: spec.file,
              line: spec.line,
              title: spec.title,
              fullTitle: `${suite.title} > ${spec.title}`,
            });
          } else if (isPassed) {
            passed.push({
              title: spec.title,
              file: spec.file,
            });
          }
        });
      });
    }
  }

  data.suites.forEach(processSuite);

  let output = `# Playwright Test Execution Summary\n`;
  output += `- **Total Tests**: ${passed.length + failures.length + flaky.length}\n`;
  output += `- **Passed**: ${passed.length}\n`;
  output += `- **Flaky (Passed on Retry)**: ${flaky.length}\n`;
  output += `- **Failed**: ${failures.length}\n\n`;

  if (failures.length > 0) {
    output += `## Remaining Failed Tests (${failures.length})\n\n`;
    failures.forEach((f, idx) => {
      output += `### ${idx + 1}. Test: ${f.title}\n`;
      output += `- **File**: \`${f.file}:${f.line}\`\n`;
      output += `- **Suite**: ${f.fullTitle}\n`;
      output += `- **Reason**:\n\`\`\`\n${f.error}\n\`\`\`\n\n`;
    });
  } else {
    output += `## Status: ALL TESTS PASSED SUCCESSFULLY! ✅\n\n`;
  }

  if (flaky.length > 0) {
    output += `## Flaky Tests (Auto-resolved on retry):\n`;
    flaky.forEach((f, idx) => {
      output += `${idx + 1}. \`${f.file}:${f.line}\` - ${f.title}\n`;
    });
    output += `\n`;
  }

  const issueFilePath = 'c:/Users/Abhishek Kr Mandal/Desktop/Playwright/issue.txt';
  fs.writeFileSync(issueFilePath, output, 'utf8');
  console.log(`Successfully written status: ${passed.length} Passed, ${failures.length} Failed, ${flaky.length} Flaky to issue.txt`);
} catch (err) {
  console.error('Error parsing results:', err);
}
