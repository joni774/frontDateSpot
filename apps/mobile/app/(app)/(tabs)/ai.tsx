/** AI bot tab — instant place recommendations. */
import { useLocalSearchParams } from "expo-router";
import { AiChatView } from "../../../src/components/AiChatView";

export default function AiTabScreen() {
  const { prompt, promptTs } = useLocalSearchParams<{
    prompt?: string | string[];
    promptTs?: string | string[];
  }>();

  const initialPrompt = Array.isArray(prompt) ? prompt[0] : prompt;
  const promptNonce = Array.isArray(promptTs) ? promptTs[0] : promptTs;

  return <AiChatView initialPrompt={initialPrompt} promptNonce={promptNonce} />;
}
