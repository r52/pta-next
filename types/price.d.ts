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
