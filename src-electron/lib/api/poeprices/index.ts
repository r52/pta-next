import axios from 'axios';
import cfg from 'electron-cfg';
import log from 'electron-log';
import MultiMap from 'multimap';

import { PTA } from '../../pta';
import Config from '../../config';
import URLs from '../urls';

export class POEPricesAPI implements PriceAPI {
  private uniques: MultiMap;

  constructor(uniques: MultiMap) {
    this.uniques = uniques;
  }

  public searchItemWithDefaults(event: Electron.IpcMainEvent, item: Item) {
    const usepoeprices = cfg.get(Config.poeprices, Config.default.poeprices);

    let isUniqueBase = false;

    if (
      (item.category == 'map' && item.rarity == 'Rare') ||
      item.name == null
    ) {
      isUniqueBase = this.uniques.has(item.type);
    } else {
      isUniqueBase = this.uniques.has(item.name);
    }

    if (usepoeprices && !isUniqueBase && item.rarity != 'Magic') {
      let itemText = String(item.origtext);

      itemText = itemText.replace(/<<.*?>>|<.*?>/g, '');

      // Remove notes
      const lines = itemText.trim().split('\n');

      if (lines[lines.length - 1].startsWith('Note:')) {
        lines.pop();
        lines.pop();
      }

      itemText = lines.join('\n');

      const itemData = Buffer.from(itemText, 'binary').toString('base64');

      const league = PTA.getInstance().getLeague();

      const url = URLs.poeprices + 'l=' + league + '&i=' + itemData;

      axios.get<PoEPricesPrediction>(url).then(response => {
        const data = response.data;

        if (data == null) {
          log.warn('poeprices.info: Error querying poeprices.info');
          log.warn('poeprices.info: Site returned no data');
          event.reply('error', 'Error querying poeprices.info');
          return;
        }

        if (data.error != 0) {
          log.warn('poeprices.info: Error querying poeprices.info');
          log.warn('poeprices.info: Site responded with', data);
          event.reply('error', 'Error querying poeprices.info');
          return;
        }

        if (!('min' in data) || !('max' in data)) {
          log.info(
            'poeprices.info: No prediction data available from poeprices.info for this item.'
          );
          event.reply(
            'error',
            'No prediction data available from poeprices.info for this item.'
          );
          return;
        }

        event.reply('prediction', data);
      });
    }
  }
}
