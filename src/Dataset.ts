
export type CaseType = 'confirmed' | 'recovered' | 'deaths';
export const caseTypes: CaseType[] = ['confirmed', 'recovered', 'deaths'];

export interface Datapoint {
    confirmed: number;
    recovered: number;
    deaths: number;
    active?: number;
}

export interface DatasetGroup {
    [name: string]: Dataset;
}

type TimeSeriesData = Record<string, Datapoint>;

export interface DatasetInterface {
    name: string;
    data: TimeSeriesData;
    subsets: Record<string, DatasetInterface>;
}

export interface DatasetToObjectOptions
{
    skipMissingDates: boolean;
    minCases: number;
}

export class Dataset {
    public name: string;

    private subsets: DatasetGroup = {};

    private totalConfirmed: number = 0;

    private data: Map<string, Datapoint> = new Map();

    private dates: string[];

    constructor(name: string, dates: string[]) {
        this.dates = dates;
        this.name = name;
    }

    public addDatapoint(datapoint: Datapoint, date: string) {
        if (!this.data.has(date)) {
            this.data.set(date, {
                ...datapoint,
            });
            this.totalConfirmed = datapoint.confirmed;
        }
        // else if (this.data.get(date)!.combined) {
        else {
            const existingData = this.data.get(date)!;
            for (let key of caseTypes) {
                if (typeof(datapoint[key]) !== 'number') {
                    continue;
                }
                if (typeof(existingData[key]) !== 'number') {
                    existingData[key] = datapoint[key];
                }
                else {
                    existingData[key] += datapoint[key];
                }
            }

            if (existingData.confirmed > this.totalConfirmed) {
                this.totalConfirmed = existingData.confirmed;
            }
        }
    }

    public addDataset(dataset: Dataset) {
        this.subsets[dataset.name] = dataset;

        const cases: Map<string, Datapoint> = dataset.data;

        for (let date of cases.keys()) {
            this.addDatapoint(cases.get(date)!, date);
        }
    }

    private static timeseriesMapToObject(dates: string[], data: Map<string, Datapoint>, options: DatasetToObjectOptions): Record<string, Datapoint> {
        const ret: {
            [date: string]: Datapoint;
        } = {};

        for (let key of data.keys()) {
            const datapoint: Datapoint = {...data.get(key)!};
            datapoint.active = datapoint.confirmed - (datapoint.recovered + datapoint.deaths);

            ret[key] = datapoint;
        }
        for (let date of dates) {
            if (ret[date] == undefined && !options.skipMissingDates) {
                ret[date] = {
                    confirmed: 0,
                    recovered: 0,
                    deaths: 0,
                    active: 0,
                }
            }
        }

        return ret;
    }

    public toObject(options: DatasetToObjectOptions): DatasetInterface {
        const subsetMap: {[name: string]: DatasetInterface} = {};

        for (let name of Object.keys(this.subsets)) {
            if(name === '' ) {
                continue
            }
            // Optionally skip "small" datasets.
            if (this.subsets[name].totalConfirmed <= options.minCases) {
                continue
            }

            subsetMap[name] = this.subsets[name].toObject(options);
        }

        const ret = {
            name: this.name,
            data: Dataset.timeseriesMapToObject(this.dates, this.data, options),
            subsets: subsetMap
        };

        return ret;
    }
}

