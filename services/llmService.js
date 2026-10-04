var { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
var LlmLog = require('../models/llmLog');

var MODEL_ID = 'apac.anthropic.claude-3-haiku-20240307-v1:0';
var client = new BedrockRuntimeClient({ region: 'ap-southeast-1' });

/* Send a prompt to the LLM and record the exchange in llm_logs. */
async function invoke(prompt) {
  var response = await client.send(new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: 'user', content: [{ text: prompt }] }],
  }));
  var text = response.output.message.content[0].text;
  await LlmLog.create(prompt, text);
  return text;
}

module.exports = { invoke: invoke };
