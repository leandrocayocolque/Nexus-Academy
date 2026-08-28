import { AiProvider } from './ai.provider.js';

export class FakeAiAdapter extends AiProvider {
  async recommendCourses() {
    return [];
  }
}
