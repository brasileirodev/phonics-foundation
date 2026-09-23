import type { EvaluationService } from '../../application/ports';
import type { Evaluation } from '../../domain/models';
export class SimulatedEvaluator implements EvaluationService {
  async evaluate(): Promise<Evaluation> {
    return { success: true, simulated: true, provider: 'deterministic-mock' };
  }
}
