import { Seeder } from 'mongoose-data-seed';
import Phrase from '../src/models/phrase';
import { data } from './starter_phrases';

/**
 * Seeder class
 */
class PhrasesSeeder extends Seeder {
  /**
   *
   * @return {boolen} if the collection is empty
   */
  async shouldRun() {
    return Phrase.countDocuments()
      .exec()
      .then((count) => count === 0);
  }
  /**
   *
   * @return {object} new phrase object
   */
  async run() {
    return Phrase.create(data);
  }
}

export default PhrasesSeeder;
