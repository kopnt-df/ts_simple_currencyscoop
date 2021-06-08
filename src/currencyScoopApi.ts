/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Npm
import tiny from 'tiny-json-http';

// Local
import { CurrencyRates, CurrencyCache } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ---------------------------------------------------- class: CurrencyScoopApi --------------------------------------------------- */

export class CurrencyScoopApi {

    /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

    constructor(
        apiKey: string,
        maxCacheAgeMs: number = 1000*60*60
    ) {
        this.apiKey = apiKey
        this.maxCacheAgeMs = maxCacheAgeMs
        this.cache = {}
    }


    /* --------------------------------------------------- Public properties -------------------------------------------------- */

    apiKey: string
    maxCacheAgeMs: number


    /* -------------------------------------------------- Private properties -------------------------------------------------- */

    private baseURL = 'https://api.currencyscoop.com/v1'

    private cache: {
        [key: string]: CurrencyCache
    }


    /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

    getRates(
        base: string = 'USD',
        symbols?: string[]
    ) {
        return new Promise<CurrencyRates>((resolve, reject) => {
            this._getRates(base)
            .then(currencyRates => {
                if (symbols != null) {
                    for (let currencyKey of Object.keys(currencyRates.rates)) {
                        if (!symbols.includes(currencyKey)){
                            delete currencyRates.rates[currencyKey]
                        }
                    }
                }

                resolve(currencyRates)
            })
            .catch(err => reject(err))
        })
    }


    /* ---------------------------------------------------- Private methods --------------------------------------------------- */

    private _getRates(
        base: string
    ) {
        return new Promise<CurrencyRates>((resolve, reject) => {
            const cache = this.getCache(base)

            if (cache != null) {
                resolve({
                    base: cache.base,
                    rates: cache.rates
                })

                return
            }

            this.getRatesFromApi(base)
            .then(rates => {
                this.cacheRates(base, rates)

                resolve({
                    base: base,
                    rates: rates
                })
            })
            .catch(err => reject(err))
        })
    }

    private getRatesFromApi(
        base: string
    ) {
        return new Promise<{
            [key: string]: number
        }>((resolve, reject) => {
            tiny.get({ url: `${this.baseURL}/latest?api_key=${this.apiKey}&base=${base}` })
            .then(result => {
                const responseCode = result.body['meta']['code']

                if (responseCode == 200) {
                    resolve(result.body['response']['rates'])

                    return
                }

                reject(result.body['meta']['disclaimer'])
            })
            .catch(err => reject(err))
        })
    }

    private getCache(
        base: string
    ): CurrencyCache | null {
        const currencyCache = this.cache[base]

        return currencyCache != null && Date.now() - currencyCache.lastUpdateMs <= this.maxCacheAgeMs ? currencyCache : null
    }

    private cacheRates(
        base: string,
        rates: {
            [key: string]: number
        }
    ) {
        this.cache[base] = {
            base: base,
            lastUpdateMs: Date.now(),
            rates: rates
        }
    }

}


/* -------------------------------------------------------------------------------------------------------------------------------- */