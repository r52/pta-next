interface PriceListing {
  name: string;
  price: {
    irate?: PriceRate;
    erate?: PriceRate;
    amount?: number;
    currency?: string;
  };
  rate?: string;
  quality?: string;
  level?: string;
  age: string;
}

interface PriceRate {
  amount: number;
  currency: string;
}

// Incomplete QTree model
// https://quasar.dev/vue-components/tree#Nodes-model-structure
interface QTreeModel {
  label: string;
  children?: QTreeModel[];
}

// Incomplete schema of results from https://www.pathofexile.com/trade
interface PoETradeResults {
  result: PoETradeListing[];
  options: QTreeModel[] | null;
  forcetab: boolean;
  exchange: boolean;
  siteurl: string;
}

interface PoETradeListing {
  id: string;
  listing: {
    indexed: string;
    whisper: string;

    account: {
      name: string;
      lastCharacterName: string;
      language: string;
    };

    price: {
      amount?: number;
      currency?: string;

      exchange?: {
        amount: number;
        currency: string;
      };

      item?: {
        amount: number;
        currency: string;
      };
    };
  };

  item: {
    properties: {
      name: string;
      values: [(string | number)[]];
    }[];
  };
}

// Incomplete schema of results from https://www.poeprices.info
interface PoEPricesPrediction {
  error: number;
  min: number;
  max: number;
  currency: string;
  pred_confidence_score: number;
  pred_explanation: (string | number)[][];
}
