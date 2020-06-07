import { parse } from '@vanillaes/csv'
import * as fs from 'fs';
import * as path from 'path';

import { caseTypes, Dataset } from './Dataset';

export interface RegExpMap {
    [key: string]: RegExp;
}

export class DirParser {
    private globe: Map<string, Map<string, Dataset>> = new Map();

    public dates: string[] = [];

    private getRegion(countryName: string, province: string): Dataset {
        if (!this.globe.has(countryName)) {
            this.globe.set(countryName, new Map());
        }

        const country = this.globe.get(countryName)!;

        if (!country.has(province)) {
            // Note: this.dates may not have all the dates at this point in time if
            // we are not done processing the directory yet, but since the array is
            // a reference, it will have all the dates by the time this is needed.
            let dataset = new Dataset(province, this.dates);

            dataset.name = province;

            country.set(province, dataset);
        }

        const region = country.get(province)!;

        return region;
    }

    constructor (dataDir: string, fieldNames: RegExpMap) {
        fs.readdirSync(dataDir).filter((filename) => {
            return filename.endsWith('.csv');
        }).sort().forEach((csvFilename) => {
            const date = new Date(csvFilename.substring(0, 10)).toISOString().substring(0,10);
            this.dates.push(date);

            const csvData = fs.readFileSync(path.join(dataDir, csvFilename));
            const rows: string[][] = parse(csvData.toString());

            const header = rows[0];
            const data = rows.slice(1);

            const fields: Map<string, number> = new Map();

            for (let key of Object.keys(fieldNames)) {
                const regex: RegExp = fieldNames[key];

                const index: number = header.findIndex((headerField) => {
                    return headerField.match(regex);
                });

                if (index < 0) {
                    throw new Error(`Could not find '${regex}' in ${csvFilename}`);
                }
                fields.set(key, index);
            }

            for (let dataRow of data) {
                // Skip blank lines
                if(dataRow.length <= 1) {
                    continue;
                }

                const country = dataRow[fields.get('country')!].trim();
                const province = dataRow[fields.get('province')!].trim();
                const dataset = this.getRegion(country, province);

                dataset.addDatapoint({
                    confirmed: Number(dataRow[fields.get('confirmed')!]),
                    recovered: Number(dataRow[fields.get('recovered')!]),
                    deaths: Number(dataRow[fields.get('deaths')!]),
                }, date);
            }
        });

    }

    public getDataset(): Dataset {
        const globalDataset = new Dataset('Global', this.dates);

        for (let countryName of this.globe.keys()) {
            const country = new Dataset(countryName, this.dates);
            if(this.globe.get(countryName)!.has('')){
                country.addDataset(this.globe.get(countryName)!.get('')!);
            }
            for (let province of this.globe.get(countryName)!.keys()) {
                if (province === '') {
                    continue;
                }
                country.addDataset(this.globe.get(countryName)!.get(province)!);
            }
            globalDataset.addDataset(country);
        }

        return globalDataset;
    }
}
