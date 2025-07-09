import { getLocation } from '@/main/service/chat/tools-client/location.js';

export function clientToolCall(toolName: string) {
  if (toolName === 'getLocation') {
    return getLocation();
  }

  return null;
}
