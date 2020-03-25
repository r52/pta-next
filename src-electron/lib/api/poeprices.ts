import axios from 'axios';
import log from 'electron-log';
import { PTA } from '../../lib/pta';
import apis from '../../lib/api/apis';

export function searchPoePricesInfo(event: Electron.IpcMainEvent, item: Item) {
  let itemText = item.origtext;

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

  const url = apis.poeprices + 'l=' + league + '&i=' + itemData;

  axios.get(url).then((response: any) => {
    const data = response.data;

    if (data == null) {
      log.warn('poeprices.info: Error querying poeprices.info');
      log.warn('poeprices.info: Site returned no data');
      event.reply('error', 'Error querying poeprices.info');
      return;
    }

    if (data['error'] != 0) {
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
