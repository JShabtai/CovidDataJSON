import { parse } from '@vanillaes/csv'
import * as fs from 'fs';
import * as path from 'path';

import commandLineArgs from 'command-line-args';

import { DatasetToObjectOptions } from './Dataset';

const optionDefinitions = [
    { name: 'minCases', alias: 'm', defaultValue: 0, type: Number },
    { name: 'skipMissingDates', alias: 'a', defaultValue: false, type: Boolean },
];

const options = commandLineArgs(optionDefinitions) as DatasetToObjectOptions;

import { caseTypes, Dataset } from './Dataset';
import { DirParser, RegExpMap } from './DirParser';

const dataDirGlobal = 'COVID-19/csse_covid_19_data/csse_covid_19_daily_reports';

const globalFieldNames: RegExpMap = {
    province: /Province.State/,
    country: /Country.Region/,
    confirmed: /Confirmed/,
    deaths: /Deaths/,
    recovered: /Recovered/,
};

const globaldir = new DirParser(dataDirGlobal, globalFieldNames);
const globalDataset = globaldir.getDataset();

console.log(JSON.stringify(globalDataset.toObject(options)));
