import { Seeder } from 'mongoose-data-seed';
import Trigger from '../src/models/trigger';

const data = [
  { trigger: 'darkness' },
  { trigger: 'savathun' },
  { trigger: 'savathûn' },
  { trigger: 'pyramid' },
  { trigger: 'garden' },
  { trigger: 'osiris' },
  { trigger: 'crow' },
];
/**
 * Seeder class for triggers
 */
class TriggersSeeder extends Seeder {
  /**
   *
   * @return {boolean} if collection is empty
   */
  async shouldRun() {
    return Trigger.countDocuments()
      .exec()
      .then((count) => count === 0);
  }
  /**
   *
   * @return {object} trigger objects
   */
  async run() {
    return Trigger.create(data);
  }
}

export default TriggersSeeder;
